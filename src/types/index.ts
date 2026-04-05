export type UserRole = 'supervisor' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
  initials: string;
  avatarColor: string;
}

export type ShiftType = 'OPENING' | 'MID' | 'CLOSING';
export type ShiftPeriod = 'morning' | 'afternoon' | 'night' | 'partial' | 'dayoff';

export interface ShiftTemplate {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  period: ShiftPeriod;
  supervisorId: string;
}

export interface BreakRule {
  id: string;
  templateId: string;
  duration: number; // minutes
  order: number;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftTemplateId?: string;
  period: ShiftPeriod;
  startTime?: string;
  endTime?: string;
  isDayOff: boolean;
}

export interface WeeklyDayOff {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
}

export interface Request {
  id: string;
  employeeId: string;
  type: 'dayoff' | 'shift_change' | 'time_bank' | 'vacation' | 'medical';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: string;
}

export interface ShiftChangeRequest {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  date: string;
  status: 'pending_employee' | 'pending_supervisor' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Absence {
  id: string;
  employeeId: string;
  type: 'medical' | 'vacation' | 'personal';
  startDate: string;
  endDate: string;
  documentUrl?: string;
  approved: boolean;
}

export interface TimeBank {
  id: string;
  employeeId: string;
  minutes: number;
  description: string;
  date: string;
}

export interface GoalType {
  id: string;
  name: string;
  description: string;
  points: number;
  supervisorId: string;
}

export interface GoalAchievement {
  id: string;
  employeeId: string;
  goalTypeId: string;
  date: string;
  points: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'shift_change' | 'approval' | 'goal' | 'schedule' | 'absence';
}
