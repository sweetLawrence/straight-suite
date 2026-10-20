import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { Property } from './core';

// ─── Date range helpers ─────────────────────────────────────────────
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'custom';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

// ─── Aggregation input types (raw data from list endpoints) ─────────
export interface BillSummary {
  id: string;
  bill_ref: string;
  property_id: string;
  net_total: string;
  gross_total: string;
  discount_total: string;
  status: string;
  waiter_id: string;
  business_day_id: string;
  created_at: string;
  waiter?: { id: string; full_name: string; username: string };
  property?: { id: string; code: string; name: string };
}

export interface PaymentSummary {
  id: string;
  payment_ref: string;
  property_id: string;
  total_amount: string;
  status: string;
  business_day_id: string;
  created_at: string;
  payment_lines?: Array<{
    id: string;
    method: 'cash' | 'mpesa' | 'card' | 'cheque' | 'house' | 'other';
    amount: string;
    verification_status: string;
  }>;
}

export interface ExceptionSummary {
  id: string;
  exception_ref: string;
  property_id: string;
  severity: string;
  status: string;
  exception_type: string;
  amount: string | null;
  created_at: string;
}

// ─── Fetchers with filters ─────────────────────────────────────────
export async function fetchBillsInRange(params: {
  from: string;
  to: string;
  property_id?: string;
  page?: number;
  limit?: number;
}) {
  // Backend supports business_day_id filter, not date range directly.
  // We fetch with a high limit and filter client-side by created_at.
  const res = await apiClient.get<PaginatedResponse<BillSummary>>('/bills', {
    params: {
      property_id: params.property_id,
      limit: params.limit || 500,
      page: params.page || 1,
    },
  });
  const data = res.data.data.filter((b) => {
    const d = b.created_at.slice(0, 10);
    return d >= params.from && d <= params.to;
  });
  return data;
}

export async function fetchPaymentsInRange(params: {
  from: string;
  to: string;
  property_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<PaymentSummary>>(
    '/payments',
    {
      params: {
        property_id: params.property_id,
        limit: 500,
      },
    }
  );
  return res.data.data.filter((p) => {
    const d = p.created_at.slice(0, 10);
    return d >= params.from && d <= params.to;
  });
}

export async function fetchExceptionsInRange(params: {
  from: string;
  to: string;
  property_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<ExceptionSummary>>(
    '/exceptions',
    {
      params: {
        property_id: params.property_id,
        limit: 500,
      },
    }
  );
  return res.data.data.filter((e) => {
    const d = e.created_at.slice(0, 10);
    return d >= params.from && d <= params.to;
  });
}

export async function fetchPropertiesList() {
  const res = await apiClient.get<PaginatedResponse<Property>>('/properties', {
    params: { limit: 50 },
  });
  return res.data.data;
}
// ═══ Server-side reports (MD / manager) ═════════════════════════════
// Totals are computed by the API (/reports/*), not in the browser.

export interface ReportParams {
  from: string;
  to: string;
  property_id?: string;
}

export interface ReportPeriod {
  from: string;
  to: string;
  property: { id: string; code: string; name: string } | null;
}

export interface FinanceReport {
  summary: {
    bills: number;
    gross: number;
    discounts: number;
    net: number;
    avg_bill: number;
    open_bills: number;
    open_value: number;
    payments: number;
    payments_verified: number;
    payments_unverified: number;
  };
  by_method: { method: string; lines: number; total: number; verified: number; pending: number; problem: number }[];
  by_day: { day: string; bills: number; net: number; discounts: number }[];
  by_property: { code: string; name: string; bills: number; net: number; discounts: number }[];
  by_outlet: { outlet: string; bills: number; net: number }[];
  by_waiter: {
    waiter: string;
    bills: number;
    net: number;
    discounts: number;
    collected: number;
    cash_dropped: number;
    cash_verified: number;
  }[];
  top_items: { code: string; item: string; qty: number; revenue: number }[];
  cash: { dropped: number; verified: number; pending: number; disputed: number; drops: number };
}

export interface StockOnHandRow {
  id: string;
  code: string;
  name: string;
  property: string;
  store_type: string | null;
  stock_model: string | null;
  unit: string | null;
  reorder_level: number | null;
  pack_size: number | null;
  pack_label: string | null;
  qty: number;
  portions: number;
  unit_cost: number;
  value: number;
  status: 'ok' | 'low' | 'out';
}

export interface StockReport {
  summary: {
    value_on_hand: number;
    items: number;
    low: number;
    out: number;
    received_value: number;
    receipts: number;
    waste_value: number;
    waste_records: number;
    staff_meal_value: number;
    staff_meals: number;
    variances: number;
    variance_cost: number;
  };
  on_hand: StockOnHandRow[];
  receipts: {
    batch_ref: string;
    item: string;
    property: string;
    qty: number;
    unit: string | null;
    packs_received: number | null;
    pack_size: number | null;
    total_cost: number;
    purchase_ref: string | null;
    received_at: string;
    received_by: string | null;
  }[];
  waste: {
    waste_ref: string;
    item: string;
    property: string;
    qty: number;
    unit: string | null;
    cost: number;
    reason: string | null;
    recorded_at: string;
    recorded_by: string | null;
  }[];
  staff_meals: {
    ref: string;
    staff_name: string;
    meal_type: string;
    property: string;
    cost: number;
    created_at: string;
  }[];
  movements: { event_type: string; entries: number }[];
}

export interface CountAmount {
  count: number;
  amount: number;
}

export interface ControlReport {
  exceptions: { severity: string; count: number; amount: number }[];
  adjustments_pending: CountAmount;
  payments_unverified: CountAmount;
  cash_drops_pending: CountAmount;
  open_bills: CountAmount;
  transfers_open: { status: string; count: number }[];
}

export interface ReportOverview {
  period: ReportPeriod;
  finance: FinanceReport;
  stock: StockReport;
  control: ControlReport;
}

export interface ActivityRow {
  id: string;
  at: string;
  actor: string;
  role: string;
  property: string | null;
  area: string;
  action: string;
  detail: string;
}

export interface ActivityReport {
  period: ReportPeriod;
  people: { id: string; actor: string; role: string; actions: number; last_seen: string }[];
  areas: string[];
  rows: ActivityRow[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface ActivityParams extends ReportParams {
  actor_id?: string;
  area?: string;
  page?: number;
  limit?: number;
}

const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export async function getReportOverview(params: ReportParams) {
  const res = await apiClient.get<ApiResponse<ReportOverview>>('/reports/overview', {
    params: clean(params),
  });
  return res.data.data;
}

export async function getReportActivity(params: ActivityParams) {
  const res = await apiClient.get<ApiResponse<ActivityReport>>('/reports/activity', {
    params: clean(params),
  });
  return res.data.data;
}

// Goes through axios so the auth header is sent; the server names the file.
export async function downloadReport(params: ReportParams) {
  const res = await apiClient.get<Blob>('/reports/export', {
    params: clean(params),
    responseType: 'blob',
  });
  const disposition = String(res.headers['content-disposition'] || '');
  const match = disposition.match(/filename="?([^"]+)"?/);
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : `Straight-Report_${params.from}_to_${params.to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
