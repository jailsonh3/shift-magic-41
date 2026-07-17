import React, { useState } from 'react';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { ShiftTemplate, ShiftType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { computeShiftMinutes, formatDuration } from '@/lib/timeUtils';
import { toast } from 'sonner';

const emptyForm = {
  name: '', startTime: '07:00', endTime: '13:20',
  breakMinutes: 20, type: 'OPENING' as ShiftType, active: true,
};

const ShiftTemplatesTab: React.FC = () => {
  const { templates, create, update, remove } = useShiftTemplates();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (t: ShiftTemplate) => {
    setEditing(t);
    setForm({
      name: t.name, startTime: t.startTime, endTime: t.endTime,
      breakMinutes: t.breakMinutes, type: t.type, active: t.active,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Informe um nome');
    const mins = computeShiftMinutes(form.startTime, form.endTime, form.breakMinutes);
    if (mins <= 0) return toast.error('Horário inválido');

    const periodOf = (t: ShiftType) => t === 'OPENING' ? 'morning' as const : t === 'MID' ? 'afternoon' as const : 'night' as const;

    if (editing) {
      update(editing.id, { ...form, period: periodOf(form.type) });
      toast.success('Turno atualizado');
    } else {
      create({ ...form, period: periodOf(form.type), supervisorId: '1' });
      toast.success('Turno criado');
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Turnos cadastrados</h2>
          <p className="text-sm text-muted-foreground">Somente turnos ativos são usados na geração automática</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Novo turno</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => {
          const mins = computeShiftMinutes(t.startTime, t.endTime, t.breakMinutes);
          return (
            <Card key={t.id} className={!t.active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { remove(t.id); toast.success('Turno removido'); }} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="font-medium">{t.startTime} — {t.endTime}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pausa</span><span className="font-medium">{t.breakMinutes} min</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Carga</span><span className="font-medium text-primary">{formatDuration(mins)}</span></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={t.active ? 'default' : 'secondary'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
                  <Switch checked={t.active} onCheckedChange={(v) => update(t.id, { active: v })} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar turno' : 'Novo turno'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Manhã 07h" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pausa (min)</Label>
                <Input type="number" value={form.breakMinutes} onChange={e => setForm(f => ({ ...f, breakMinutes: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as ShiftType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPENING">Abertura</SelectItem>
                    <SelectItem value="MID">Intermediário</SelectItem>
                    <SelectItem value="CLOSING">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-md text-sm">
              Carga total: <span className="font-semibold text-primary">{formatDuration(computeShiftMinutes(form.startTime, form.endTime, form.breakMinutes))}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))} />
            </div>
            <Button className="w-full" onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftTemplatesTab;
