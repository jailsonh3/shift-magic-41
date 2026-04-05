import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@shiftmanager.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) setError('Credenciais inválidas');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/70">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card/20 backdrop-blur mb-4">
            <CalendarDays className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">ShiftManager</h1>
          <p className="text-primary-foreground/70 mt-1">Gerenciador Inteligente de Escalas</p>
        </div>

        <Card className="w-[400px] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-left">Entrar no sistema</CardTitle>
            <CardDescription className="text-left">Use as credenciais fornecidas pelo supervisor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label>Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2 text-left">
                <Label>Senha</Label>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full">Entrar</Button>
              <div className="text-xs text-muted-foreground mt-4 text-left">
                <p className="font-medium text-primary">Admin padrão:</p>
                <p>admin@shiftmanager.com / admin123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
