export type UserRole = 'supervisor' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  supervisorId?: string;
  initials: string;
  avatarColor: string;
  position?: string;
}

export type ShiftType = 'OPENING' | 'MID' | 'CLOSING';
export type ShiftPeriod = 'morning' | 'afternoon' | 'night' | 'partial' | 'dayoff';

export interface ShiftTemplate {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  period: ShiftPeriod;
  supervisorId: string;
  breakMinutes: number;
  active: boolean;
}

export interface ScheduleSettings {
  daysOffPerMonth: number;
  coverageStart: string; // HH:MM
  coverageEnd: string;   // HH:MM
  allowManualEdit: boolean;
  maxConsecutiveDays: number;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftTemplateId?: string;
  isDayOff: boolean;
  absenceType?: 'dayoff' | 'vacation' | 'medical' | 'absence';
}

export interface ScheduleAbsence {
  employeeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'dayoff' | 'vacation' | 'medical' | 'absence';
  label?: string;
}

export interface Request {
  id: string;
  employeeId: string;
  type: 'dayoff' | 'shift_change' | 'time_bank' | 'vacation' | 'medical';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
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
