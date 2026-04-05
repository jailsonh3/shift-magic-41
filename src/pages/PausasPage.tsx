import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

const PausasPage: React.FC = () => {
  const breaks = [
    { id: 1, duration: 10, order: 1, label: '1ª Pausa' },
    { id: 2, duration: 20, order: 2, label: '2ª Pausa (Intervalo)' },
    { id: 3, duration: 10, order: 3, label: '3ª Pausa' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Pausas</h1>
      <p className="text-muted-foreground mb-6">Configuração de pausas obrigatórias por turno</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {breaks.map(b => (
          <Card key={b.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{b.label}</h3>
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input type="number" defaultValue={b.duration} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PausasPage;
