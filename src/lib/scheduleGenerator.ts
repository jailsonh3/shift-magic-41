import { ScheduleAbsence, ScheduleEntry, ScheduleSettings, ShiftTemplate, User } from '@/types';
import { computeShiftMinutes, dateKey, minutesToTime, timeToMinutes } from './timeUtils';

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
  previousEntries?: ScheduleEntry[];
  absences?: ScheduleAbsence[];
  recalculationIndex?: number;
}

interface Interval {
  id: string;
  s: number;
  e: number;
  tpl: ShiftTemplate;
}

const daysBetween = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const isRegularDayOff = (absenceType?: ScheduleEntry['absenceType']) => !absenceType || absenceType === 'dayoff';

function coverageWindow(settings: ScheduleSettings) {
  const start = timeToMinutes(settings.coverageStart);
  let end = timeToMinutes(settings.coverageEnd);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

function templateInterval(t: ShiftTemplate, covStart: number): Interval {
  let s = timeToMinutes(t.startTime);
  let e = timeToMinutes(t.endTime);
  if (e <= s) e += 24 * 60;
  if (e <= covStart) {
    s += 24 * 60;
    e += 24 * 60;
  }
  return { id: t.id, s, e, tpl: t };
}

function formatGap(start: number, end: number) {
  return `${minutesToTime(start)}—${minutesToTime(end)}`;
}

function stableBias(parts: Array<string | number>, modulus = 97): number {
  const raw = parts.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) % 1000003;
  return hash % modulus;
}

/** Greedy minimum-cover of [covStart, covEnd] using template intervals. */
function minimumCoverSet(templates: ShiftTemplate[], covStart: number, covEnd: number): Interval[] | null {
  const intervals: Interval[] = templates
    .map(t => templateInterval(t, covStart))
    .filter(i => i.e > covStart && i.s < covEnd);
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

function uncoveredRanges(assignedTpls: ShiftTemplate[], covStart: number, covEnd: number): string[] {
  const gaps: string[] = [];
  const intervals = assignedTpls
    .map(t => templateInterval(t, covStart))
    .filter(i => i.e > covStart && i.s < covEnd)
    .sort((a, b) => a.s - b.s || b.e - a.e);

  let pos = covStart;
  for (const i of intervals) {
    if (i.s > pos) gaps.push(formatGap(pos, Math.min(i.s, covEnd)));
    if (i.e > pos) pos = Math.min(i.e, covEnd);
    if (pos >= covEnd) break;
  }
  if (pos < covEnd) gaps.push(formatGap(pos, covEnd));
  return gaps;
}

function buildAbsenceMap(
  absences: ScheduleAbsence[] | undefined,
  keepDayOffs: ScheduleEntry[] | undefined,
  year: number,
  month: number,
) {
  const map = new Map<string, Map<string, ScheduleAbsence>>();
  const add = (date: string, absence: ScheduleAbsence) => {
    if (!date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) return;
    if (!map.has(date)) map.set(date, new Map());
    map.get(date)!.set(absence.employeeId, absence);
  };

  absences?.forEach(absence => {
    daysBetween(absence.startDate, absence.endDate).forEach(date => add(date, absence));
  });

  keepDayOffs?.forEach(entry => {
    if (!entry.isDayOff) return;
    add(entry.date, {
      employeeId: entry.employeeId,
      startDate: entry.date,
      endDate: entry.date,
      type: entry.absenceType || 'dayoff',
      label: 'Folga manual',
      source: 'manual',
    });
  });

  return map;
}

export function validateCoverage(
  entries: ScheduleEntry[],
  templates: ShiftTemplate[],
  settings: ScheduleSettings,
  year: number,
  month: number,
  employees?: User[],
): { ok: boolean; problems: string[] } {
  const { start: covStart, end: covEnd } = coverageWindow(settings);
  const daysInMonth = new Date(year, month, 0).getDate();
  const problems: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateKey(year, month, day);
    const tpls = entries
      .filter(e => e.date === date && !e.isDayOff && e.shiftTemplateId)
      .map(e => templates.find(t => t.id === e.shiftTemplateId))
      .filter((x): x is ShiftTemplate => !!x);
    const gaps = uncoveredRanges(tpls, covStart, covEnd);
    if (gaps.length) problems.push(`Dia ${day}: sem cobertura em ${gaps.join(', ')}.`);
  }

  const activeTemplates = templates.filter(t => t.active);
  const employeeIds = employees?.map(e => e.id) || [...new Set(entries.map(e => e.employeeId))];
  for (const employeeId of employeeIds) {
    const employeeName = employees?.find(e => e.id === employeeId)?.name || employeeId;
    const employeeEntries = entries.filter(e => e.employeeId === employeeId);
    const regularOffs = employeeEntries.filter(e => e.isDayOff && isRegularDayOff(e.absenceType)).length;
    if (regularOffs > settings.daysOffPerMonth) {
      problems.push(`${employeeName}: ${regularOffs} folgas no mês, acima do limite de ${settings.daysOffPerMonth}.`);
    }

    const workedTemplates = employeeEntries
      .filter(e => !e.isDayOff && e.shiftTemplateId)
      .map(e => e.shiftTemplateId!);
    const uniqueTemplates = new Set(workedTemplates);
    if (activeTemplates.length > 1 && workedTemplates.length >= 5 && uniqueTemplates.size === 1) {
      const tpl = templates.find(t => t.id === workedTemplates[0]);
      problems.push(`${employeeName}: permaneceu fixo no turno ${tpl?.name || workedTemplates[0]} sem rodízio.`);
    }
  }
  return { ok: problems.length === 0, problems };
}

