import { useEffect, useState } from 'react';
import { ShiftTemplate } from '@/types';
import { defaultShiftTemplates } from '@/data/mockData';

const KEY = 'shiftmanager_shift_templates';

export function useShiftTemplates() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    return defaultShiftTemplates;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(templates));
  }, [templates]);

  const create = (t: Omit<ShiftTemplate, 'id'>) =>
    setTemplates(prev => [...prev, { ...t, id: `t${Date.now()}` }]);
  const update = (id: string, t: Partial<ShiftTemplate>) =>
    setTemplates(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));
  const remove = (id: string) =>
    setTemplates(prev => prev.filter(x => x.id !== id));

  return { templates, create, update, remove };
}
