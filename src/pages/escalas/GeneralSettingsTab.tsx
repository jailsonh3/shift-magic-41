import React from 'react';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const GeneralSettingsTab: React.FC = () => {
  const { settings, update } = useScheduleSettings();

  return (
    <div className="max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Folgas e cobertura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Folgas por funcionário no mês</Label>
              <Input type="number" min={0} max={15} value={settings.daysOffPerMonth}
                onChange={e => update({ daysOffPerMonth: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início cobertura</Label>
                <Input type="time" value={settings.coverageStart}
                  onChange={e => update({ coverageStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fim cobertura</Label>
                <Input type="time" value={settings.coverageEnd}
                  onChange={e => update({ coverageEnd: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Regras</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Máx. dias consecutivos de trabalho</Label>
              <Input type="number" min={1} max={7} value={settings.maxConsecutiveDays}
                onChange={e => update({ maxConsecutiveDays: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Permitir edição manual após geração</Label>
              <Switch checked={settings.allowManualEdit}
                onCheckedChange={(v) => update({ allowManualEdit: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="mt-4 gap-2" onClick={() => toast.success('Configurações salvas')}>
        <Save className="w-4 h-4" />
        Salvar Configurações
      </Button>
    </div>
  );
};

export default GeneralSettingsTab;
