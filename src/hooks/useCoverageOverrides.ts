import { useCallback, useEffect, useState } from 'react';

export interface CoverageOverride {
  date: string;       // YYYY-MM-DD (or 'employee:<id>' scoped key for workload)
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

const key = (y: number, m: number) => `shiftmanager_coverage_override_${y}-${String(m).padStart(2, '0')}`;
const EVENT = 'shiftmanager_overrides_changed';

function read(y: number, m: number): CoverageOverride[] {
  const raw = localStorage.getItem(key(y, m));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CoverageOverride[];
    } catch { /* ignore */ }
  }
  return [];
}

export function useCoverageOverrides(year: number, month: number) {
  const [overrides, setOverrides] = useState<CoverageOverride[]>(() => read(year, month));

  useEffect(() => {
    const sync = () => setOverrides(read(year, month));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [year, month]);

  const authorize = useCallback((items: Omit<CoverageOverride, 'approvedAt'>[]) => {
    const existing = read(year, month);
    const merged = [...existing];
    items.forEach(item => {
      if (!merged.some(o => o.date === item.date && o.reason === item.reason)) {
        merged.push({ ...item, approvedAt: new Date().toISOString() });
      }
    });
    localStorage.setItem(key(year, month), JSON.stringify(merged));
    window.dispatchEvent(new Event(EVENT));
  }, [year, month]);

  const clear = useCallback(() => {
    localStorage.removeItem(key(year, month));
    window.dispatchEvent(new Event(EVENT));
  }, [year, month]);

  return { overrides, authorize, clear };
}