export function generateSchedule({
  year,
  month,
  employees,
  templates,
  settings,
  keepDayOffs,
  previousEntries,
  absences,
  recalculationIndex = 0,
}: Params): GenerationResult {
  const warnings: string[] = [];
  const activeTemplates = templates.filter(t => t.active);

  if (employees.length === 0) {
    return { entries: [], warnings: ['Nenhum funcionário disponível.'], success: false };
  }
  if (activeTemplates.length === 0) {
    return { entries: [], warnings: ['Nenhum turno ativo cadastrado. Cadastre turnos na aba Configuração de Turnos.'], success: false };
  }

  const { start: covStart, end: covEnd } = coverageWindow(settings);
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
  const maxRegularOffs = Math.max(0, settings.daysOffPerMonth);
  const totalRegularOffTarget = employees.length * maxRegularOffs;

  const entries: ScheduleEntry[] = [];
  const empTemplateCount = new Map<string, Map<string, number>>();
  employees.forEach(e => empTemplateCount.set(e.id, new Map()));
  const globalTemplateCount = new Map<string, number>(activeTemplates.map(t => [t.id, 0]));
  const employeeMinutes = new Map<string, number>(employees.map(e => [e.id, 0]));
  const consecutive = new Map<string, number>(employees.map(e => [e.id, 0]));
  const daysOffCount = new Map<string, number>(employees.map(e => [e.id, 0]));
  const lastOffDay = new Map<string, number>(employees.map(e => [e.id, -999]));
  const lastTemplate = new Map<string, string | undefined>();
  const sameTemplateStreak = new Map<string, number>(employees.map(e => [e.id, 0]));
  const previousByCell = new Map<string, ScheduleEntry>();
  previousEntries?.forEach(e => previousByCell.set(`${e.employeeId}-${e.date}`, e));
  const absenceByDate = buildAbsenceMap(absences, keepDayOffs, year, month);

  const blockingReports: string[] = [];
  let success = true;
  let regularOffsAssigned = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateKey(year, month, day);
    const dayAbsences = absenceByDate.get(date) || new Map<string, ScheduleAbsence>();
    const available = employees.filter(e => !dayAbsences.has(e.id));

    // 1. Enough people to cover the operation after vacations/absences/manual restrictions.
    if (available.length < minEmployeesNeeded) {
      const gaps = uncoveredRanges([], covStart, covEnd);
      blockingReports.push(
        `Dia ${day} (${date}): necessários ${minEmployeesNeeded} funcionários para cobrir ${settings.coverageStart}—${settings.coverageEnd}, disponíveis apenas ${available.length}. Horários sem cobertura: ${gaps.join(', ')}.`,
      );
      // Mark everyone as unavailable/day-off for this date (do not save a partial day)
      employees.forEach(emp => {
        const absence = dayAbsences.get(emp.id);
        entries.push({ id: `${emp.id}-${date}`, employeeId: emp.id, date, isDayOff: true, absenceType: absence?.type || 'absence', generatedBy: absence?.source === 'manual' ? 'manual' : 'auto' });
        consecutive.set(emp.id, 0);
      });
      success = false;
      continue;
    }

    // 2. Decide regular day-offs from a monthly cap, not from every surplus worker.
    const maxOffSlotsToday = Math.max(0, available.length - minEmployeesNeeded);
    const desiredCumulativeOffs = Math.round((day / daysInMonth) * totalRegularOffTarget);
    const plannedOffSlots = Math.max(0, desiredCumulativeOffs - regularOffsAssigned);
    const offSet = new Set<string>();
    const mustRest = available.filter(e =>
      (consecutive.get(e.id) || 0) >= settings.maxConsecutiveDays &&
      (daysOffCount.get(e.id) || 0) < maxRegularOffs,
    );
    const offSlotsToday = Math.min(
      maxOffSlotsToday,
      available.filter(e => (daysOffCount.get(e.id) || 0) < maxRegularOffs).length,
      Math.max(plannedOffSlots, Math.min(mustRest.length, maxOffSlotsToday)),
    );

    const offCandidates = [...available]
      .filter(e => (daysOffCount.get(e.id) || 0) < maxRegularOffs)
      .sort((a, b) => {
        const previousA = previousByCell.get(`${a.id}-${date}`);
        const previousB = previousByCell.get(`${b.id}-${date}`);
        const scoreA =
          ((consecutive.get(a.id) || 0) >= settings.maxConsecutiveDays ? 400 : 0) +
          (consecutive.get(a.id) || 0) * 30 +
          (maxRegularOffs - (daysOffCount.get(a.id) || 0)) * 40 +
          (day - (lastOffDay.get(a.id) || -999)) * 4 +
          (previousA?.isDayOff ? -90 : 0) +
          stableBias([a.id, day, 'off', recalculationIndex], 41);
        const scoreB =
          ((consecutive.get(b.id) || 0) >= settings.maxConsecutiveDays ? 400 : 0) +
          (consecutive.get(b.id) || 0) * 30 +
          (maxRegularOffs - (daysOffCount.get(b.id) || 0)) * 40 +
          (day - (lastOffDay.get(b.id) || -999)) * 4 +
          (previousB?.isDayOff ? -90 : 0) +
          stableBias([b.id, day, 'off', recalculationIndex], 41);
        return scoreB - scoreA;
      });
    for (const e of offCandidates) {
      if (offSet.size >= offSlotsToday) break;
      offSet.add(e.id);
    }

    mustRest.forEach(e => {
      if (!offSet.has(e.id)) {
        warnings.push(`Dia ${day}: ${e.name} excedeu ${settings.maxConsecutiveDays} dias consecutivos, mas foi mantido para garantir cobertura.`);
      }
    });

    const workingEmps = available.filter(e => !offSet.has(e.id));

    // 3. Assign required coverage templates to workers with the fairest rotation score.
    const assignments = new Map<string, string>();
    const pool = [...workingEmps];
    for (const req of coverSet) {
      pool.sort((a, b) => {
        const score = (emp: User) => {
          const counts = empTemplateCount.get(emp.id)!;
          const previous = previousByCell.get(`${emp.id}-${date}`);
          const totalAssignments = [...counts.values()].reduce((s, v) => s + v, 0);
          return (
            (counts.get(req.id) || 0) * 140 +
            totalAssignments * 8 +
            (employeeMinutes.get(emp.id) || 0) / 30 +
            (lastTemplate.get(emp.id) === req.id ? 220 + (sameTemplateStreak.get(emp.id) || 0) * 110 : 0) +
            (previous?.shiftTemplateId === req.id ? 180 : 0) +
            (previous && !previous.isDayOff && previous.shiftTemplateId !== req.id ? -30 : 0) +
            stableBias([emp.id, req.id, day, recalculationIndex], 67)
          );
        };
        return score(a) - score(b);
      });
      const picked = pool.shift();
      if (!picked) break;
      assignments.set(picked.id, req.id);
    }

    // 4. Rotate remaining employees across all active templates.
    for (const emp of pool) {
      const counts = empTemplateCount.get(emp.id)!;
      const previous = previousByCell.get(`${emp.id}-${date}`);
      const sorted = [...activeTemplates].sort((a, b) => {
        const score = (tpl: ShiftTemplate) => (
          (counts.get(tpl.id) || 0) * 150 +
          (globalTemplateCount.get(tpl.id) || 0) * 5 +
          (lastTemplate.get(emp.id) === tpl.id ? 220 + (sameTemplateStreak.get(emp.id) || 0) * 110 : 0) +
          (previous?.shiftTemplateId === tpl.id ? 160 : 0) +
          (previous && !previous.isDayOff && previous.shiftTemplateId !== tpl.id ? -25 : 0) +
          stableBias([emp.id, tpl.id, day, 'extra', recalculationIndex], 73)
        );
        return score(a) - score(b);
      });
      const tpl = sorted[0];
      assignments.set(emp.id, tpl.id);
    }

    // 5. Persist entries + update trackers.
    for (const emp of employees) {
      const absence = dayAbsences.get(emp.id);
      if (absence || offSet.has(emp.id)) {
        const absenceType = absence?.type || 'dayoff';
        entries.push({
          id: `${emp.id}-${date}`,
          employeeId: emp.id,
          date,
          isDayOff: true,
          absenceType,
          generatedBy: absence?.source === 'manual' ? 'manual' : 'auto',
        });
        consecutive.set(emp.id, 0);
        sameTemplateStreak.set(emp.id, 0);
        if (isRegularDayOff(absenceType)) {
          daysOffCount.set(emp.id, (daysOffCount.get(emp.id) || 0) + 1);
          lastOffDay.set(emp.id, day);
          regularOffsAssigned += 1;
        }
      } else if (assignments.has(emp.id)) {
        const shiftTemplateId = assignments.get(emp.id)!;
        const previousTemplate = lastTemplate.get(emp.id);
        entries.push({
          id: `${emp.id}-${date}`,
          employeeId: emp.id,
          date,
          shiftTemplateId,
          isDayOff: false,
          generatedBy: 'auto',
        });
        const counts = empTemplateCount.get(emp.id)!;
        counts.set(shiftTemplateId, (counts.get(shiftTemplateId) || 0) + 1);
        globalTemplateCount.set(shiftTemplateId, (globalTemplateCount.get(shiftTemplateId) || 0) + 1);
        const tpl = activeTemplates.find(t => t.id === shiftTemplateId);
        if (tpl) employeeMinutes.set(emp.id, (employeeMinutes.get(emp.id) || 0) + computeShiftMinutes(tpl.startTime, tpl.endTime, tpl.breakMinutes));
        consecutive.set(emp.id, (consecutive.get(emp.id) || 0) + 1);
        lastTemplate.set(emp.id, shiftTemplateId);
        sameTemplateStreak.set(emp.id, previousTemplate === shiftTemplateId ? (sameTemplateStreak.get(emp.id) || 0) + 1 : 1);
      }
    }

    // 6. Re-validate coverage for this day.
    const assignedTpls = [...assignments.values()]
      .map(id => activeTemplates.find(t => t.id === id))
      .filter((x): x is ShiftTemplate => !!x);
    const gaps = uncoveredRanges(assignedTpls, covStart, covEnd);
    if (gaps.length) {
      blockingReports.push(
        `Dia ${day} (${date}): mesmo com ${available.length} funcionários disponíveis (mínimo ${minEmployeesNeeded}), a rotação deixou lacunas em ${gaps.join(', ')}. Revise os turnos cadastrados.`,
      );
      success = false;
    }
  }

  const finalValidation = validateCoverage(entries, templates, settings, year, month, employees);
  if (!finalValidation.ok) {
    success = false;
    blockingReports.push(...finalValidation.problems);
  }

  return { entries, warnings: [...new Set([...blockingReports, ...warnings])], success };
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
