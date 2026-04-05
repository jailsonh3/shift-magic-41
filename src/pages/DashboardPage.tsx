import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, FileText, Trophy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (user?.role === 'employee') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo, {user.name}! 👋</h1>
        <p className="text-muted-foreground mt-1">{dateStr}</p>
        <div className="mt-6">
          <Card className="bg-primary border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
                <h2 className="text-lg font-semibold text-primary-foreground">Início Rápido</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link to="/escalas" className="block bg-primary-foreground/10 rounded-lg p-4 text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
                  <span className="font-medium">1. Minha Escala</span>
                  <span className="text-primary-foreground/80"> — Veja seus turnos com horários e pausas</span>
                </Link>
                <Link to="/solicitacoes" className="block bg-primary-foreground/10 rounded-lg p-4 text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
                  <span className="font-medium">2. Solicitações</span>
                  <span className="text-primary-foreground/80"> — Peça folga, troque turno com um colega ou solicite ajuste de horário</span>
                </Link>
                <Link to="/metas" className="block bg-primary-foreground/10 rounded-lg p-4 text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
                  <span className="font-medium">3. Metas</span>
                  <span className="text-primary-foreground/80"> — Acompanhe seu ranking e conquistas</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Supervisor dashboard
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Bem-vindo, {user?.name}! 👋</h1>
      <p className="text-muted-foreground mt-1">{dateStr}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">6</p>
                <p className="text-sm text-muted-foreground">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-sm text-muted-foreground">Solicitações Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">2</p>
                <p className="text-sm text-muted-foreground">Metas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">Abril 2026</p>
                <p className="text-sm text-muted-foreground">Escala Ativa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
