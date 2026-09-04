import { ScheduleAbsence, ScheduleEntry, ScheduleSettings, ShiftTemplate, User } from '@/types';
import { generateSchedule, totalMonthMinutes, validateCoverage } from './scheduleGenerator';
import { formatDuration } from './timeUtils';

const PREFIX = 'shiftmanager_schedule_';

export interface ScheduleMonth {
  year: number;
  month: number;
  entries: ScheduleEntry[];
}

export function listScheduleMonths(): ScheduleMonth[] {
  const months: ScheduleMonth[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    const [year, month] = k.slice(PREFIX.length).split('-').map(Number);
    if (!year || !month) continue;
    try {
      const entries = JSON.parse(localStorage.getItem(k) || '[]');
      if (Array.isArray(entries)) months.push({ year, month, entries });
    } catch { /* ignore */ }
  }
  return months.sort((a, b) => (a.year - b.year) || (a.month - b.month));
}

export function writeScheduleMonth({ year, month, entries }: ScheduleMonth) {
  localStorage.setItem(`${PREFIX}${year}-${String(month).padStart(2, '0')}`, JSON.stringify(entries));
}

export interface RemovalImpact {
  months: ScheduleMonth[];          // months already stripped of the employee
  affectedDays: number;             // days the employee was scheduled to work
  problems: { year: number; month: number; items: string[] }[];
}

/** Removes an employee from every stored month and reports resulting coverage problems. */
export function computeRemovalImpact(
  employeeId: string,
  team: User[],
  templates: ShiftTemplate[],
  settings: ScheduleSettings,
): RemovalImpact {
  const months = listScheduleMonths();
  let affectedDays = 0;
  const problems: RemovalImpact['problems'] = [];
  const stripped: ScheduleMonth[] = [];

  months.forEach(({ year, month, entries }) => {
    const own = entries.filter(e => e.employeeId === employeeId);
    if (!own.length) return;
    affectedDays += own.filter(e => !e.isDayOff && e.shiftTemplateId).length;
    const rest = entries.filter(e => e.employeeId !== employeeId);
    stripped.push({ year, month, entries: rest });
    const check = validateCoverage(rest, templates, settings, year, month, team);
    if (!check.ok) problems.push({ year, month, items: check.problems });
  });

  return { months: stripped, affectedDays, problems };
}

export interface WorkloadAlert {
  employeeId: string;
  employeeName: string;
  minutes: number;
  averageMinutes: number;
  extraMinutes: number;
  label: string;
}

/** Employees whose monthly load is meaningfully above the team average. */
export function workloadAlerts(
  entries: ScheduleEntry[],
  team: User[],
  templates: ShiftTemplate[],
  toleranceRatio = 1.1,
): WorkloadAlert[] {
  if (team.length < 2) return [];
  const loads = team.map(emp => ({ emp, minutes: totalMonthMinutes(emp.id, entries, templates) }));
  const total = loads.reduce((s, l) => s + l.minutes, 0);
  if (!total) return [];
  const average = total / loads.length;
  return loads
    .filter(l => l.minutes > average * toleranceRatio)
    .map(l => ({
      employeeId: l.emp.id,
      employeeName: l.emp.name,
      minutes: l.minutes,
      averageMinutes: Math.round(average),
      extraMinutes: Math.round(l.minutes - average),
      label: `${l.emp.name}: ${formatDuration(l.minutes)} no mês (${formatDuration(Math.round(l.minutes - average))} acima da média da equipe).`,
    }))
    .sort((a, b) => b.extraMinutes - a.extraMinutes);
}

/** Regenerates a month for the remaining team, preserving manual day offs. */
export function redistributeMonth(
  { year, month, entries }: ScheduleMonth,
  team: User[],
  templates: ShiftTemplate[],
  settings: ScheduleSettings,
  absences?: ScheduleAbsence[],
) {
  return generateSchedule({
    year,
    month,
    employees: team,
    templates,
    settings,
    previousEntries: entries,
    keepDayOffs: entries.filter(e => e.isDayOff && e.generatedBy === 'manual'),
    absences,
    recalculationIndex: 1,
  });
}
