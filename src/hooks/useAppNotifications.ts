import { useCallback, useEffect, useState } from 'react';
import { Notification } from '@/types';
import { mockNotifications } from '@/data/mockData';

const KEY = 'shiftmanager_notifications';
const EVENT = 'shiftmanager_notifications_changed';

function readStored(): Notification[] {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Notification[];
    } catch { /* ignore */ }
  }
  return [];
}

export function pushNotifications(items: Omit<Notification, 'id' | 'read' | 'createdAt'>[]) {
  if (!items.length) return;
  const now = new Date().toISOString().slice(0, 10);
  const created = items.map((n, i) => ({
    ...n,
    id: `n${Date.now()}-${i}`,
    read: false,
    createdAt: now,
  }));
  localStorage.setItem(KEY, JSON.stringify([...created, ...readStored()]));
  window.dispatchEvent(new Event(EVENT));
}

export function useAppNotifications(userId?: string) {
  const [stored, setStored] = useState<Notification[]>(readStored);

  useEffect(() => {
    const sync = () => setStored(readStored());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const all = [...stored, ...mockNotifications];
  const notifications = userId ? all.filter(n => n.userId === userId) : all;

  const markAllRead = useCallback(() => {
    localStorage.setItem(KEY, JSON.stringify(readStored().map(n => ({ ...n, read: true }))));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { notifications, markAllRead };
}
