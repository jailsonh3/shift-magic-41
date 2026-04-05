import React from 'react';
import { mockNotifications } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CalendarDays, FileText, Trophy, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ElementType> = {
  shift_change: CalendarDays,
  approval: FileText,
  goal: Trophy,
  schedule: CalendarDays,
  absence: AlertTriangle,
};

const NotificacoesPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Notificações</h1>
      {mockNotifications.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma notificação.</p>
      ) : (
        <div className="space-y-3">
          {mockNotifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <Card key={n.id} className={!n.read ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  {!n.read && <Badge>Nova</Badge>}
                  <span className="text-xs text-muted-foreground">{n.createdAt}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificacoesPage;
