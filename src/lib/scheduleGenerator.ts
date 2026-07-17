import { ScheduleEntry, ScheduleSettings, ShiftTemplate, User } from '@/types';
import { computeShiftMinutes, dateKey, timeToMinutes } from './timeUtils';

export interface GenerationResult {
  entries: ScheduleEntry[];
  warnings: string[];
  success: boolean;
}

interface Params {
  year: number;
  month: number; // 1-12
  employees: User[];
  templates: ShiftTemplate[];
  settings: ScheduleSettings;
  keepDayOffs?: ScheduleEntry[];
}

interface Interval {
  id: string;
  s: number;
  e: number;
  tpl: ShiftTemplate;
}

/** Greedy minimum-cover of [covStart, covEnd] using template intervals. */
function minimumCoverSet(templates: ShiftTemplate[], covStart: number, covEnd: number): Interval[] | null {
  const intervals: Interval[] = templates.map(t => {
    const s = timeToMinutes(t.startTime);
    let e = timeToMinutes(t.endTime);
    if (e <= s) e += 24 * 60;
    return { id: t.id, s, e, tpl: t };
  });
  const chosen: Interval[] = [];
  let pos = covStart;
  let guard = 0;
  while (pos < covEnd && guard++ < 50) {
    const candidates = intervals.filter(i => i.s <= pos && i.e > pos);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.e - a.e);
    chosen.push(candidates[0]);
    pos = candidates[0].e;
  }
  return pos >= covEnd ? chosen : null;
}

function uncoveredHours(assignedTpls: ShiftTemplate[], covStart: number, covEnd: number): string[] {
  const gaps: string[] = [];
  for (let t = covStart; t < covEnd; t += 60) {
    const covered = assignedTpls.some(tpl => {
      const s = timeToMinutes(tpl.startTime);
      let e = timeToMinutes(tpl.endTime);
      if (e <= s) e += 24 * 60;
      return t >= s && t < e;
    });
    if (!covered) {
      const h = Math.floor(t / 60);
      gaps.push(`${String(h).padStart(2, '0')}:00`);
    }
  }
  return gaps;
}

export function validateCoverage(
  entries: ScheduleEntry[],
  templates: ShiftTemplate[],
  settings: ScheduleSettings,
  year: number,
  month: number,
): { ok: boolean; problems: string[] } {
  const covStart = timeToMinutes(settings.coverageStart);
  const covEnd = timeToMinutes(settings.coverageEnd);
  const daysInMonth = new Date(year, month, 0).getDate();
  const problems: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateKey(year, month, day);
    const tpls = entries
      .filter(e => e.date === date && !e.isDayOff && e.shiftTemplateId)
      .map(e => templates.find(t => t.id === e.shiftTemplateId))
      .filter((x): x is ShiftTemplate => !!x);
    const gaps = uncoveredHours(tpls, covStart, covEnd);
    if (gaps.length) problems.push(`Dia ${day}: sem cobertura em ${gaps.join(', ')}.`);
  }
  return { ok: problems.length === 0, problems };
}

