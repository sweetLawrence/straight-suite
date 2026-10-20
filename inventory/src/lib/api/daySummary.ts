import { apiClient, ApiResponse } from './client';

export interface Sign { name: string; id: string; at: string }
export interface SummaryRecord {
  status: 'open' | 'closed' | 'acknowledged';
  note: string | null;
  extras: { label: string; amount: number }[];
  signs: Record<string, Sign>;
  prepared_by: string | null;
  cashier_sign: Sign | null;
  closed_sign: Sign | null;
  ack_sign: Sign | null;
}
export interface SummaryRow {
  key: string;
  account: string;
  person: { id: string; name: string };
  expected: number; declared: number; mpesa: number; cash: number; card: number; signed: number; outstanding: number;
}
export interface FootRow { id: string; name: string; department: string; brought_forward: number; shortage: number; carried_forward: number }
export interface DailySummary {
  date: string;
  property: { id: string; code: string; name: string } | null;
  rows: SummaryRow[];
  totals: { expected: number; declared: number; mpesa: number; cash: number; card: number; signed: number; outstanding: number };
  cashier?: { brought_forward: number; collection: number; total: number; expenses: number; to_md: number; carried_forward: number };
  paybill: number; signed_bills: number; unsigned_bills: number;
  stock?: { bar_value: number; store_value: number; bar_value_cost: number; store_value_cost: number };
  footnote: FootRow[];
  record: SummaryRecord;
}
export interface ValueSummary {
  date: string;
  property: DailySummary['property'];
  lines: { label: string; opening: number | null; addition: number | null; total: number | null; closing: number | null; sales: number | null }[];
  total_sales: number;
  distribution: { label: string; amount: number }[]; distribution_total: number;
  expenses: { label: string; amount: number }[]; expenses_total: number;
  expected_from_cashier: number;
  shortages: { name: string; amount: number }[]; shortage_total: number;
  availed_by_cashier: number; cash_in_hand_per_system: number; difference: number;
  footnote: FootRow[];
  record: SummaryRecord;
}
export interface StoreItem {
  name: string; unit: string | null; price: number | null;
  opening: number; received: number; total: number; closing: number; used: number;
  v_opening: number; v_received: number; v_total: number; v_closing: number; v_used: number;
}
export interface StoreSheet {
  date: string; property: DailySummary['property'];
  items: StoreItem[];
  totals: { opening: number; received: number; total: number; closing: number; used: number };
}

type P = { date?: string; property_id?: string };
export const getDaily = async (params: P) => (await apiClient.get<ApiResponse<DailySummary>>('/day-summary', { params })).data.data;
export const getValue = async (params: P) => (await apiClient.get<ApiResponse<ValueSummary>>('/day-summary/value', { params })).data.data;
export const getStore = async (params: P) => (await apiClient.get<ApiResponse<StoreSheet>>('/day-summary/store', { params })).data.data;
export const getWaiting = async (params: P = {}) => (await apiClient.get<ApiResponse<{ closed: number }>>('/day-summary/waiting', { params })).data.data;
export const editSummary = async (p: P & { note?: string | null; prepared_by?: string | null; extras?: { label: string; amount: number }[] }) => {
  const { date, property_id, ...body } = p;
  return (await apiClient.put<ApiResponse<SummaryRecord>>('/day-summary', body, { params: { date, property_id } })).data.data;
};
export const summaryAction = async (p: P & { action: 'sign-row' | 'sign-cashier' | 'close' | 'reopen' | 'acknowledge' }) =>
  (await apiClient.post<ApiResponse<SummaryRecord>>(`/day-summary/${p.action}`, {}, { params: { date: p.date, property_id: p.property_id } })).data.data;

/** Excel file of one layout */
export async function downloadSummary(layout: 'daily' | 'value' | 'store', params: P) {
  const res = await apiClient.get('/day-summary/export', { params: { ...params, layout }, responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layout}-summary-${params.date ?? 'today'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
