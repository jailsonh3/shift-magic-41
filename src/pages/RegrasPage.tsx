import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const RegrasPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Regras Trabalhistas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Limites de Trabalho</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Máximo de dias consecutivos</Label>
              <Input type="number" defaultValue={6} className="w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mínimo de folgas no período</Label>
              <Input type="number" defaultValue={5} className="w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Descanso mínimo entre turnos (horas)</Label>
              <Input type="number" defaultValue={11} className="w-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Banco de Horas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Horas para 1 folga (minutos)</Label>
              <Input type="number" defaultValue={380} className="w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Antecedência mínima (dias)</Label>
              <Input type="number" defaultValue={3} className="w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Permitir saldo negativo</Label>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Validações</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Verificar sobreposição de turnos</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Respeitar pausas obrigatórias</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Banco de horas ≥ 0</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notificações Automáticas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Trocas de turno</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aprovações</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alterações de escala</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegrasPage;
