import { apiClient, ApiResponse } from './client';
import type { BusinessDay, Shift } from './core';

export interface ShiftWithUsers extends Shift {
  opened_by_user?: { id: string; full_name: string } | null;
  closed_by_user?: { id: string; full_name: string } | null;
}

export interface ChecklistItem {
  key: 'open_bills' | 'pending_drops' | 'unverified_payments' | 'unbilled_orders';
  label: string;
  count: number;
  amount: number;
  blocking: boolean;
}

export interface DayStatus {
  trading_date: string;
  start_hour: number;
  night_shift_hour: number;
  day: BusinessDay | null;
  shift: ShiftWithUsers | null;
  shifts: ShiftWithUsers[];
  checklist: { items: ChecklistItem[]; ready: boolean } | null;
}

export async function getDayStatus(propertyId?: string) {
  const res = await apiClient.get<ApiResponse<DayStatus>>('/business-days/status', {
    params: propertyId ? { property_id: propertyId } : undefined,
  });
  return res.data.data;
}

export async function startNextShift(args: { property_id?: string; code?: 'day' | 'night'; notes?: string }) {
  const res = await apiClient.post<ApiResponse<Shift>>('/business-days/shifts/next', args);
  return res.data.data;
}

export async function closeShift(args: { id: string; notes?: string }) {
  const res = await apiClient.post<ApiResponse<Shift>>(`/business-days/shifts/${args.id}/close`, {
    notes: args.notes,
  });
  return res.data.data;
}

export async function closeBusinessDay(args: { id: string; force?: boolean; notes?: string }) {
  const res = await apiClient.post<ApiResponse<BusinessDay>>(`/business-days/${args.id}/close`, {
    force: args.force,
    notes: args.notes,
  });
  return res.data.data;
}

export async function reopenBusinessDay(args: { id: string; notes?: string }) {
  const res = await apiClient.post<ApiResponse<{ day: BusinessDay; shift: Shift }>>(
    `/business-days/${args.id}/reopen`,
    { notes: args.notes }
  );
  return res.data.data;
}
