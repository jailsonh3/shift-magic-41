import React from 'react';
import { mockRequests, mockUsers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const typeLabels: Record<string, string> = {
  dayoff: 'Folga',
  shift_change: 'Troca de Turno',
  time_bank: 'Banco de Horas',
  vacation: 'Férias',
  medical: 'Atestado Médico',
};

const SolicitacoesPage: React.FC = () => {
  const { user } = useAuth();
  const requests = user?.role === 'employee'
    ? mockRequests.filter(r => r.employeeId === user.id)
    : mockRequests;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Solicitações</h1>
      {requests.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const emp = mockUsers.find(u => u.id === req.employeeId);
            return (
              <Card key={req.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                      style={{ backgroundColor: emp?.avatarColor }}>
                      {emp?.initials}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{emp?.name}</p>
                      <p className="text-sm text-muted-foreground">{req.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{typeLabels[req.type]}</Badge>
                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {statusLabels[req.status]}
                    </Badge>
                    {user?.role === 'supervisor' && req.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8 text-success"><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-destructive"><X className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitacoesPage;
