import { apiClient, ApiResponse, PaginatedResponse } from './client';

export type StoreType = 'bar_store' | 'food_store' | 'kitchen';
export type TakeStatus = 'counting' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

export interface StockTakeLine {
  id: string;
  stock_item_id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  unit: string | null;
  pack_size: number | null;
  pack_label: string | null;
  /** Hidden (null) while counting */
  system_qty: number | null;
  counted_qty: number | null;
  variance_qty: number | null;
  unit_cost: number | null;
  unit_price: number | null;
  variance_value: number | null;
  note: string | null;
}

export interface StockTake {
  id: string;
  take_ref: string;
  store_type: StoreType;
  store: string;
  status: TakeStatus;
  property?: { id: string; code: string; name: string };
  counted_by: { id: string; full_name: string } | null;
  decided_by: { id: string; full_name: string } | null;
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  notes: string | null;
  decision_notes: string | null;
  variance_value: number | null;
  shortage_value: number | null;
  shortage_sell_value: number | null;
  blind: boolean;
  progress: { counted: number; total: number };
  lines?: StockTakeLine[];
}

export interface VarianceReport {
  totals: { takes: number; short_value: number; over_value: number; short_sell_value: number; net_value: number };
  items: {
    stock_item_id: string;
    name: string;
    store_type: StoreType | null;
    unit: string | null;
    short_qty: number;
    over_qty: number;
    short_value: number;
    over_value: number;
    short_sell_value: number;
    counts: number;
  }[];
  takes: {
    id: string;
    take_ref: string;
    store: string;
    status: TakeStatus;
    property: string | null;
    counted_by: string | null;
    submitted_at: string;
    shortage_value: number;
    variance_value: number;
  }[];
}

export async function listStockTakes(params: { page?: number; limit?: number; status?: string; store_type?: string }) {
  const res = await apiClient.get<PaginatedResponse<StockTake>>('/stock-takes', { params });
  return res.data;
}

export async function getStockTake(id: string) {
  const res = await apiClient.get<ApiResponse<StockTake>>(`/stock-takes/${id}`);
  return res.data.data;
}

export async function startStockTake(data: { store_type: StoreType; property_id?: string; notes?: string }) {
  const res = await apiClient.post<ApiResponse<StockTake>>('/stock-takes', data);
  return res.data.data;
}

export async function saveCounts(id: string, lines: { id: string; counted_qty: number | null; note?: string | null }[]) {
  const res = await apiClient.put<ApiResponse<StockTake>>(`/stock-takes/${id}/counts`, { lines });
  return res.data.data;
}

export async function submitStockTake(id: string, notes?: string) {
  const res = await apiClient.post<ApiResponse<StockTake>>(`/stock-takes/${id}/submit`, { notes });
  return res.data.data;
}

export async function cancelStockTake(id: string) {
  const res = await apiClient.post<ApiResponse<StockTake>>(`/stock-takes/${id}/cancel`);
  return res.data.data;
}

export async function decideStockTake(id: string, decision: 'approve' | 'reject', notes?: string) {
  const res = await apiClient.post<ApiResponse<StockTake>>(`/stock-takes/${id}/decide`, { decision, notes });
  return res.data.data;
}

export async function getVariances(params: { from?: string; to?: string; store_type?: string; property_id?: string }) {
  const res = await apiClient.get<ApiResponse<VarianceReport>>('/stock-takes/variances', { params });
  return res.data.data;
}
