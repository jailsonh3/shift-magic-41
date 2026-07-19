import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockRequests, mockUsers } from '@/data/mockData';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';
import { useSchedule } from '@/hooks/useSchedule';
import { Sparkles, RefreshCw, Save, Coffee, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateSchedule, totalMonthMinutes, validateCoverage } from '@/lib/scheduleGenerator';
import { computeShiftMinutes, dateKey, formatDuration } from '@/lib/timeUtils';
import { toast } from 'sonner';
import ShiftEditPopover from './ShiftEditPopover';
import { ScheduleAbsence } from '@/types';

const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props {
  year: number;
  month: number;
  employeeFilter: string;
}

const ScheduleTab: React.FC<Props> = ({ year, month, employeeFilter }) => {
  const { user } = useAuth();
  const { templates } = useShiftTemplates();
  const { settings } = useScheduleSettings();
  const { entries, replaceAll, upsertCell, clearCell, save, dirty } = useSchedule(year, month);

  const [warnings, setWarnings] = useState<string[]>([]);
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTitle, setWarnTitle] = useState('Avisos da geração');
  const [warnBlocking, setWarnBlocking] = useState(false);
  const [recalculationIndex, setRecalculationIndex] = useState(0);

  const isSupervisor = user?.role === 'supervisor';
  const daysInMonth = new Date(year, month, 0).getDate();

  const employees = useMemo(() => {
    let emps = mockUsers.filter(u => u.role === 'employee');
    if (user?.role === 'employee') emps = emps.filter(e => e.id === user.id);
    if (employeeFilter !== 'all') emps = emps.filter(e => e.id === employeeFilter);
    return emps;
  }, [user, employeeFilter]);

  const scheduleMap = useMemo(() => {
    const m = new Map<string, typeof entries[0]>();
    entries.forEach(e => m.set(`${e.employeeId}-${e.date}`, e));
    return m;
  }, [entries]);

  const templateById = useMemo(() => {
    const m = new Map(templates.map(t => [t.id, t]));
    return m;
  }, [templates]);

  const approvedAbsences = useMemo<ScheduleAbsence[]>(() => {
    const toDate = (day: string, monthText: string, yearText?: string) => {
      const requestYear = yearText ? Number(yearText.length === 2 ? `20${yearText}` : yearText) : year;
      return `${requestYear}-${String(Number(monthText)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
    };

    return mockRequests
      .filter(req => req.status === 'approved' && ['dayoff', 'vacation', 'medical'].includes(req.type))
      .flatMap(req => {
        const absenceType: ScheduleAbsence['type'] = req.type === 'vacation' ? 'vacation' : req.type === 'medical' ? 'medical' : 'dayoff';
        if (req.startDate && req.endDate) {
          return [{ employeeId: req.employeeId, startDate: req.startDate, endDate: req.endDate, type: absenceType, label: req.description, source: 'approved' as const }];
        }

        const matches = [...req.description.matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g)];
        if (!matches.length) return [];
        const startDate = toDate(matches[0][1], matches[0][2], matches[0][3]);
        const last = matches[matches.length - 1];
        const endDate = toDate(last[1], last[2], last[3]);
        return [{ employeeId: req.employeeId, startDate, endDate, type: absenceType, label: req.description, source: 'approved' as const }];
      });
  }, [year]);

  const runGeneration = (label: string, options?: { previousEntries?: typeof entries; keepDayOffs?: typeof entries; recalculationIndex?: number }) => {
    const emps = mockUsers.filter(u => u.role === 'employee');
    const result = generateSchedule({
      year,
      month,
      employees: emps,
      templates,
      settings,
      keepDayOffs: options?.keepDayOffs,
      previousEntries: options?.previousEntries,
      absences: approvedAbsences,
      recalculationIndex: options?.recalculationIndex,
    });
    if (!result.success) {
      setWarnings(result.warnings);
      setWarnTitle(`${label} bloqueada — cobertura não garantida`);
      setWarnBlocking(true);
      setWarnOpen(true);
      toast.error(`${label} não concluída: há dias sem cobertura completa.`);
      return;
    }
    replaceAll(result.entries);
    setWarnings(result.warnings);
    setWarnTitle(`${label} concluída`);
    setWarnBlocking(false);
    if (result.warnings.length) setWarnOpen(true);
    toast.success(`${label} concluída — cobertura ${settings.coverageStart}—${settings.coverageEnd} garantida.`);
  };

  const handleGenerate = () => runGeneration('Geração automática', { previousEntries: entries.length ? entries : undefined });
  const handleRecalculate = () => {
    const nextIndex = recalculationIndex + 1;
    setRecalculationIndex(nextIndex);
    runGeneration('Recalcular escala', {
      previousEntries: entries,
      keepDayOffs: entries.filter(e => e.isDayOff && e.generatedBy === 'manual'),
      recalculationIndex: nextIndex,
    });
  };

  const handleSave = () => {
    const check = validateCoverage(entries, templates, settings, year, month, mockUsers.filter(u => u.role === 'employee'));
    if (!check.ok) {
      setWarnings(check.problems);
      setWarnTitle('Salvamento bloqueado — cobertura incompleta');
      setWarnBlocking(true);
      setWarnOpen(true);
      toast.error('Não é possível salvar: existem horários sem cobertura.');
      return;
    }
    save();
    toast.success('Alterações salvas');
  };

  // Daily coverage count (# employees working)
  const dailyCoverage = useMemo(() => {
    const cov: number[] = [];
    const allEmps = mockUsers.filter(u => u.role === 'employee');
    for (let d = 1; d <= daysInMonth; d++) {
      const date = dateKey(year, month, d);
      const count = allEmps.filter(emp => {
        const e = scheduleMap.get(`${emp.id}-${date}`);
        return e && !e.isDayOff && e.shiftTemplateId;
      }).length;
      cov.push(count);
    }
    return cov;
  }, [scheduleMap, year, month, daysInMonth]);

  return (
    <TooltipProvider>
      {/* Action bar */}
      {isSupervisor && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button className="gap-2" onClick={handleGenerate}>
              <Sparkles className="w-4 h-4" />Gerar Escala Automática
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleRecalculate}>
              <RefreshCw className="w-4 h-4" />Recalcular
            </Button>
            <Button variant={dirty ? 'default' : 'outline'} className="gap-2" onClick={handleSave} disabled={!dirty}>
              <Save className="w-4 h-4" />Salvar {dirty && <span className="text-xs">•</span>}
            </Button>
          </div>
          {dirty && (
            <Badge variant="outline" className="text-warning border-warning/40 gap-1">
              <AlertTriangle className="w-3 h-3" />
              Alterações não salvas
            </Badge>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto border rounded-lg bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium text-muted-foreground min-w-[200px]">Funcionário</th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const dow = new Date(year, month - 1, d).getDay();
                const isWeekend = dow === 0 || dow === 6;
                const today = new Date();
                const isToday = d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                return (
                  <th key={d} className={`px-1 py-1 text-center min-w-[44px] ${isWeekend ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <div className="text-[10px]">{DAY_NAMES[dow]}</div>
                    <div className={`text-xs font-medium ${isToday ? 'bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center mx-auto' : ''}`}>
                      {d}
                    </div>
                  </th>
                );
              })}
              <th className="sticky right-0 bg-card px-3 py-2 text-center font-medium text-muted-foreground min-w-[80px]">Horas</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const totalMins = totalMonthMinutes(emp.id, entries, templates);
              return (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="sticky left-0 bg-card px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                        style={{ backgroundColor: emp.avatarColor }}>{emp.initials}</div>
                      <div>
                        <div className="font-medium text-foreground text-sm whitespace-nowrap">{emp.name}</div>
                        <div className="text-[11px] text-muted-foreground">{emp.position || 'Funcionário'}</div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const date = dateKey(year, month, d);
                    const entry = scheduleMap.get(`${emp.id}-${date}`);
                    const tpl = entry?.shiftTemplateId ? templateById.get(entry.shiftTemplateId) : undefined;

                    const absenceLabel = entry?.absenceType === 'vacation' ? 'Férias' : entry?.absenceType === 'medical' ? 'Atestado' : entry?.absenceType === 'absence' ? 'Ausência' : 'Folga';
                    const tooltipText = entry?.isDayOff ? absenceLabel :
                      tpl ? `${tpl.name} • ${tpl.startTime}—${tpl.endTime} • pausa ${tpl.breakMinutes}min • ${formatDuration(computeShiftMinutes(tpl.startTime, tpl.endTime, tpl.breakMinutes))}` :
                      'Sem atribuição';
                    const cell = entry?.isDayOff ? (
                      <div className="rounded bg-shift-dayoff/20 py-1 text-shift-dayoff font-bold text-xs">F</div>
                    ) : tpl ? (
                      <div className={`rounded py-1 px-0.5 bg-primary/10 text-primary text-[10px] font-semibold`}>
                        {tpl.startTime}
                      </div>
                    ) : (
                      <div className="rounded py-1 text-muted-foreground/40 text-xs">—</div>
                    );

                    const content = (
                      <button className="w-full block" disabled={!isSupervisor || !settings.allowManualEdit}>
                        {cell}
                      </button>
                    );

                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        {isSupervisor && settings.allowManualEdit ? (
                          <ShiftEditPopover
                            templates={templates}
                            onSelect={(tid) => upsertCell(emp.id, date, { shiftTemplateId: tid, isDayOff: false, absenceType: undefined, generatedBy: 'manual' })}
                            onDayOff={() => upsertCell(emp.id, date, { isDayOff: true, shiftTemplateId: undefined, absenceType: 'dayoff', generatedBy: 'manual' })}
                            onClear={() => clearCell(emp.id, date)}
                          >
                            {content}
                          </ShiftEditPopover>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent>
                              {tooltipText}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 bg-card px-3 py-2 text-center font-semibold text-primary">
                    {formatDuration(totalMins)}
                  </td>
                </tr>
              );
            })}

            {/* Coverage row */}
            {isSupervisor && (
              <tr className="border-t bg-muted/30">
                <td className="sticky left-0 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">Cobertura (funcionários)</td>
                {dailyCoverage.map((c, i) => {
                  const low = c < 2;
                  return (
                    <td key={i} className={`text-center text-xs font-semibold ${low ? 'text-destructive' : 'text-foreground'}`}>
                      {c}
                    </td>
                  );
                })}
                <td className="sticky right-0 bg-muted/30" />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {employees.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">Nenhum funcionário para exibir.</div>
      )}

      {/* Warnings modal */}
      <Dialog open={warnOpen} onOpenChange={setWarnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${warnBlocking ? 'text-destructive' : 'text-warning'}`} />
              {warnTitle}
            </DialogTitle>
          </DialogHeader>
          {warnBlocking && (
            <p className="text-sm text-muted-foreground">
              A escala não foi salva. Ajuste os turnos cadastrados, a disponibilidade de funcionários ou as folgas manuais e tente novamente.
            </p>
          )}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className={`text-sm p-2 rounded border ${warnBlocking ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'}`}>
                {w}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ScheduleTab;
