import { useCallback, useEffect, useState } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';

const KEY = 'shiftmanager_users';
const EVENT = 'shiftmanager_users_changed';

export function readUsers(): User[] {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as User[];
    } catch { /* ignore */ }
  }
  return mockUsers;
}

function writeUsers(users: User[]) {
  localStorage.setItem(KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(EVENT));
}

export function useEmployees() {
  const [users, setUsers] = useState<User[]>(readUsers);

  useEffect(() => {
    const sync = () => setUsers(readUsers());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const create = useCallback((u: Omit<User, 'id'>) => {
    const next = [...readUsers(), { ...u, id: String(Date.now()) }];
    writeUsers(next);
    return next;
  }, []);

  const update = useCallback((id: string, patch: Partial<User>) => {
    const next = readUsers().map(u => (u.id === id ? { ...u, ...patch } : u));
    writeUsers(next);
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    const next = readUsers().filter(u => u.id !== id);
    writeUsers(next);
    return next;
  }, []);

  /** Employees managed by a supervisor (or the employee itself). */
  const teamOf = useCallback((viewer?: User | null) => {
    const all = users.filter(u => u.role === 'employee');
    if (!viewer) return [];
    if (viewer.role === 'employee') return all.filter(u => u.id === viewer.id);
    return all.filter(u => u.supervisorId === viewer.id);
  }, [users]);

  const supervisors = users.filter(u => u.role === 'supervisor');

  return { users, supervisors, create, update, remove, teamOf };
}