export function generateSchedule({ year, month, employees, templates, settings, keepDayOffs }: Params): GenerationResult {
  const warnings: string[] = [];
  const activeTemplates = templates.filter(t => t.active);

  if (employees.length === 0) {
    return { entries: [], warnings: ['Nenhum funcionário disponível.'], success: false };
  }
  if (activeTemplates.length === 0) {
    return { entries: [], warnings: ['Nenhum turno ativo cadastrado. Cadastre turnos na aba Configuração de Turnos.'], success: false };
  }

  const covStart = timeToMinutes(settings.coverageStart);
  const covEnd = timeToMinutes(settings.coverageEnd);
  const coverSet = minimumCoverSet(activeTemplates, covStart, covEnd);

  if (!coverSet) {
    return {
      entries: [],
      warnings: [`Os turnos cadastrados não cobrem integralmente o período ${settings.coverageStart}—${settings.coverageEnd}. Ajuste a Configuração de Turnos antes de gerar a escala.`],
      success: false,
    };
  }

  const minEmployeesNeeded = coverSet.length;
  const daysInMonth = new Date(year, month, 0).getDate();

  const entries: ScheduleEntry[] = [];
  const empTemplateCount = new Map<string, Map<string, number>>();
  employees.forEach(e => empTemplateCount.set(e.id, new Map()));
  const consecutive = new Map<string, number>(employees.map(e => [e.id, 0]));
  const daysOffCount = new Map<string, number>(employees.map(e => [e.id, 0]));

  const forcedOffs = new Map<string, Set<string>>();
  keepDayOffs?.forEach(e => {
    if (!e.isDayOff) return;
    if (!forcedOffs.has(e.date)) forcedOffs.set(e.date, new Set());
    forcedOffs.get(e.date)!.add(e.employeeId);
  });

  const blockingReports: string[] = [];
  let success = true;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateKey(year, month, day);
    const forced = forcedOffs.get(date) || new Set<string>();
    const available = employees.filter(e => !forced.has(e.id));

    // 1. Enough people to cover the operation?
    if (available.length < minEmployeesNeeded) {
      const gaps = uncoveredHours([], covStart, covEnd);
      blockingReports.push(
        `Dia ${day} (${date}): necessários ${minEmployeesNeeded} funcionários, disponíveis apenas ${available.length}. Horários sem cobertura: ${gaps.join(', ')}.`,
      );
      // Mark everyone as day-off for this date (do not save a partial day)
      employees.forEach(emp => {
        entries.push({ id: `${emp.id}-${date}`, employeeId: emp.id, date, isDayOff: true });
        consecutive.set(emp.id, 0);
        daysOffCount.set(emp.id, (daysOffCount.get(emp.id) || 0) + 1);
      });
      success = false;
      continue;
    }

    // 2. Coverage first: decide who gets a day-off ONLY from the surplus.
    const surplus = available.length - minEmployeesNeeded;
    const target = settings.daysOffPerMonth;

    // Force-off anyone hitting max consecutive days (only if surplus allows it)
    const offSet = new Set<string>();
    const mustOff = available.filter(e => (consecutive.get(e.id) || 0) >= settings.maxConsecutiveDays);
    for (const e of mustOff) {
      if (offSet.size < surplus) offSet.add(e.id);
    }
    // Fill remaining surplus with employees who still need day-offs (largest deficit first)
    const offCandidates = [...available]
      .filter(e => !offSet.has(e.id) && (daysOffCount.get(e.id) || 0) < target)
      .sort((a, b) => {
        const dA = target - (daysOffCount.get(a.id) || 0);
        const dB = target - (daysOffCount.get(b.id) || 0);
        if (dB !== dA) return dB - dA;
        return (consecutive.get(b.id) || 0) - (consecutive.get(a.id) || 0);
      });
    for (const e of offCandidates) {
      if (offSet.size >= surplus) break;
      offSet.add(e.id);
    }

    mustOff.forEach(e => {
      if (!offSet.has(e.id)) {
        warnings.push(`Dia ${day}: ${e.name} excedeu ${settings.maxConsecutiveDays} dias consecutivos, mas foi mantido para garantir cobertura.`);
      }
    });

    const workingEmps = available.filter(e => !offSet.has(e.id));

    // 3. Assign required coverage templates to the least-used employee per template (balance).
    const assignments = new Map<string, string>();
    const pool = [...workingEmps];
    for (const req of coverSet) {
      pool.sort((a, b) => {
        const ca = empTemplateCount.get(a.id)!.get(req.id) || 0;
        const cb = empTemplateCount.get(b.id)!.get(req.id) || 0;
        if (ca !== cb) return ca - cb;
        const ta = [...empTemplateCount.get(a.id)!.values()].reduce((s, v) => s + v, 0);
        const tb = [...empTemplateCount.get(b.id)!.values()].reduce((s, v) => s + v, 0);
        return ta - tb;
      });
      const picked = pool.shift();
      if (!picked) break;
      assignments.set(picked.id, req.id);
      const c = empTemplateCount.get(picked.id)!;
      c.set(req.id, (c.get(req.id) || 0) + 1);
    }

    // 4. Rotate remaining employees across all active templates (least-used-by-them first).
    for (const emp of pool) {
      const counts = empTemplateCount.get(emp.id)!;
      const sorted = [...activeTemplates].sort((a, b) => (counts.get(a.id) || 0) - (counts.get(b.id) || 0));
      const tpl = sorted[0];
      assignments.set(emp.id, tpl.id);
      counts.set(tpl.id, (counts.get(tpl.id) || 0) + 1);
    }

    // 5. Persist entries + update trackers.
    for (const emp of employees) {
      if (forced.has(emp.id) || offSet.has(emp.id)) {
        entries.push({ id: `${emp.id}-${date}`, employeeId: emp.id, date, isDayOff: true });
        consecutive.set(emp.id, 0);
        daysOffCount.set(emp.id, (daysOffCount.get(emp.id) || 0) + 1);
      } else if (assignments.has(emp.id)) {
        entries.push({
          id: `${emp.id}-${date}`,
          employeeId: emp.id,
          date,
          shiftTemplateId: assignments.get(emp.id),
          isDayOff: false,
        });
        consecutive.set(emp.id, (consecutive.get(emp.id) || 0) + 1);
      }
    }

    // 6. Re-validate coverage for this day.
    const assignedTpls = [...assignments.values()]
      .map(id => activeTemplates.find(t => t.id === id))
      .filter((x): x is ShiftTemplate => !!x);
    const gaps = uncoveredHours(assignedTpls, covStart, covEnd);
    if (gaps.length) {
      blockingReports.push(
        `Dia ${day} (${date}): mesmo com ${available.length} funcionários disponíveis (mínimo ${minEmployeesNeeded}), a rotação deixou lacunas em ${gaps.join(', ')}. Revise os turnos cadastrados.`,
      );
      success = false;
    }
  }

  return { entries, warnings: [...blockingReports, ...warnings], success };
}

export function totalMonthMinutes(employeeId: string, entries: ScheduleEntry[], templates: ShiftTemplate[]): number {
  return entries
    .filter(e => e.employeeId === employeeId && !e.isDayOff && e.shiftTemplateId)
    .reduce((sum, e) => {
      const t = templates.find(x => x.id === e.shiftTemplateId);
      if (!t) return sum;
      return sum + computeShiftMinutes(t.startTime, t.endTime, t.breakMinutes);
    }, 0);
}
