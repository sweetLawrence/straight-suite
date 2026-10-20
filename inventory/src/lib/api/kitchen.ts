import { apiClient, ApiResponse } from './client';

export interface KitchenRow {
  id: string;
  ref: string;
  item: string;
  stock_item_id: string;
  unit: string | null;
  purpose: string;
  issued_by: string | null;
  issued_at: string;
  issued_qty: number;
  unit_cost: number;
  issued_value: number;
  closed: boolean;
  returned_qty: number | null;
  wasted_qty: number | null;
  used_qty: number | null;
  used_cost: number | null;
  notes: string | null;
}
export interface KitchenDay {
  date: string;
  totals: { issues: number; open: number; issued_value: number; used_cost: number; returned_value: number; wasted_value: number };
  rows: KitchenRow[];
}
export interface ExpiringBatch {
  batch_id: string;
  batch_ref: string;
  name: string;
  store_type: string;
  property: string;
  unit: string | null;
  expiry_date: string;
  days_left: number;
  expired: boolean;
  left_qty: number;
  value: number;
}

export const getKitchenDay = async (params: { date?: string }) =>
  (await apiClient.get<ApiResponse<KitchenDay>>('/kitchen/day', { params })).data.data;
export const closeKitchenIssue = async (id: string, data: { returned_qty: number; wasted_qty: number; notes?: string }) =>
  (await apiClient.post<ApiResponse<{ used_qty: number; used_cost: number }>>(`/kitchen/issues/${id}/close`, data)).data.data;
export const getExpiring = async (days: number) =>
  (await apiClient.get<ApiResponse<ExpiringBatch[]>>('/kitchen/expiring', { params: { days } })).data.data;
