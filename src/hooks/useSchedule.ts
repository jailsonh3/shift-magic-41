import { useCallback, useEffect, useState } from 'react';
import { ScheduleEntry } from '@/types';

const key = (y: number, m: number) => `shiftmanager_schedule_${y}-${String(m).padStart(2, '0')}`;

export function useSchedule(year: number, month: number) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(key(year, month));
    setEntries(raw ? JSON.parse(raw) : []);
    setDirty(false);
  }, [year, month]);

  const save = useCallback(() => {
    localStorage.setItem(key(year, month), JSON.stringify(entries));
    setDirty(false);
  }, [entries, year, month]);

  const replaceAll = useCallback((next: ScheduleEntry[]) => {
    setEntries(next);
    setDirty(true);
  }, []);

  const upsertCell = useCallback((employeeId: string, date: string, patch: Partial<ScheduleEntry>) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.employeeId === employeeId && e.date === date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      }
      return [...prev, {
        id: `${employeeId}-${date}`,
        employeeId, date,
        isDayOff: false,
        ...patch,
      } as ScheduleEntry];
    });
    setDirty(true);
  }, []);

  const clearCell = useCallback((employeeId: string, date: string) => {
    setEntries(prev => prev.filter(e => !(e.employeeId === employeeId && e.date === date)));
    setDirty(true);
  }, []);

  return { entries, replaceAll, upsertCell, clearCell, save, dirty };
}
