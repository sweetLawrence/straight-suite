import { apiClient, ApiResponse } from './client';

const d = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

export interface RangeParams { from?: string; to?: string; property_id?: string }
export type Aging = { d0_7: number; d8_30: number; d31_60: number; d61: number };
export const METHODS = ['cash', 'mpesa', 'card', 'cheque', 'bank', 'other'] as const;

export interface DayBookRow {
  date: string;
  bills: number;
  restaurant: number; bar: number; events: number; gross: number; house: number; vat: number; net: number;
  cash: number; mpesa: number; card: number; cheque: number; bank: number; other: number; received: number;
  discounts: number; voids: number; petty_expense: number; petty_stock: number; purchases: number; supplier_paid: number;
}
export interface DayBook { from: string; to: string; vat_rate: number; rows: DayBookRow[]; totals: Partial<DayBookRow> }

export interface DebtorRow {
  kind: 'pay_later' | 'open_bill' | 'event';
  id: string; ref: string; who: string; phone: string | null; property: string;
  date: string; due: string | null; amount: number; paid: number; balance: number; age: number; bucket: keyof Aging; overdue: boolean;
}
export interface Debtors { as_of: string; rows: DebtorRow[]; aging: Aging; totals: { pay_later: number; open_bills: number; events: number; all: number } }

export interface SupplierRow {
  id: string; name: string; phone: string | null; kra_pin: string | null; payment_terms: string | null; status: string;
  opening: number; delivered: number; paid: number; credits: number; balance: number;
  deliveries: number; last_delivery: string | null; oldest_unpaid: string | null; aging: Aging;
}
export interface Suppliers { as_of: string; rows: SupplierRow[]; aging: Aging; totals: { opening: number; delivered: number; paid: number; credits: number; balance: number } }

export interface StatementLine {
  id: string; kind: 'delivery' | 'payment' | 'credit_note' | 'opening_balance'; label: string;
  date: string; ref: string | null; detail: string; debit: number; credit: number; balance: number; status: 'recorded' | 'voided';
}
export interface SupplierStatement {
  supplier: { id: string; name: string; phone: string | null; email: string | null; kra_pin: string | null; payment_terms: string | null };
  from: string | null; to: string; brought_forward: number; lines: StatementLine[]; balance: number;
}

export interface PurchaseRow {
  id: string; date: string; batch_ref: string; purchase_ref: string | null; supplier: string | null; item: string; store: string;
  qty: number; unit: string | null; amount: number; property: string; paid_by: 'petty_cash' | 'on_account' | 'not_linked';
}
export interface Purchases {
  from: string; to: string; rows: PurchaseRow[]; by_supplier: { supplier: string; amount: number }[];
  totals: { all: number; on_account: number; petty_cash: number; not_linked: number; unpriced: number };
}

export interface ExpenseRow {
  id: string; ref: string; date: string; kind: 'expense' | 'stock'; category: string; description: string; payee: string | null;
  receipt_ref: string | null; amount: number; paid_by: string | null; property: string;
}
export interface Expenses {
  from: string; to: string; rows: ExpenseRow[];
  by_category: { key: string; label: string; amount: number }[];
  stock_losses: { key: string; label: string; amount: number }[];
  totals: { petty_expense: number; petty_stock: number; stock_losses: number; all: number };
}

export interface VatMonth {
  month: number; label: string; bill_sales: number; house: number; bill_sales_ex_vat: number; bill_vat: number;
  event_sales_ex_vat: number; event_vat: number; output_vat: number; purchases: number; etims_sent: number; etims_pending: number; etims_tax: number;
}
export interface Vat { year: number; vat_rate: number; months: VatMonth[]; totals: Partial<VatMonth> }

export interface JournalEntry { title: string; note: string; lines: { account: string; debit: number; credit: number }[]; debit: number; credit: number }
export interface Journal {
  from: string; to: string; entries: JournalEntry[]; trial: { account: string; debit: number; credit: number }[];
  totals: { debit: number; credit: number; balanced: boolean };
}

export interface StockValue {
  as_of: string;
  rows: { property: string; store: string; label: string; items: number; value: number; unpriced: number }[];
  items: { property: string; store: string; name: string; unit: string | null; quantity: number; buy_price: number | null; value: number | null }[];
  total: number;
}

const clean = (p: object) => Object.fromEntries(Object.entries(p).filter(([, v]) => v != null && v !== ''));

export interface DailySales {
  from: string; to: string; vat_rate: number;
  rows: { date: string; bills: number; restaurant: number; bar: number; events: number; gross: number; house: number; vat: number; net: number; cash: number; mpesa: number; card: number; other_in: number; received: number; cash_bf: number; cash_in: number; cash_out: number; cash_to_md: number; cash_cf: number }[];
  totals: Record<string, number>;
}
export const getDailySales = (p: RangeParams) => d<DailySales>(apiClient.get('/accounts/daily', { params: clean(p) }));
export const getDayBook = (p: RangeParams) => d<DayBook>(apiClient.get('/accounts/day-book', { params: clean(p) }));
export const getDebtors = (p: RangeParams) => d<Debtors>(apiClient.get('/accounts/debtors', { params: clean(p) }));
export const getSuppliers = (p: RangeParams) => d<Suppliers>(apiClient.get('/accounts/suppliers', { params: clean(p) }));
export const getSupplierStatement = (id: string, p: RangeParams) => d<SupplierStatement>(apiClient.get(`/accounts/suppliers/${id}`, { params: clean(p) }));
export const getPurchases = (p: RangeParams) => d<Purchases>(apiClient.get('/accounts/purchases', { params: clean(p) }));
export const getExpenses = (p: RangeParams) => d<Expenses>(apiClient.get('/accounts/expenses', { params: clean(p) }));
export const getVat = (p: { year?: number; property_id?: string }) => d<Vat>(apiClient.get('/accounts/vat', { params: clean(p) }));
export const getJournal = (p: RangeParams) => d<Journal>(apiClient.get('/accounts/journal', { params: clean(p) }));
export const getStockValue = (p: RangeParams) => d<StockValue>(apiClient.get('/accounts/stock-value', { params: clean(p) }));

export interface SupplierEntryInput {
  supplier_id: string; property_id?: string; kind: 'payment' | 'credit_note' | 'opening_balance';
  amount: number; method?: string | null; reference?: string | null; paid_on?: string; notes?: string | null;
}
export const recordSupplierEntry = (body: SupplierEntryInput) => d<{ id: string }>(apiClient.post('/accounts/supplier-entries', body));
export const voidSupplierEntry = (id: string, reason: string) => d<{ id: string }>(apiClient.post(`/accounts/supplier-entries/${id}/void`, { reason }));

/** The whole accountant pack as one Excel workbook (the server names the file) */
export async function downloadAccountsPack(p: RangeParams) {
  const res = await apiClient.get<Blob>('/accounts/export', { params: clean(p), responseType: 'blob' });
  const match = String(res.headers['content-disposition'] || '').match(/filename="?([^"]+)"?/);
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : `accounts-${p.from}-to-${p.to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
