import { ScheduleEntry, ScheduleSettings, ShiftTemplate, User } from '@/types';
import { computeShiftMinutes, dateKey, timeToMinutes } from './timeUtils';

export interface GenerationResult {
  entries: ScheduleEntry[];
  warnings: string[];
}

interface Params {
  year: number;
  month: number; // 1-12
  employees: User[];
  templates: ShiftTemplate[]; // only active
  settings: ScheduleSettings;
  keepDayOffs?: ScheduleEntry[]; // for recalculation
}

export function generateSchedule({ year, month, employees, templates, settings, keepDayOffs }: Params): GenerationResult {
  const warnings: string[] = [];
  const activeTemplates = templates.filter(t => t.active);

  if (employees.length === 0) return { entries: [], warnings: ['Nenhum funcionário disponível.'] };
  if (activeTemplates.length === 0) return { entries: [], warnings: ['Nenhum turno ativo cadastrado. Cadastre turnos na aba Configuração de Turnos.'] };

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ---- 1. Distribute day-offs per employee ----
  // spread evenly across the month, prefer weekends when possible
  const dayOffMap = new Map<string, Set<number>>();
  employees.forEach((emp, empIdx) => {
    const set = new Set<number>();
    // preserve manually kept dayoffs
    keepDayOffs?.filter(e => e.employeeId === emp.id && e.isDayOff).forEach(e => {
      const d = parseInt(e.date.split('-')[2], 10);
      set.add(d);
    });
    const target = settings.daysOffPerMonth;
    const step = Math.max(1, Math.floor(daysInMonth / target));
    let cursor = (empIdx * 2) % daysInMonth + 1;
    let guard = 0;
    while (set.size < target && guard < daysInMonth * 3) {
      // ensure not consecutive with existing
      if (!set.has(cursor) && !set.has(cursor - 1) && !set.has(cursor + 1)) {
        set.add(cursor);
      }
      cursor = ((cursor + step - 1) % daysInMonth) + 1;
      guard++;
    }
    // fallback fill
    let d = 1;
    while (set.size < target && d <= daysInMonth) {
      if (!set.has(d)) set.add(d);
      d++;
    }
    dayOffMap.set(emp.id, set);
  });

  // ---- 2. For each work-day, assign a template ----
  const entries: ScheduleEntry[] = [];
  // track how many times each employee got each template
  const empTemplateCount = new Map<string, Map<string, number>>();
  employees.forEach(e => empTemplateCount.set(e.id, new Map()));

  // track consecutive worked days
  const consecutive = new Map<string, number>();

  for (const day of days) {
    const date = dateKey(year, month, day);
    // dailyTemplateCount for balancing coverage
    const dailyCount = new Map<string, number>();

    for (const emp of employees) {
      const isOff = dayOffMap.get(emp.id)?.has(day);
      if (isOff) {
        entries.push({ id: `${emp.id}-${date}`, employeeId: emp.id, date, isDayOff: true });
        consecutive.set(emp.id, 0);
        continue;
      }

      // Enforce max consecutive
      const cur = consecutive.get(emp.id) || 0;
      if (cur >= settings.maxConsecutiveDays) {
        // force day off
        entries.push({ id: `${emp.id}-${date}`, employeeId: emp.id, date, isDayOff: true });
        consecutive.set(emp.id, 0);
        continue;
      }

      // Pick template: least-used by this employee, then least-used today globally
      const empCounts = empTemplateCount.get(emp.id)!;
      const sorted = [...activeTemplates].sort((a, b) => {
        const diff = (empCounts.get(a.id) || 0) - (empCounts.get(b.id) || 0);
        if (diff !== 0) return diff;
        return (dailyCount.get(a.id) || 0) - (dailyCount.get(b.id) || 0);
      });
      const chosen = sorted[0];
      empCounts.set(chosen.id, (empCounts.get(chosen.id) || 0) + 1);
      dailyCount.set(chosen.id, (dailyCount.get(chosen.id) || 0) + 1);
      consecutive.set(emp.id, cur + 1);

      entries.push({
        id: `${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        shiftTemplateId: chosen.id,
        isDayOff: false,
      });
    }

    // ---- 3. Coverage validation ----
    const covStart = timeToMinutes(settings.coverageStart);
    const covEnd = timeToMinutes(settings.coverageEnd);
    const gaps: string[] = [];
    for (let t = covStart; t < covEnd; t += 60) {
      const covered = entries.some(e => {
        if (e.date !== date || e.isDayOff) return false;
        const tpl = activeTemplates.find(x => x.id === e.shiftTemplateId);
        if (!tpl) return false;
        const s = timeToMinutes(tpl.startTime);
        let end = timeToMinutes(tpl.endTime);
        if (end <= s) end += 24 * 60;
        return t >= s && t < end;
      });
      if (!covered) {
        const h = Math.floor(t / 60);
        gaps.push(`${String(h).padStart(2, '0')}:00`);
      }
    }
    if (gaps.length) warnings.push(`Dia ${day}: sem cobertura em ${gaps.join(', ')}.`);
  }

  return { entries, warnings };
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
