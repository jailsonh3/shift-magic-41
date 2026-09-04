import React, { useMemo, useState } from 'react';
import { User } from '@/types';
import { Pencil, Trash2, Plus, Download, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useShiftTemplates } from '@/hooks/useShiftTemplates';
import { useScheduleSettings } from '@/hooks/useScheduleSettings';
import { pushNotifications } from '@/hooks/useAppNotifications';
import {
  computeRemovalImpact,
  redistributeMonth,
  workloadAlerts,
  writeScheduleMonth,
  RemovalImpact,
} from '@/lib/teamImpact';

const FuncionariosPage: React.FC = () => {
  const { user } = useAuth();
  const { users, supervisors, create, update, remove, teamOf } = useEmployees();
  const { templates } = useShiftTemplates();
  const { settings } = useScheduleSettings();

  const isSupervisor = user?.role === 'supervisor';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', position: '', role: 'employee' as User['role'], supervisorId: user?.id || '1' });

  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [impact, setImpact] = useState<RemovalImpact | null>(null);

  // Employees of the logged supervisor + the supervisor card itself.
  const visible = useMemo(() => {
    if (!user) return [];
    if (!isSupervisor) return users.filter(u => u.id === user.id);
    return users.filter(u => u.id === user.id || (u.role === 'employee' && u.supervisorId === user.id));
  }, [users, user, isSupervisor]);

  const team = useMemo(() => teamOf(user), [teamOf, user]);

  const openNew = () => {
    setEditUser(null);
    setForm({ name: '', email: '', position: '', role: 'employee', supervisorId: user?.id || '1' });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, position: u.position || '', role: u.role, supervisorId: u.supervisorId || user?.id || '1' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Informe nome e email.');
      return;
    }
    if (editUser) {
      update(editUser.id, {
        name: form.name,
        email: form.email,
        position: form.position || undefined,
        role: form.role,
        supervisorId: form.role === 'employee' ? form.supervisorId : undefined,
      });
      toast.success('Funcionário atualizado');
    } else {
      const initials = form.name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
      create({
        name: form.name,
        email: form.email,
        position: form.position || undefined,
        role: form.role,
        supervisorId: form.role === 'employee' ? form.supervisorId : undefined,
        initials,
        avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`,
      });
      toast.success('Funcionário cadastrado');
    }
    setDialogOpen(false);
  };

  const askDelete = (u: User) => {
    const remaining = team.filter(e => e.id !== u.id);
    setImpact(computeRemovalImpact(u.id, remaining, templates, settings));
    setPendingDelete(u);
  };

  const notifyWorkload = (year: number, month: number, entries: typeof impact extends null ? never : any) => {
    const remaining = team.filter(e => e.id !== pendingDelete?.id);
    const alerts = workloadAlerts(entries, remaining, templates);
    if (!alerts.length) return [] as string[];
    pushNotifications(alerts.map(a => ({
      userId: a.employeeId,
      title: 'Aumento de carga horária',
      message: `Sua escala de ${String(month).padStart(2, '0')}/${year} ficou com ${a.label.split(': ')[1]}`,
      type: 'schedule' as const,
    })));
    return alerts.map(a => a.label);
  };

  const finishDelete = (mode: 'keep' | 'redistribute') => {
    if (!pendingDelete || !impact) return;
    const remaining = team.filter(e => e.id !== pendingDelete.id);
    const overloaded: string[] = [];

    impact.months.forEach(m => {
      if (mode === 'redistribute') {
        const result = redistributeMonth(m, remaining, templates, settings);
        if (result.success) {
          writeScheduleMonth({ ...m, entries: result.entries });
          overloaded.push(...notifyWorkload(m.year, m.month, result.entries));
          return;
        }
        toast.warning(`Não foi possível recobrir ${String(m.month).padStart(2, '0')}/${m.year} com a equipe restante; a escala foi mantida com lacunas.`);
      }
      writeScheduleMonth(m);
      overloaded.push(...notifyWorkload(m.year, m.month, m.entries));
    });

    remove(pendingDelete.id);
    toast.success(`${pendingDelete.name} removido da equipe.`);
    if (overloaded.length) {
      toast.warning(`Carga horária acima da média: ${overloaded.join(' ')}`);
    }
    setPendingDelete(null);
    setImpact(null);
  };

  const hasProblems = !!impact?.problems.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Funcionários <span className="text-lg font-normal text-muted-foreground">{team.length}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isSupervisor ? 'Equipe vinculada a você' : 'Seus dados'}
          </p>
        </div>
        {isSupervisor && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />CSV</Button>
            <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
            <Button className="gap-2" onClick={openNew}><Plus className="w-4 h-4" />Novo</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map(emp => {
          const supervisorName = users.find(u => u.id === emp.supervisorId)?.name;
          return (
            <Card key={emp.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground"
                      style={{ backgroundColor: emp.avatarColor }}
                    >
                      {emp.initials}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  {isSupervisor && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(emp)} aria-label={`Editar ${emp.name}`} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {emp.id !== user?.id && (
                        <button onClick={() => askDelete(emp)} aria-label={`Excluir ${emp.name}`} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge variant={emp.role === 'supervisor' ? 'outline' : 'secondary'} className={emp.role === 'supervisor' ? 'text-destructive border-destructive/30' : 'text-primary'}>
                    {emp.role === 'supervisor' ? '○ Supervisor' : '👤 Funcionário'}
                  </Badge>
                  {emp.position && <span className="text-xs text-muted-foreground">{emp.position}</span>}
                  {emp.role === 'employee' && supervisorName && (
                    <span className="text-xs text-muted-foreground">• Supervisor: {supervisorName}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-muted-foreground py-10 text-center">Nenhum funcionário vinculado a você ainda.</p>
      )}

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Atendente, Caixa..." />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as User['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'employee' && (
              <div className="space-y-2">
                <Label>Supervisor responsável</Label>
                <Select value={form.supervisorId} onValueChange={(v) => setForm(f => ({ ...f, supervisorId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {supervisors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation + coverage decision */}
      <Dialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) { setPendingDelete(null); setImpact(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${hasProblems ? 'text-destructive' : 'text-warning'}`} />
              Excluir {pendingDelete?.name}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {impact?.affectedDays
                ? `Esse funcionário está escalado em ${impact.affectedDays} dia(s). Ao excluir, esses dias ficam sem ele.`
                : 'Esse funcionário não está escalado em nenhum mês salvo.'}
            </p>
            {hasProblems && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="font-medium text-foreground">Inconsistências detectadas:</p>
                {impact!.problems.map(p => (
                  <div key={`${p.year}-${p.month}`} className="p-2 rounded border bg-destructive/10 border-destructive/30 space-y-1">
                    <p className="font-medium">{String(p.month).padStart(2, '0')}/{p.year}</p>
                    {p.items.slice(0, 8).map((it, i) => <p key={i} className="text-xs">{it}</p>)}
                    {p.items.length > 8 && <p className="text-xs text-muted-foreground">+{p.items.length - 8} outros avisos</p>}
                  </div>
                ))}
                <p className="text-muted-foreground text-xs">
                  Você pode manter a escala assim mesmo (fica registrado como autorizado por você) ou redistribuir os turnos entre a equipe restante. Quem receber carga acima da média será notificado.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setPendingDelete(null); setImpact(null); }}>Cancelar</Button>
            {hasProblems ? (
              <>
                <Button variant="outline" onClick={() => finishDelete('keep')}>Manter assim mesmo</Button>
                <Button onClick={() => finishDelete('redistribute')}>Redistribuir agora</Button>
              </>
            ) : (
              <Button variant="destructive" onClick={() => finishDelete('keep')}>Excluir</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FuncionariosPage;
