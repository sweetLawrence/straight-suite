import { apiClient, ApiResponse, PaginatedResponse } from './client';

const d = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

export type MonthStatus = 'open' | 'current' | 'future' | 'closed' | 'reopened' | 'partial';
export interface StatementLine { key: string; label: string; section: 'revenue' | 'cost' | 'expense' | 'note'; values: number[]; total: number }
export interface Statement {
  year: number;
  property_ids: string[];
  vat_rate: number;
  months: { month: number; label: string; status: MonthStatus; closed_at: string | null; closed_by: string | null; reopen_reason: string | null }[];
  lines: StatementLine[];
  totals: Record<'revenue' | 'cost' | 'gross_profit' | 'expenses' | 'net_profit', { values: number[]; total: number }>;
  unpaid: StatementLine;
}
export interface CostOfSales {
  year: number;
  month: number;
  items: { stock_item_id: string; name: string; area: 'kitchen' | 'bar' | 'events'; quantity: number; cost: number }[];
  totals: { kitchen: number; bar: number; events: number; all: number };
}
export interface EtimsInvoice {
  id: string;
  property?: { id: string; code: string; name: string };
  source_type: 'bill' | 'event';
  source_id: string;
  source_ref: string;
  invc_no: number;
  total: number;
  tax_amount: number;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_error: string | null;
  rcpt_no: string | null;
  intrl_data: string | null;
  rcpt_sign: string | null;
  sdc_id: string | null;
  sdc_time: string | null;
  sent_at: string | null;
  created_at: string;
}
export interface EtimsDevice {
  mode: 'off' | 'sandbox' | 'live';
  url: string;
  tax_type: string;
  properties: { id: string; code: string; name: string; kra_pin: string | null; bhf_id: string; device_serial: string | null; initialised: boolean; sdc_id: string | null }[];
}
export interface AreaFigures { key: 'food' | 'bar' | 'events'; label: string; sales: number; net: number; cost: number; estimated: number; profit: number; margin: number | null }
export interface MoneyFigures {
  gross_revenue: number;
  house: number;
  vat: number;
  net_revenue: number;
  cost_of_sales: number;
  gross_profit: number;
  gross_margin: number | null;
  expenses: number;
  net_profit: number;
  net_margin: number | null;
  unpaid_bills: number;
  areas: AreaFigures[];
  expense_lines: { key: string; label: string; amount: number }[];
}
type Counted = { amount: number; count: number };
export interface MoneyOverview extends MoneyFigures {
  from: string;
  to: string;
  as_of: string;
  vat_rate: number;
  properties: ({ id: string; code: string; name: string } & MoneyFigures)[];
  activity: {
    discounts: Counted; voided_bills: Counted; stock_bought: Counted; petty_expenses: Counted; petty_stock: Counted;
    event_payments: Counted; events_owed: Counted; handover_short: Counted; not_with_md: number; events_no_stock: Counted; pay_later?: Counted;
  };
  feed: { id: string; type: string; label: string; kind: 'loss' | 'cost' | 'cash' | 'income' | 'info'; amount: number | null; detail: string | null; note: string | null; by: string | null; property: string | null; at: string }[];
}

export interface ItemProfit {
  from: string;
  to: string;
  vat_rate: number;
  items: {
    menu_item_id: string; name: string; property: string; category: string | null; area: 'food' | 'bar'; quantity: number; sales: number; price_each: number;
    cost: number; cost_each: number; profit: number; profit_each: number; profit_after_vat: number; margin: number | null; no_stock: boolean; estimated: boolean; unpriced: boolean;
  }[];
  totals: { sales: number; cost: number; profit: number; profit_after_vat: number };
  price_list: {
    menu_item_id: string; name: string; property: string; category: string | null; area: 'food' | 'bar'; price: number; cost: number; profit: number;
    profit_after_vat: number; margin: number | null; made_of: string | null; no_recipe: boolean; unpriced: boolean;
  }[];
  warnings: { no_stock: number; estimated: number; unpriced: number; no_recipe: number };
}
export const getItemProfit = (params: { from?: string; to?: string; property_id?: string }) => d<ItemProfit>(apiClient.get('/finance/items', { params }));

type Scope = { year?: number; month?: number; property_id?: string };
export const getOverview = (params: { from?: string; to?: string; property_id?: string }) => d<MoneyOverview>(apiClient.get('/finance/overview', { params }));

export const getStatement = (params: Scope) => d<Statement>(apiClient.get('/finance/statement', { params }));
export const getCostOfSales = (params: Scope) => d<CostOfSales>(apiClient.get('/finance/cost-of-sales', { params }));
export const closeMonth = (data: { year: number; month: number; property_id?: string; notes?: string }) => d(apiClient.post('/finance/periods/close', data));
export const reopenMonth = (data: { year: number; month: number; property_id?: string; reason: string }) => d(apiClient.post('/finance/periods/reopen', data));

export const listEtims = async (params: { page?: number; limit?: number; status?: string; search?: string; property_id?: string }) =>
  (await apiClient.get<PaginatedResponse<EtimsInvoice> & { summary: { mode: string; pending: number; failed: number; sent: number } }>('/etims', { params })).data;
export const etimsFor = (type: 'bill' | 'event', id: string) => d<EtimsInvoice | null>(apiClient.get(`/etims/for/${type}/${id}`));
export const resendEtims = (id: string) => d<EtimsInvoice>(apiClient.post(`/etims/${id}/resend`));
export const getEtimsDevice = () => d<EtimsDevice>(apiClient.get('/etims/device'));
export const saveEtimsDevice = (data: { property_id?: string; kra_pin?: string; bhf_id?: string; device_serial?: string }) => d(apiClient.put('/etims/device', data));
export const initialiseEtims = (property_id?: string) => d<{ initialised: boolean; sdc_id: string | null }>(apiClient.post('/etims/device/initialise', property_id ? { property_id } : {}));
