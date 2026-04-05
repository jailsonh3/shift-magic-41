import React from 'react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, CalendarDays, Users, FileText, Trophy, Bell, Settings, Clock, Download, LogOut, Sparkles
} from 'lucide-react';

const supervisorNav = [
  { title: 'Visão Geral', url: '/', icon: Home },
  { title: 'Escalas', url: '/escalas', icon: CalendarDays },
  { title: 'Funcionários', url: '/funcionarios', icon: Users },
  { title: 'Solicitações', url: '/solicitacoes', icon: FileText },
  { title: 'Metas', url: '/metas', icon: Trophy },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Regras', url: '/regras', icon: Settings },
  { title: 'Pausas', url: '/pausas', icon: Clock },
  { title: 'Exportar', url: '/exportar', icon: Download },
];

const employeeNav = [
  { title: 'Visão Geral', url: '/', icon: Home },
  { title: 'Escalas', url: '/escalas', icon: CalendarDays },
  { title: 'Solicitações', url: '/solicitacoes', icon: FileText },
  { title: 'Metas', url: '/metas', icon: Trophy },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
];

const AppSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navItems = user?.role === 'supervisor' ? supervisorNav : employeeNav;
  const notificationCount = 1;

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col shrink-0">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-sidebar-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-sm">ShiftManager</h1>
            <p className="text-xs text-sidebar-foreground/60">v2.0 — Escalas Inteligentes</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.title}</span>
            {item.title === 'Notificações' && notificationCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
            style={{ backgroundColor: user?.avatarColor }}
          >
            {user?.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role === 'supervisor' ? 'Supervisor' : 'Funcionário'}</p>
          </div>
          <button onClick={logout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
