import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, Clock, Settings2 } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import ScheduleTab from './escalas/ScheduleTab';
import ShiftTemplatesTab from './escalas/ShiftTemplatesTab';
import GeneralSettingsTab from './escalas/GeneralSettingsTab';

const EscalasPage: React.FC = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [tab, setTab] = useState('schedule');

  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const prevMonth = () => month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1);

  const isSupervisor = user?.role === 'supervisor';
  const employees = mockUsers.filter(u => u.role === 'employee');

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escalas</h1>
          <p className="text-sm text-muted-foreground">Planejamento inteligente de turnos e folgas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="min-w-[180px] text-center font-medium text-foreground capitalize">{monthName}</div>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          {isSupervisor && (
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Funcionário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="schedule" className="gap-2"><Calendar className="w-4 h-4" />Escala Mensal</TabsTrigger>
          {isSupervisor && <TabsTrigger value="templates" className="gap-2"><Clock className="w-4 h-4" />Configuração de Turnos</TabsTrigger>}
          {isSupervisor && <TabsTrigger value="settings" className="gap-2"><Settings2 className="w-4 h-4" />Configurações Gerais</TabsTrigger>}
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab year={year} month={month} employeeFilter={employeeFilter} />
        </TabsContent>
        {isSupervisor && (
          <TabsContent value="templates" className="mt-4">
            <ShiftTemplatesTab />
          </TabsContent>
        )}
        {isSupervisor && (
          <TabsContent value="settings" className="mt-4">
            <GeneralSettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default EscalasPage;
