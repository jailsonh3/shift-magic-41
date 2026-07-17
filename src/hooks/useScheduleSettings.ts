import { useEffect, useState } from 'react';
import { ScheduleSettings } from '@/types';

const KEY = 'shiftmanager_settings';

const defaults: ScheduleSettings = {
  daysOffPerMonth: 5,
  coverageStart: '07:00',
  coverageEnd: '22:00',
  allowManualEdit: true,
  maxConsecutiveDays: 6,
};

export function useScheduleSettings() {
  const [settings, setSettings] = useState<ScheduleSettings>(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { return { ...defaults, ...JSON.parse(raw) }; } catch { /* */ }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (patch: Partial<ScheduleSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  return { settings, update };
}
