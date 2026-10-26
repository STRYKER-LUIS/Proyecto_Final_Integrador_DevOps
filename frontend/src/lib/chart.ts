import type { Category, IncidentStatus, Priority } from '../types';

export const TREND_COLORS = {
  created: '#6366f1',
  resolved: '#10b981',
} as const;

export const STATUS_CHART_COLORS: Record<IncidentStatus, string> = {
  NEW: '#6366f1',
  ASSIGNED: '#0ea5e9',
  IN_PROGRESS: '#8b5cf6',
  ON_HOLD: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
  CANCELLED: '#f43f5e',
};

export const PRIORITY_CHART_COLORS: Record<Priority, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#0ea5e9',
  HIGH: '#f59e0b',
  CRITICAL: '#ef4444',
};

export const CATEGORY_CHART_COLORS: Record<Category, string> = {
  HARDWARE: '#6366f1',
  SOFTWARE: '#8b5cf6',
  NETWORK: '#0ea5e9',
  ACCESS: '#f59e0b',
  EMAIL: '#10b981',
  OTHER: '#94a3b8',
};
