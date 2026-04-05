import React from 'react';
import { mockGoalTypes, mockGoalAchievements, mockUsers } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const MetasPage: React.FC = () => {
  const employees = mockUsers.filter(u => u.role === 'employee');
  const ranking = employees.map(emp => {
    const points = mockGoalAchievements
      .filter(a => a.employeeId === emp.id)
      .reduce((sum, a) => sum + a.points, 0);
    return { ...emp, points };
  }).sort((a, b) => b.points - a.points);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Metas</h1>
      <p className="text-muted-foreground mb-6">Sistema de metas e ranking de desempenho</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Metas Ativas</h2>
          <div className="space-y-3">
            {mockGoalTypes.map(goal => (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium text-foreground">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    <span className="ml-auto text-sm font-bold text-primary">{goal.points} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Ranking</h2>
          <div className="space-y-2">
            {ranking.map((emp, idx) => (
              <Card key={emp.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}.</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: emp.avatarColor }}>
                    {emp.initials}
                  </div>
                  <span className="font-medium text-foreground flex-1">{emp.name}</span>
                  <span className="font-bold text-primary">{emp.points} pts</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetasPage;
