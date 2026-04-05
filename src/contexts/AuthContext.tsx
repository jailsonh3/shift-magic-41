import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shiftmanager_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('shiftmanager_user', JSON.stringify(found));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('shiftmanager_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
