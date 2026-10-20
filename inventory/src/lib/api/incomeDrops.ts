import { apiClient, ApiResponse } from './client';

export interface IncomeDrop {
  id: string;
  drop_ref: string;
  property_id: string;
  collector: { id: string; full_name: string } | null;
  receiver: { id: string; full_name: string } | null;
  expected_amount: number;
  received_amount: number | null;
  short: number;
  by_method: Record<string, number>;
  status: 'pending' | 'verified' | 'disputed';
  notes: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface MyIncome {
  entries: { id: string; entry_ref: string; stream: string; method: string; amount: number; description: string | null; created_at: string }[];
  total: number;
  by_method: Record<string, number>;
  drops: IncomeDrop[];
}

export interface MoneyRow {
  kind: 'payments' | 'income' | 'handover';
  person: { id: string; full_name: string };
  property: string;
  expected: number;
  received: number;
  waiting: number;
  short: number;
  with_them: number;
}
export interface MoneyCheck {
  from: string;
  to: string;
  totals: { expected: number; received: number; waiting: number; short: number; with_them: number };
  rows: MoneyRow[];
}

export const getMyIncome = async () => (await apiClient.get<ApiResponse<MyIncome>>('/income/drops/mine')).data.data;
export const handIn = async (data: { entry_ids?: string[]; notes?: string }) =>
  (await apiClient.post<ApiResponse<IncomeDrop>>('/income/drops', data)).data.data;
export const listIncomeDrops = async (status?: string) =>
  (await apiClient.get<ApiResponse<IncomeDrop[]>>('/income/drops', { params: { status } })).data.data;
export const confirmIncomeDrop = async (p: { id: string; received_amount?: number; reason?: string }) =>
  (await apiClient.post<ApiResponse<IncomeDrop>>(`/income/drops/${p.id}/confirm`, { received_amount: p.received_amount, reason: p.reason })).data.data;
export const rejectIncomeDrop = async (p: { id: string; reason: string }) =>
  (await apiClient.post<ApiResponse<IncomeDrop>>(`/income/drops/${p.id}/reject`, { reason: p.reason })).data.data;
export const getMoneyCheck = async (params: { from?: string; to?: string; property_id?: string }) =>
  (await apiClient.get<ApiResponse<MoneyCheck>>('/cashier/accountability', { params })).data.data;

export interface ToDrop { cash: number; cash_count: number; cash_line_ids?: string[]; income: number; total: number; link: string }
export const getToDrop = async () => (await apiClient.get<ApiResponse<ToDrop>>('/cashier/to-drop')).data.data;
