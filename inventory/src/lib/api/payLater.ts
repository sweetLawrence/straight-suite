import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface PayLaterBill {
  id: string;
  bill_ref: string;
  outlet: 'restaurant' | 'bar';
  status: 'open' | 'paid' | 'closed' | 'voided';
  amount: number;
  property?: { id: string; code: string };
  waiter: { id: string; full_name: string } | null;
  table_number: string | null;
  guest: string;
  room: string | null;
  phone: string | null;
  due: string | null;
  note: string | null;
  marked_by: string | null;
  marked_at: string | null;
  paid_at: string | null;
  overdue: boolean;
  opened_at: string;
}
export interface PayLaterInput { guest_name: string; room?: string; phone?: string; due_date?: string; note?: string }

export const listPayLater = async (params: { page?: number; limit?: number; status?: 'outstanding' | 'settled' | 'all'; outlet?: 'restaurant' | 'bar' }) =>
  (await apiClient.get<PaginatedResponse<PayLaterBill> & { summary: { outstanding: number; count: number; overdue: number } }>('/bills/pay-later', { params })).data;
export const markPayLater = async (billId: string, data: PayLaterInput) =>
  (await apiClient.post<ApiResponse<PayLaterBill>>(`/bills/${billId}/pay-later`, data)).data.data;
export const cancelPayLater = async (billId: string, reason?: string) =>
  (await apiClient.post<ApiResponse<PayLaterBill>>(`/bills/${billId}/pay-later/cancel`, { reason })).data.data;
