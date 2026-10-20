import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Cash in hand ──────────────────────────────────────────────────
export interface CashInHand {
  received: number;
  petty_cash: number;
  handed_over: number;
  in_hand: number;
}

export interface Remittance {
  id: string;
  remit_ref: string;
  property?: { id: string; code: string };
  cashier?: { id: string; full_name: string };
  receiver: { id: string; full_name: string } | null;
  expected_amount: number;
  amount: number;
  received_amount: number | null;
  status: 'pending' | 'received' | 'disputed';
  notes: string | null;
  dispute_reason: string | null;
  created_at: string;
  received_at: string | null;
  lines: RemitLine[];
}

export type PayMethod = 'cash' | 'mpesa' | 'card' | 'cheque' | 'bank' | 'other';
export interface RemitLine { method: PayMethod; expected_amount: number; amount: number; received_amount: number | null }
export interface Holding { method: PayMethod; taken: number; petty_cash: number; handed_over: number; in_hand: number }
export interface Takings {
  by_method: { method: PayMethod; total: number; checked: number; waiting: number; failed: number; events: number; count: number }[];
  total: number;
}
export interface RemitReport {
  from: string;
  to: string;
  by_method: { method: PayMethod; handed: number; received: number; pending: number; short: number }[];
  total: { handed: number; received: number; pending: number; short: number };
  by_day: ({ date: string; total: number } & Record<PayMethod, number>)[];
  by_cashier: ({ id: string; full_name: string; property: string; total: number } & Record<PayMethod, number>)[];
  takings: Takings;
}

export interface CashierSummary {
  date: string;
  cashier: { id: string; full_name: string; username: string };
  property_id: string;
  cash: CashInHand;
  holdings: Holding[];
  total_in_hand: number;
  takings: Takings;
  drops_waiting: number;
  shortages?: {
    handover_total: number;
    handover: { ref: string; handed: number; received: number; short: number; at: string | null; reason: string | null }[];
    rejected_drops_total: number;
    rejected_drops: { ref: string; amount: number }[];
  };
  today: {
    drops_received: number;
    petty_cash: number;
    handed_over: number;
    checked: { method: string; status: string; count: number; amount: number }[];
  };
  drops: { id: string; drop_ref: string; outlet: string; amount: number; waiter: string | null; at: string }[];
  petty: {
    id: string;
    petty_ref: string;
    kind: 'expense' | 'stock';
    category: string;
    description: string;
    payee: string | null;
    amount: number;
    item: string | null;
    quantity: number | null;
    at: string;
  }[];
  remittances: Remittance[];
}

export interface CashierPerson {
  id: string;
  full_name: string;
  role: string;
  property: string | null;
}

export async function getCashierSummary(params: { date?: string; cashier_id?: string }) {
  const res = await apiClient.get<ApiResponse<CashierSummary>>('/cashier/summary', { params });
  return res.data.data;
}

export async function listCashiers() {
  const res = await apiClient.get<ApiResponse<CashierPerson[]>>('/cashier/people');
  return res.data.data;
}

// ─── Handing cash to the MD ────────────────────────────────────────
export async function listRemittances(params: { page?: number; limit?: number; status?: string; from?: string; to?: string }) {
  const res = await apiClient.get<PaginatedResponse<Remittance> & { pending_total: number }>('/cash-remittances', {
    params,
  });
  return res.data;
}

export async function getRemitReport(params: { from?: string; to?: string; property_id?: string }) {
  const res = await apiClient.get<ApiResponse<RemitReport>>('/cash-remittances/report', { params });
  return res.data.data;
}

export async function createRemittance(data: { amount?: number; lines?: { method: PayMethod; amount: number }[]; notes?: string }) {
  const res = await apiClient.post<ApiResponse<Remittance>>('/cash-remittances', data);
  return res.data.data;
}

export async function decideRemittance(
  id: string,
  data: { decision: 'receive' | 'dispute'; method?: string; received_amount?: number; lines?: { method: string; received_amount: number }[]; reason?: string }
) {
  const res = await apiClient.post<ApiResponse<Remittance>>(`/cash-remittances/${id}/decide`, data);
  return res.data.data;
}

// ─── Petty cash ────────────────────────────────────────────────────
export interface PettyCash {
  id: string;
  petty_ref: string;
  kind: 'expense' | 'stock';
  category: string;
  description: string;
  payee: string | null;
  receipt_ref: string | null;
  amount: number;
  status: 'pending' | 'authorised' | 'rejected';
  authorised_by: { id: string; full_name: string } | null;
  authorised_at: string | null;
  decision_note: string | null;
  quantity: number | null;
  item: string | null;
  batch: { id: string; batch_ref: string } | null;
  paid_by: { id: string; full_name: string } | null;
  property: { id: string; code: string } | null;
  created_at: string;
}

export async function listPettyCash(params: { page?: number; limit?: number; kind?: string; from?: string; to?: string }) {
  const res = await apiClient.get<PaginatedResponse<PettyCash> & { total_amount: number }>('/petty-cash', { params });
  return res.data;
}

export async function createPettyCash(data: {
  kind: 'expense' | 'stock';
  amount: number;
  description: string;
  category?: string;
  payee?: string;
  receipt_ref?: string;
  stock_item_id?: string;
  quantity?: number;
}) {
  const res = await apiClient.post<ApiResponse<{ petty_ref: string; amount: number; batch_ref: string | null; status?: string }>>(
    '/petty-cash',
    data
  );
  return res.data.data;
}

export async function decidePettyCash(id: string, decision: 'authorise' | 'reject', note?: string) {
  const res = await apiClient.post(`/petty-cash/${id}/${decision}`, decision === 'reject' ? { note } : {});
  return res.data;
}

// ─── Waste value ───────────────────────────────────────────────────
export interface UnitCost {
  stock_item_id: string;
  item: string | null;
  unit: { id: string; name: string; code: string } | null;
  unit_cost: number;
  batch: { id: string; batch_ref: string } | null;
}

export async function getWasteUnitCost(stockItemId: string) {
  const res = await apiClient.get<ApiResponse<UnitCost>>('/waste-records/unit-cost', {
    params: { stock_item_id: stockItemId },
  });
  return res.data.data;
}
