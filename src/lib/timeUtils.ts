export const timeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
};

export const computeShiftMinutes = (start: string, end: string, breakMinutes: number): number => {
  const s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += 24 * 60; // overnight
  return e - s - breakMinutes;
};

export const dateKey = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
