import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockSchedule, mockUsers } from '@/data/mockData';
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon, Clock, Coffee, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShiftPeriod } from '@/types';

const PERIOD_CONFIG: Record<ShiftPeriod, { label: string; icon: React.ElementType; bgClass: string; textClass: string }> = {
  morning: { label: 'Manhã (07-12h)', icon: Sun, bgClass: 'bg-shift-morning/15', textClass: 'text-shift-morning' },
  afternoon: { label: 'Tarde (12-17h)', icon: Sunset, bgClass: 'bg-shift-afternoon/15', textClass: 'text-shift-afternoon' },
  night: { label: 'Noite (17h+)', icon: Moon, bgClass: 'bg-shift-night/15', textClass: 'text-shift-night' },
  partial: { label: 'Parcial (4h)', icon: Clock, bgClass: 'bg-shift-partial/15', textClass: 'text-shift-partial' },
  dayoff: { label: 'Folga', icon: Coffee, bgClass: 'bg-shift-dayoff/15', textClass: 'text-shift-dayoff' },
};

const DAY_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const EscalasPage: React.FC = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [filter, setFilter] = useState('all');

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const employees = useMemo(() => {
    const emps = mockUsers.filter(u => u.role === 'employee');
    if (user?.role === 'employee') return emps.filter(e => e.id === user.id);
    return emps;
  }, [user]);

  const scheduleMap = useMemo(() => {
    const map: Record<string, typeof mockSchedule[0]> = {};
    mockSchedule.forEach(entry => {
      map[`${entry.employeeId}-${entry.date}`] = entry;
    });
    return map;
  }, []);

  const stats = useMemo(() => {
    let morning = 0, afternoon = 0, night = 0, dayoffs = 0;
    employees.forEach(emp => {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const entry = scheduleMap[`${emp.id}-${date}`];
        if (entry?.isDayOff) dayoffs++;
        else if (entry?.period === 'morning') morning++;
        else if (entry?.period === 'afternoon') afternoon++;
        else if (entry?.period === 'night') night++;
      }
    });
    return { morning, afternoon, night, dayoffs };
  }, [employees, daysInMonth, year, month, scheduleMap]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isSupervisor = user?.role === 'supervisor';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h1 className="text-xl font-bold text-foreground capitalize">{monthName}</h1>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="flex items-center gap-3">
          {isSupervisor && (
            <>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                Gerar Escala
              </Button>
            </>
          )}
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(PERIOD_CONFIG).map(([key, cfg]) => (
          <Badge key={key} variant="outline" className={`${cfg.bgClass} ${cfg.textClass} border-0 gap-1.5`}>
            <cfg.icon className="w-3.5 h-3.5" />
            {cfg.label}
          </Badge>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto border rounded-lg bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 bg-card px-4 py-2 text-left font-medium text-muted-foreground min-w-[160px]">Funcionário</th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const date = new Date(year, month - 1, d);
                const dow = date.getDay();
                const isWeekend = dow === 0 || dow === 6;
                const isToday = d === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                return (
                  <th key={d} className={`px-1 py-1 text-center min-w-[42px] ${isWeekend ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <div className="text-xs">{DAY_NAMES[dow]}</div>
                    <div className={`text-xs font-medium ${isToday ? 'bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center mx-auto' : ''}`}>
                      {d}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees
              .filter(e => filter === 'all' || e.id === filter)
              .map(emp => (
                <tr key={emp.id} className="border-b last:border-0">
                  <td className="sticky left-0 bg-card px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                        style={{ backgroundColor: emp.avatarColor }}
                      >
                        {emp.initials}
                      </div>
                      <span className="font-medium text-foreground whitespace-nowrap">{emp.name}</span>
                    </div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const entry = scheduleMap[`${emp.id}-${dateStr}`];
                    const period = entry?.period || 'morning';
                    const cfg = PERIOD_CONFIG[period];
                    const Icon = cfg.icon;
                    const startHour = entry?.startTime?.split(':')[0] || '';

                    return (
                      <td key={d} className="px-0.5 py-1 text-center">
                        <div className={`rounded-md px-1 py-1 ${entry?.isDayOff ? 'bg-shift-dayoff/20' : cfg.bgClass}`}>
                          {entry?.isDayOff ? (
                            <div className="text-shift-dayoff font-bold text-xs">F</div>
                          ) : (
                            <>
                              <Icon className={`w-3 h-3 mx-auto ${cfg.textClass}`} />
                              <div className={`text-[10px] font-medium ${cfg.textClass}`}>{startHour}</div>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[
          { label: 'Manhã', value: stats.morning, icon: Sun, color: 'shift-morning' },
          { label: 'Tarde', value: stats.afternoon, icon: Sunset, color: 'shift-afternoon' },
          { label: 'Noite', value: stats.night, icon: Moon, color: 'shift-night' },
          { label: 'Folgas', value: stats.dayoffs, icon: Coffee, color: 'shift-dayoff' },
        ].map(s => (
          <div key={s.label} className={`border rounded-lg p-4 bg-${s.color}/5`}>
            <div className="flex items-center gap-3">
              <s.icon className={`w-5 h-5 text-${s.color}`} />
              <div>
                <p className={`text-2xl font-bold text-${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EscalasPage;
