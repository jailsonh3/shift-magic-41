import React, { useState } from 'react';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';
import { Pencil, Trash2, Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FuncionariosPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>(mockUsers.filter(u => u.role === 'employee' || u.role === 'supervisor'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' as User['role'] });

  const openNew = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'employee' });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editUser) {
      setEmployees(prev => prev.map(e => e.id === editUser.id ? { ...e, name: form.name, email: form.email, role: form.role } : e));
    } else {
      const initials = form.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const newUser: User = {
        id: String(Date.now()),
        name: form.name,
        email: form.email,
        role: form.role,
        supervisorId: '1',
        initials,
        avatarColor: `hsl(${Math.random() * 360}, 60%, 50%)`,
      };
      setEmployees(prev => [...prev, newUser]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Funcionários <span className="text-lg font-normal text-muted-foreground">{employees.length}</span>
          </h1>
          <p className="text-muted-foreground text-sm">Gestão da equipe (multi-tenant)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Upload className="w-4 h-4" />CSV</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
          <Button className="gap-2" onClick={openNew}><Plus className="w-4 h-4" />Novo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(emp => (
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
                <div className="flex gap-1">
                  <button onClick={() => openEdit(emp)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <Badge variant={emp.role === 'supervisor' ? 'outline' : 'secondary'} className={emp.role === 'supervisor' ? 'text-destructive border-destructive/30' : 'text-primary'}>
                  {emp.role === 'supervisor' ? '○ Supervisor' : '👤 Funcionário'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <Label>Função</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as User['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FuncionariosPage;
