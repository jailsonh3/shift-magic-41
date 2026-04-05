import { User, ShiftTemplate, ScheduleEntry, ShiftPeriod, Notification, GoalType, GoalAchievement, TimeBank, Request } from '@/types';

const AVATAR_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export const mockUsers: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@shiftmanager.com', role: 'supervisor', initials: 'A', avatarColor: AVATAR_COLORS[0] },
  { id: '2', name: 'Maria Souza', email: 'maria.souza@gmail.com', role: 'employee', supervisorId: '1', initials: 'MS', avatarColor: AVATAR_COLORS[1] },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos.oliveira@gmail.com', role: 'employee', supervisorId: '1', initials: 'CO', avatarColor: AVATAR_COLORS[2] },
  { id: '4', name: 'Ana Pereira', email: 'ana.pereira@gmail.com', role: 'employee', supervisorId: '1', initials: 'AP', avatarColor: AVATAR_COLORS[3] },
  { id: '5', name: 'Lucas Santos', email: 'lucas.santos@gmail.com', role: 'employee', supervisorId: '1', initials: 'LS', avatarColor: AVATAR_COLORS[4] },
  { id: '6', name: 'Fernanda Costa', email: 'fernanda.costa@gmail.com', role: 'employee', supervisorId: '1', initials: 'FC', avatarColor: AVATAR_COLORS[5] },
  { id: '7', name: 'Jailson Silva', email: 'jailsonh3@gmail.com', role: 'employee', supervisorId: '1', initials: 'JS', avatarColor: AVATAR_COLORS[6] },
];

export const mockShiftTemplates: ShiftTemplate[] = [
  { id: 'morning', name: 'Manhã', type: 'OPENING', startTime: '06:00', endTime: '12:00', period: 'morning', supervisorId: '1' },
  { id: 'afternoon', name: 'Tarde', type: 'MID', startTime: '12:00', endTime: '17:00', period: 'afternoon', supervisorId: '1' },
  { id: 'night', name: 'Noite', type: 'CLOSING', startTime: '17:00', endTime: '23:00', period: 'night', supervisorId: '1' },
  { id: 'partial', name: 'Parcial', type: 'MID', startTime: '10:00', endTime: '14:00', period: 'partial', supervisorId: '1' },
];

function generateSchedule(year: number, month: number): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const employees = mockUsers.filter(u => u.role === 'employee');
  const daysInMonth = new Date(year, month, 0).getDate();

  employees.forEach((emp, empIdx) => {
    const baseHour = 6 + empIdx;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      
      // Sundays are day off
      const isSunday = dayOfWeek === 0;
      // Every other Saturday
      const isSaturdayOff = dayOfWeek === 6 && (Math.floor((day - 1) / 7) % 2 === 0);
      const isDayOff = isSunday || isSaturdayOff;

      // Determine period based on week
      const weekNum = Math.floor((day - 1) / 7);
      let period: ShiftPeriod;
      if (weekNum < 2) period = 'morning';
      else if (weekNum < 3) period = 'afternoon';
      else period = 'afternoon';

      const startHour = baseHour + weekNum;
      const startTime = `${String(startHour).padStart(2, '0')}:00`;
      const endTime = `${String(startHour + 6).padStart(2, '0')}:20`;

      entries.push({
        id: `${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        shiftTemplateId: isDayOff ? undefined : (period === 'morning' ? 'morning' : 'afternoon'),
        period: isDayOff ? 'dayoff' : period,
        startTime: isDayOff ? undefined : startTime,
        endTime: isDayOff ? undefined : endTime,
        isDayOff,
      });
    }
  });
  return entries;
}

export const mockSchedule = generateSchedule(2026, 4);

export const mockNotifications: Notification[] = [
  { id: '1', userId: '7', title: 'Escala atualizada', message: 'Sua escala de abril foi gerada.', read: false, createdAt: '2026-04-01', type: 'schedule' },
];

export const mockGoalTypes: GoalType[] = [
  { id: '1', name: 'Pontualidade', description: 'Chegar no horário durante o mês', points: 10, supervisorId: '1' },
  { id: '2', name: 'Produtividade', description: 'Atingir meta de produção', points: 20, supervisorId: '1' },
];

export const mockGoalAchievements: GoalAchievement[] = [
  { id: '1', employeeId: '2', goalTypeId: '1', date: '2026-03-31', points: 10 },
  { id: '2', employeeId: '3', goalTypeId: '2', date: '2026-03-31', points: 20 },
];

export const mockTimeBank: TimeBank[] = [
  { id: '1', employeeId: '2', minutes: 120, description: 'Hora extra - março', date: '2026-03-15' },
  { id: '3', employeeId: '7', minutes: 380, description: 'Horas extras acumuladas', date: '2026-03-20' },
];

export const mockRequests: Request[] = [
  { id: '1', employeeId: '7', type: 'dayoff', status: 'pending', description: 'Solicitar folga dia 15/04', createdAt: '2026-04-01' },
];
