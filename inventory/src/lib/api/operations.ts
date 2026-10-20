import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── STAFF MEALS ────────────────────────────────────────────────────
export interface StaffMealLine {
  id: string;
  staff_meal_id: string;
  stock_item_id: string;
  portion_id: string | null;
  batch_id: string | null;
  production_output_id: string | null;
  quantity: string;
  unit_id: string;
  cost_amount: string;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  portion?: { id: string; portion_ref: string };
  batch?: { id: string; batch_ref: string };
  unit?: { id: string; code: string; name: string };
}

export interface StaffMeal {
  id: string;
  staff_meal_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  staff_user_id: string | null;
  staff_name: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  source: 'menu' | 'alternative';
  authorized_by: string;
  issued_by: string | null;
  authorized_at: string;
  total_cost: string;
  status: 'requested' | 'dispatched' | 'issued' | 'cancelled';
  dispatched_by?: string | null;
  dispatched_at?: string | null;
  received_by?: string | null;
  received_at?: string | null;
  receive_notes?: string | null;
  staff_user?: { id: string; full_name: string; username: string };
  authorized_by_user?: { id: string; full_name: string };
  issued_by_user?: { id: string; full_name: string };   // ← add
  staff_meal_lines?: StaffMealLine[];
}

export async function listStaffMeals(params?: {
  page?: number;
  limit?: number;
  meal_type?: string;
  status?: string;
  staff_user_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<StaffMeal>>(
    '/staff-meals',
    { params }
  );
  return res.data;
}

export async function getStaffMeal(id: string) {
  const res = await apiClient.get<ApiResponse<StaffMeal>>(
    `/staff-meals/${id}`
  );
  return res.data.data;
}

export async function createStaffMeal(data: {
  staff_user_id?: string | null;
  staff_name: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  source?: 'menu' | 'alternative';
  lines: Array<{
    stock_item_id: string;
    portion_id?: string | null;
    batch_id?: string | null;
    production_output_id?: string | null;
    quantity: number;
    unit_id: string;
    cost_amount: number;
  }>;
}) {
  const res = await apiClient.post<ApiResponse<StaffMeal>>(
    '/staff-meals',
    data
  );
  return res.data.data;
}

/** Store sends the requested food (stock comes out) */
export async function dispatchStaffMeal(id: string) {
  const res = await apiClient.post<ApiResponse<StaffMeal>>(`/staff-meals/${id}/dispatch`);
  return res.data.data;
}

/** Branch manager confirms it arrived */
export async function receiveStaffMeal(id: string, notes?: string) {
  const res = await apiClient.post<ApiResponse<StaffMeal>>(`/staff-meals/${id}/receive`, { notes });
  return res.data.data;
}

export async function cancelStaffMeal(id: string) {
  const res = await apiClient.delete<ApiResponse<StaffMeal>>(
    `/staff-meals/${id}`
  );
  return res.data.data;
}

// ─── WASTE ──────────────────────────────────────────────────────────
export interface WasteRecord {
  id: string;
  waste_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  stock_item_id: string;
  batch_id: string | null;
  portion_id: string | null;
  quantity: string;
  unit_id: string;
  cost_amount: string;
  reason: string;
  recorded_by: string;
  authorized_by: string;
  recorded_at: string;
  status?: 'pending' | 'approved' | 'rejected';
  decision_note?: string | null;
  decided_by_user?: { id: string; full_name: string } | null;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  batch?: { id: string; batch_ref: string };
  portion?: { id: string; portion_ref: string };
  unit?: { id: string; code: string; name: string };
  recorded_by_user?: { id: string; full_name: string };
  authorized_by_user?: { id: string; full_name: string };
}

export async function listWaste(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  reason?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<WasteRecord>>(
    '/waste-records',
    { params }
  );
  return res.data;
}

export async function getWaste(id: string) {
  const res = await apiClient.get<ApiResponse<WasteRecord>>(
    `/waste-records/${id}`
  );
  return res.data.data;
}

export async function createWaste(data: {
  stock_item_id: string;
  batch_id?: string | null;
  portion_id?: string | null;
  quantity: number;
  unit_id: string;
  /** Leave out to value it automatically at cost */
  cost_amount?: number;
  reason: string;
  authorized_by?: string | null;
}) {
  const res = await apiClient.post<ApiResponse<WasteRecord>>(
    '/waste-records',
    data
  );
  return res.data.data;
}

// ─── STOCK RETURNS ──────────────────────────────────────────────────
export interface StockReturn {
  id: string;
  return_ref: string;
  property_id: string;
  business_day_id: string;
  shift_id: string;
  stock_item_id: string;
  batch_id: string | null;
  portion_id: string | null;
  bulk_issue_id: string | null;
  production_output_id: string | null;
  quantity: string;
  unit_id: string;
  return_type: 'portion' | 'bulk' | 'packaged' | 'production_output';
  reason: string | null;
  returned_by: string;
  received_by: string;
  returned_at: string;
  stock_item?: {
    id: string;
    item?: { id: string; code: string; name: string };
  };
  batch?: { id: string; batch_ref: string };
  portion?: { id: string; portion_ref: string };
  unit?: { id: string; code: string; name: string };
  returned_by_user?: { id: string; full_name: string };
  received_by_user?: { id: string; full_name: string };
}

export async function listReturns(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
  return_type?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<StockReturn>>(
    '/stock-returns',
    { params }
  );
  return res.data;
}

export async function getReturn(id: string) {
  const res = await apiClient.get<ApiResponse<StockReturn>>(
    `/stock-returns/${id}`
  );
  return res.data.data;
}

export async function createReturn(data: {
  stock_item_id: string;
  batch_id?: string | null;
  portion_id?: string | null;
  bulk_issue_id?: string | null;
  production_output_id?: string | null;
  quantity: number;
  unit_id: string;
  return_type: 'portion' | 'bulk' | 'packaged' | 'production_output';
  reason?: string | null;
  received_by?: string | null;
}) {
  const res = await apiClient.post<ApiResponse<StockReturn>>(
    '/stock-returns',
    data
  );
  return res.data.data;
}

// ─── DISPUTES ───────────────────────────────────────────────────────
export interface Dispute {
  id: string;
  dispute_ref: string;
  cash_drop_id: string | null;
  payment_line_id: string | null;
  property_id: string;
  raised_by: string;
  against_user_id: string | null;
  amount_disputed: string;
  waiter_statement: string | null;
  cashier_statement: string | null;
  status: 'open' | 'resolved' | 'escalated';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  raised_by_user?: { id: string; full_name: string };
  against_user?: { id: string; full_name: string };
  resolved_by_user?: { id: string; full_name: string };
  cash_drop?: {
    id: string;
    drop_ref: string;
    total_amount: string;
    waiter?: { id: string; full_name: string };
  };
  payment_line?: {
    id: string;
    method: string;
    amount: string;
    transaction_ref: string | null;
  };
}

export async function listDisputes(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<Dispute>>('/disputes', {
    params,
  });
  return res.data;
}

export async function getDispute(id: string) {
  const res = await apiClient.get<ApiResponse<Dispute>>(`/disputes/${id}`);
  return res.data.data;
}

export async function createDispute(data: {
  cash_drop_id?: string | null;
  payment_line_id?: string | null;
  against_user_id?: string | null;
  amount_disputed: number;
  waiter_statement?: string | null;
  cashier_statement?: string | null;
}) {
  const res = await apiClient.post<ApiResponse<Dispute>>('/disputes', data);
  return res.data.data;
}

export async function resolveDispute(id: string, data: { resolution: string }) {
  const res = await apiClient.post<ApiResponse<Dispute>>(
    `/disputes/${id}/resolve`,
    data
  );
  return res.data.data;
}





export interface DailyStaffMealEntry {
  staff_user_id: string;
  staff_name: string;
  status: 'issued' | 'pending';
  meal_id: string | null;
  meal_ref: string | null;
  items_count: number;
  total_cost: string | null;
  issued_by: string | null;
  issued_at: string | null;
  source: string | null;
}

export interface DailyStaffMealStatus {
  date: string;
  meal_type: string;
  property_id: string;
  total_eligible: number;
  total_issued: number;
  total_pending: number;
  coverage_pct: number;
  entries: DailyStaffMealEntry[];
}

export async function fetchDailyStaffMealStatus(params: {
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  property_id?: string;
}) {
  const res = await apiClient.get<ApiResponse<DailyStaffMealStatus>>(
    '/staff-meals/daily-status',
    { params }
  );
  return res.data.data;
}