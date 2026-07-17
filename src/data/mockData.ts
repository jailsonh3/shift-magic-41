import { User, ShiftTemplate, Notification, GoalType, GoalAchievement, TimeBank, Request } from '@/types';

const AVATAR_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export const mockUsers: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@shiftmanager.com', role: 'supervisor', initials: 'A', avatarColor: AVATAR_COLORS[0], position: 'Supervisor' },
  { id: '2', name: 'Maria Souza', email: 'maria.souza@gmail.com', role: 'employee', supervisorId: '1', initials: 'MS', avatarColor: AVATAR_COLORS[1], position: 'Atendente' },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos.oliveira@gmail.com', role: 'employee', supervisorId: '1', initials: 'CO', avatarColor: AVATAR_COLORS[2], position: 'Atendente' },
  { id: '4', name: 'Ana Pereira', email: 'ana.pereira@gmail.com', role: 'employee', supervisorId: '1', initials: 'AP', avatarColor: AVATAR_COLORS[3], position: 'Caixa' },
  { id: '5', name: 'Lucas Santos', email: 'lucas.santos@gmail.com', role: 'employee', supervisorId: '1', initials: 'LS', avatarColor: AVATAR_COLORS[4], position: 'Atendente' },
  { id: '6', name: 'Fernanda Costa', email: 'fernanda.costa@gmail.com', role: 'employee', supervisorId: '1', initials: 'FC', avatarColor: AVATAR_COLORS[5], position: 'Caixa' },
  { id: '7', name: 'Jailson Silva', email: 'jailsonh3@gmail.com', role: 'employee', supervisorId: '1', initials: 'JS', avatarColor: AVATAR_COLORS[6], position: 'Atendente' },
];

export const defaultShiftTemplates: ShiftTemplate[] = [
  { id: 't1', name: 'Manhã 07h', type: 'OPENING', startTime: '07:00', endTime: '13:20', period: 'morning', supervisorId: '1', breakMinutes: 20, active: true },
  { id: 't2', name: 'Manhã 08h', type: 'OPENING', startTime: '08:00', endTime: '14:20', period: 'morning', supervisorId: '1', breakMinutes: 20, active: true },
  { id: 't3', name: 'Meio 09h', type: 'MID', startTime: '09:00', endTime: '15:20', period: 'morning', supervisorId: '1', breakMinutes: 20, active: true },
  { id: 't4', name: 'Tarde 12h', type: 'MID', startTime: '12:00', endTime: '18:20', period: 'afternoon', supervisorId: '1', breakMinutes: 20, active: true },
  { id: 't5', name: 'Fechamento 15h40', type: 'CLOSING', startTime: '15:40', endTime: '22:00', period: 'night', supervisorId: '1', breakMinutes: 20, active: true },
];

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

// legacy - some pages still reference mockSchedule; keep empty
export const mockSchedule: any[] = [];
