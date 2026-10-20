/**
 * Each accounts tab turned into tiles and plain tables. The page, the print
 * page and the CSV download all draw from these, so they always agree.
 */
import dayjs from 'dayjs';
import type { DailySales, DayBook, Debtors, Expenses, Journal, Purchases, StockValue, SupplierStatement, Suppliers, Vat } from '@/lib/api/accounts';
import type { ItemProfit, MoneyOverview } from '@/lib/api/finance';

export type AccountsTab = 'daily' | 'itemprofit' | 'summary' | 'daybook' | 'debtors' | 'suppliers' | 'purchases' | 'expenses' | 'vat' | 'journal' | 'stock';

export const TABS: { value: AccountsTab; label: string; dates: 'range' | 'now' | 'year' | 'asof'; blurb: string }[] = [
  { value: 'daily', label: 'Sales per day', dates: 'range', blurb: 'Each day first: sales, money in, and the cashier cash brought forward and carried forward.' },
  { value: 'summary', label: 'Profit and loss', dates: 'range', blurb: 'Revenue, cost of sales, expenses and profit for the days picked.' },
  { value: 'itemprofit', label: 'Item profit', dates: 'range', blurb: 'What each item sold for, what it cost and what was kept, plus the whole menu price list.' },
  { value: 'daybook', label: 'Day book', dates: 'range', blurb: 'One line per trading day: sales, VAT, money in by method, money out.' },
  { value: 'debtors', label: 'Debtors', dates: 'now', blurb: 'Who owes us right now: guests paying later, unpaid bills, event balances.' },
  { value: 'suppliers', label: 'Suppliers', dates: 'now', blurb: 'What we owe each supplier: delivered, less paid and credit notes. Tap one for its statement.' },
  { value: 'purchases', label: 'Purchases', dates: 'range', blurb: 'Every delivery of stock at buying price, and how it was paid for.' },
  { value: 'expenses', label: 'Expenses', dates: 'range', blurb: 'Petty cash by category, and stock lost or used at buying price.' },
  { value: 'vat', label: 'VAT', dates: 'year', blurb: 'Output VAT per month from bills and events, with eTIMS invoices.' },
  { value: 'journal', label: 'Journal', dates: 'range', blurb: 'Balanced double entries for the period, ready to post, with a trial balance.' },
  { value: 'stock', label: 'Stock value', dates: 'asof', blurb: 'Stock on hand at buying price, per store, at the close of the day picked.' },
];

export type ColKind = 'text' | 'money' | 'qty' | 'date';
export interface Col { key: string; label: string; kind?: ColKind }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export interface Report {
  title: string;
  cols: Col[];
  rows: Row[];
  total?: Row;
  /** Row ids for click-through (same order as rows) */
  ids?: string[];
  /** Rows to show in bold (e.g. totals inside a statement) */
  strong?: number[];
}
export interface Tile { label: string; value: number; color: string; bg: string; hint?: string; count?: boolean }
export interface View { tiles: Tile[]; reports: Report[]; note?: string; warn?: string }

const NAVY = { color: '#1F3A5F', bg: '#EDF2F7' };
const GREEN = { color: '#2B8A3E', bg: '#EBFBEE' };
const RED = { color: '#C92A2A', bg: '#FFF5F5' };
const ORANGE = { color: '#D9480F', bg: '#FFF4E6' };
const BLUE = { color: '#1971C2', bg: '#E7F5FF' };
const GREY = { color: '#495057', bg: '#F1F3F5' };

const tile = (label: string, value: number, tone = NAVY, hint?: string): Tile => ({ label, value, ...tone, hint });
const money = (key: string, label: string): Col => ({ key, label, kind: 'money' });
const sumOf = (rows: Row[], keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, Math.round(rows.reduce((a, r) => a + Number(r[k] || 0), 0) * 100) / 100]));

const AGING: Col[] = [money('d0_7', '0-7 days'), money('d8_30', '8-30 days'), money('d31_60', '31-60 days'), money('d61', 'Over 60')];
const KIND = { pay_later: 'Pays later', open_bill: 'Unpaid bill', event: 'Event' } as const;
const PAID_BY = { petty_cash: 'Petty cash', on_account: 'Supplier account', not_linked: 'No supplier' } as const;
const STORE: Record<string, string> = { bar_store: 'Bar', food_store: 'Food store', kitchen: 'Kitchen' };

export function buildView(tab: AccountsTab, data: unknown): View {
  switch (tab) {
    case 'daily': {
      const b = data as DailySales;
      const t = b.totals;
      const keys = ['restaurant', 'bar', 'events', 'gross', 'house', 'vat', 'net', 'cash', 'mpesa', 'card', 'other_in', 'received', 'cash_in', 'cash_out', 'cash_to_md'];
      return {
        tiles: [
          tile('Gross sales', t.gross ?? 0, NAVY, `Net ${(t.net ?? 0).toLocaleString('en-KE')} after VAT and house`),
          tile('Money received', t.received ?? 0, GREEN, `Cash ${(t.cash ?? 0).toLocaleString('en-KE')} · M-Pesa ${(t.mpesa ?? 0).toLocaleString('en-KE')} · Card ${(t.card ?? 0).toLocaleString('en-KE')}`),
          tile('Cash brought forward', t.cash_bf ?? 0, GREY, 'Held by cashiers at the start'),
          tile('Cash carried forward', t.cash_cf ?? 0, (t.cash_cf ?? 0) > 0 ? ORANGE : GREEN, 'Still with cashiers at the end'),
        ],
        reports: [{
          title: 'Sales per day',
          cols: [
            { key: 'date', label: 'Date', kind: 'date' }, { key: 'bills', label: 'Bills', kind: 'qty' },
            money('restaurant', 'Restaurant'), money('bar', 'Bar'), money('events', 'Events'), money('gross', 'Gross'), money('house', 'House'), money('vat', 'VAT'), money('net', 'Net'),
            money('cash', 'Cash'), money('mpesa', 'M-Pesa'), money('card', 'Card'), money('other_in', 'Other in'), money('received', 'Received'),
            money('cash_bf', 'Cash B/F'), money('cash_in', 'Cash in'), money('cash_out', 'Paid out'), money('cash_to_md', 'To MD'), money('cash_cf', 'Cash C/F'),
          ],
          rows: b.rows,
          total: { date: 'Total', bills: t.bills, ...sumOf(b.rows, keys), cash_bf: t.cash_bf, cash_cf: t.cash_cf },
        }],
        note: 'Cash B/F is what the cashiers held at the start of the day. Cash in is cash they took in. Paid out is petty cash. To MD is cash handed over. Cash C/F is what is left, and it is the next day\'s B/F.',
      };
    }
    case 'itemprofit': {
      const p = data as ItemProfit;
      const t = p.totals;
      const sold = p.items.map((i) => ({ ...i, area_label: i.area === 'bar' ? 'Bar' : 'Food' }));
      const list = p.price_list.map((i) => ({ ...i, area_label: i.area === 'bar' ? 'Bar' : 'Food' }));
      const w = p.warnings;
      return {
        tiles: [
          tile('Sold for', t.sales, NAVY),
          tile('Buying cost', t.cost, GREY),
          tile(p.vat_rate > 0 ? 'Profit (VAT out)' : 'Profit', t.profit_after_vat, t.profit_after_vat < 0 ? RED : GREEN),
          { ...tile('Items to fix', w.unpriced + w.no_stock + w.no_recipe, w.unpriced + w.no_stock + w.no_recipe ? ORANGE : GREEN, 'Missing cost, stock or recipe'), count: true },
        ],
        reports: [
          {
            title: 'Sold in the period',
            cols: [{ key: 'name', label: 'Item' }, { key: 'property', label: 'Property' }, { key: 'area_label', label: 'Area' }, { key: 'quantity', label: 'Qty', kind: 'qty' },
              money('sales', 'Sold for'), money('cost', 'Cost'), money('profit', 'Profit'), money('profit_after_vat', 'Profit (VAT out)'), { key: 'margin', label: 'Margin %', kind: 'qty' }],
            rows: sold,
            total: { name: 'Total', ...sumOf(sold, ['quantity', 'sales', 'cost', 'profit', 'profit_after_vat']) },
          },
          {
            title: 'Menu price list: cost and profit per portion',
            cols: [{ key: 'name', label: 'Item' }, { key: 'property', label: 'Property' }, { key: 'area_label', label: 'Area' },
              money('price', 'Price'), money('cost', 'Cost'), money('profit', 'Profit'), money('profit_after_vat', 'Profit (VAT out)'), { key: 'margin', label: 'Margin %', kind: 'qty' }, { key: 'made_of', label: 'Made of' }],
            rows: list,
          },
        ],
        note: 'Sold in the period uses the cost of the batches that went out. The price list uses the latest buying price. Items with no cost or recipe show more profit than they really make.',
      };
    }
    case 'summary': {
      const o = data as MoneyOverview;
      const pl = [
        { line: 'Gross revenue (bills and events)', amount: o.gross_revenue },
        { line: 'Less house (complimentary) bills', amount: o.house },
        { line: 'Less VAT', amount: o.vat },
        { line: 'Net revenue', amount: o.net_revenue },
        ...o.areas.map((a) => ({ line: `Cost of sales: ${a.label}`, amount: -a.cost })),
        { line: 'Gross profit', amount: o.gross_profit },
        ...o.expense_lines.map((e) => ({ line: e.label, amount: -e.amount })),
        { line: 'Net profit', amount: o.net_profit },
      ];
      const strong = pl.map((r, i) => (['Net revenue', 'Gross profit', 'Net profit'].includes(r.line) ? i : -1)).filter((i) => i >= 0);
      return {
        tiles: [
          tile('Net revenue', o.net_revenue, NAVY, `Gross ${o.gross_revenue.toLocaleString('en-KE')}`),
          tile('Gross profit', o.gross_profit, GREEN, o.gross_margin == null ? undefined : `${o.gross_margin}% margin`),
          tile('Net profit', o.net_profit, o.net_profit < 0 ? RED : GREEN, o.net_margin == null ? undefined : `${o.net_margin}% margin`),
          tile('Unpaid bills', o.unpaid_bills, ORANGE, 'Not in revenue until paid'),
        ],
        reports: [
          { title: 'Profit and loss', cols: [{ key: 'line', label: 'Line' }, money('amount', 'Amount')], rows: pl, strong },
          {
            title: 'By area',
            cols: [{ key: 'label', label: 'Area' }, money('sales', 'Sales'), money('net', 'Net of VAT'), money('cost', 'Cost of sales'), money('profit', 'Profit'), { key: 'margin', label: 'Margin %', kind: 'qty' }],
            rows: o.areas,
            total: { label: 'Total', ...sumOf(o.areas, ['sales', 'net', 'cost', 'profit']) },
          },
          ...(o.properties.length > 1
            ? [{
                title: 'By property',
                cols: [{ key: 'name', label: 'Property' }, money('gross_revenue', 'Gross'), money('net_revenue', 'Net revenue'), money('cost_of_sales', 'Cost of sales'), money('expenses', 'Expenses'), money('net_profit', 'Net profit')],
                rows: o.properties,
                total: { name: 'Total', ...sumOf(o.properties, ['gross_revenue', 'net_revenue', 'cost_of_sales', 'expenses', 'net_profit']) },
              }]
            : []),
        ],
        note: o.areas.some((a) => a.estimated) ? 'Part of the cost of sales is estimated from recipes (sold, but no stock went out in the system).' : undefined,
      };
    }

    case 'daybook': {
      const b = data as DayBook;
      const rows = b.rows.map((r) => ({ ...r, other_in: r.cheque + r.bank + r.other }));
      const keys = ['restaurant', 'bar', 'events', 'gross', 'house', 'vat', 'net', 'cash', 'mpesa', 'card', 'other_in', 'received', 'petty_expense', 'purchases', 'supplier_paid'];
      const t = b.totals;
      return {
        tiles: [
          tile('Gross sales', t.gross ?? 0, NAVY, `Net ${(t.net ?? 0).toLocaleString('en-KE')} after VAT and house`),
          tile('VAT in sales', t.vat ?? 0, GREY, `${b.vat_rate}% inside prices`),
          tile('Money received', t.received ?? 0, GREEN, `Cash ${(t.cash ?? 0).toLocaleString('en-KE')} · M-Pesa ${(t.mpesa ?? 0).toLocaleString('en-KE')} · Card ${(t.card ?? 0).toLocaleString('en-KE')}`),
          tile('Stock bought', t.purchases ?? 0, ORANGE, `Petty cash ${(t.petty_expense ?? 0).toLocaleString('en-KE')}`),
        ],
        reports: [{
          title: 'Day book',
          cols: [
            { key: 'date', label: 'Date', kind: 'date' }, { key: 'bills', label: 'Bills', kind: 'qty' },
            money('restaurant', 'Restaurant'), money('bar', 'Bar'), money('events', 'Events'), money('gross', 'Gross'), money('house', 'House'),
            money('vat', 'VAT'), money('net', 'Net'), money('cash', 'Cash'), money('mpesa', 'M-Pesa'), money('card', 'Card'), money('other_in', 'Other in'),
            money('received', 'Received'), money('petty_expense', 'Petty cash'), money('purchases', 'Stock bought'), money('supplier_paid', 'Paid suppliers'),
          ],
          rows,
          total: { date: 'Total', bills: t.bills, ...sumOf(rows, keys) },
        }],
        note: 'Sales count on the day of the bill or event; money counts on the day it was received, so the two differ when guests pay later or events pay deposits.',
      };
    }

    case 'debtors': {
      const x = data as Debtors;
      return {
        tiles: [
          tile('Owed to us', x.totals.all, NAVY, `${x.rows.length} open`),
          tile('Guests paying later', x.totals.pay_later, ORANGE),
          tile('Unpaid bills', x.totals.open_bills, RED, 'From earlier days'),
          tile('Event balances', x.totals.events, BLUE),
        ],
        reports: [
          {
            title: 'Who owes us',
            cols: [{ key: 'kind_label', label: 'Type' }, { key: 'who', label: 'Who' }, { key: 'ref', label: 'Ref' }, { key: 'property', label: 'Property' },
              { key: 'date', label: 'Date', kind: 'date' }, { key: 'due', label: 'Due', kind: 'date' }, { key: 'age', label: 'Days', kind: 'qty' },
              money('amount', 'Amount'), money('paid', 'Paid'), money('balance', 'Balance')],
            rows: x.rows.map((r) => ({ ...r, kind_label: KIND[r.kind] })),
            total: { kind_label: 'Total', ...sumOf(x.rows, ['amount', 'paid', 'balance']) },
          },
          { title: 'Aging', cols: [{ key: 'label', label: '' }, ...AGING], rows: [{ label: 'Balance', ...x.aging }] },
        ],
      };
    }

    case 'suppliers': {
      const s = data as Suppliers;
      const late = s.aging.d31_60 + s.aging.d61;
      return {
        tiles: [
          tile('We owe suppliers', s.totals.balance, NAVY, `${s.rows.filter((r) => r.balance > 0).length} suppliers`),
          tile('Delivered on account', s.totals.delivered, ORANGE),
          tile('Paid', s.totals.paid, GREEN, s.totals.credits ? `Credit notes ${s.totals.credits.toLocaleString('en-KE')}` : undefined),
          tile('Over 30 days', late, late > 0 ? RED : GREY),
        ],
        reports: [{
          title: 'Supplier balances',
          cols: [{ key: 'name', label: 'Supplier' }, { key: 'payment_terms', label: 'Terms' }, money('opening', 'Opening'), money('delivered', 'Delivered'),
            money('paid', 'Paid'), money('credits', 'Credits'), money('balance', 'Balance'), ...AGING, { key: 'oldest_unpaid', label: 'Oldest unpaid', kind: 'date' }],
          rows: s.rows.map((r) => ({ ...r, ...r.aging })),
          ids: s.rows.map((r) => r.id),
          total: { name: 'Total', ...sumOf(s.rows.map((r) => ({ ...r, ...r.aging })), ['opening', 'delivered', 'paid', 'credits', 'balance', 'd0_7', 'd8_30', 'd31_60', 'd61']) },
        }],
        note: 'Delivered = stock received with this supplier picked, not paid from petty cash. Record payments, credit notes and what was owed before the system started on the supplier.',
      };
    }

    case 'purchases': {
      const p = data as Purchases;
      return {
        tiles: [
          tile('Stock bought', p.totals.all, NAVY, `${p.rows.length} deliveries`),
          tile('On supplier account', p.totals.on_account, ORANGE),
          tile('From petty cash', p.totals.petty_cash, GREEN),
          tile('No supplier picked', p.totals.not_linked, p.totals.not_linked > 0 ? RED : GREY, 'Pick the supplier when receiving'),
        ],
        reports: [
          {
            title: 'Deliveries',
            cols: [{ key: 'date', label: 'Date', kind: 'date' }, { key: 'item', label: 'Item' }, { key: 'supplier', label: 'Supplier' }, { key: 'purchase_ref', label: 'Invoice / ref' },
              { key: 'property', label: 'Property' }, { key: 'store_label', label: 'Store' }, { key: 'qty', label: 'Qty', kind: 'qty' }, { key: 'unit', label: 'Unit' },
              money('amount', 'Amount'), { key: 'paid_label', label: 'Paid by' }],
            rows: p.rows.map((r) => ({ ...r, supplier: r.supplier ?? '', store_label: STORE[r.store] ?? r.store, paid_label: PAID_BY[r.paid_by] })),
            total: { date: 'Total', amount: p.totals.all },
          },
          { title: 'By supplier', cols: [{ key: 'supplier', label: 'Supplier' }, money('amount', 'Amount')], rows: p.by_supplier, total: { supplier: 'Total', amount: p.totals.all } },
        ],
      };
    }

    case 'expenses': {
      const e = data as Expenses;
      return {
        tiles: [
          tile('All expenses', e.totals.all, NAVY),
          tile('Petty cash', e.totals.petty_expense, ORANGE),
          tile('Stock lost or used', e.totals.stock_losses, RED, 'At buying price'),
          tile('Stock from petty cash', e.totals.petty_stock, GREY, 'Goes to stock, not expenses'),
        ],
        reports: [
          { title: 'Petty cash by category', cols: [{ key: 'label', label: 'Category' }, money('amount', 'Amount')], rows: e.by_category, total: { label: 'Total', amount: e.totals.petty_expense } },
          { title: 'Stock lost or used', cols: [{ key: 'label', label: 'Line' }, money('amount', 'Amount')], rows: e.stock_losses, total: { label: 'Total', amount: e.totals.stock_losses } },
          {
            title: 'Petty cash paid',
            cols: [{ key: 'date', label: 'Date', kind: 'date' }, { key: 'description', label: 'What for' }, { key: 'category', label: 'Category' }, { key: 'payee', label: 'Paid to' },
              { key: 'receipt_ref', label: 'Receipt' }, { key: 'paid_by', label: 'Paid by' }, { key: 'property', label: 'Property' }, money('amount', 'Amount')],
            rows: e.rows,
            total: { date: 'Total', amount: Math.round((e.totals.petty_expense + e.totals.petty_stock) * 100) / 100 },
          },
        ],
      };
    }

    case 'vat': {
      const v = data as Vat;
      const t = v.totals;
      return {
        tiles: [
          tile('Output VAT', t.output_vat ?? 0, NAVY, `${v.year}, ${v.vat_rate}%`),
          tile('From bills', t.bill_vat ?? 0, GREY),
          tile('From events', t.event_vat ?? 0, BLUE),
          { ...tile('eTIMS pending', t.etims_pending ?? 0, (t.etims_pending ?? 0) > 0 ? RED : GREY, `${t.etims_sent ?? 0} sent`), count: true },
        ],
        reports: [{
          title: `VAT ${v.year}`,
          cols: [{ key: 'label', label: 'Month' }, money('bill_sales', 'Bill sales'), money('house', 'House'), money('bill_sales_ex_vat', 'Bills ex VAT'), money('bill_vat', 'Bill VAT'),
            money('event_sales_ex_vat', 'Events ex VAT'), money('event_vat', 'Event VAT'), money('output_vat', 'Output VAT'), money('purchases', 'Stock bought'),
            { key: 'etims_sent', label: 'eTIMS sent', kind: 'qty' }, { key: 'etims_pending', label: 'eTIMS pending', kind: 'qty' }],
          rows: v.months,
          total: { label: 'Year', ...t },
        }],
        note: 'Input VAT is not tracked here: claim it from the supplier invoices. House bills carry no VAT.',
      };
    }

    case 'journal': {
      const j = data as Journal;
      return {
        tiles: [
          tile('Total debits', j.totals.debit, NAVY),
          tile('Total credits', j.totals.credit, NAVY),
          tile(j.totals.balanced ? 'Balanced' : 'Not balanced', Math.round((j.totals.debit - j.totals.credit) * 100) / 100, j.totals.balanced ? GREEN : RED, 'Difference'),
          { ...tile('Entries', j.entries.length, GREY), count: true },
        ],
        reports: [
          ...j.entries.map((e) => ({
            title: e.title,
            cols: [{ key: 'account', label: 'Account' }, money('debit', 'Debit'), money('credit', 'Credit')],
            rows: e.lines.map((l) => ({ ...l, debit: l.debit || null, credit: l.credit || null })),
            total: { account: e.note, debit: e.debit, credit: e.credit },
          })),
          {
            title: 'Trial balance (movements in the period)',
            cols: [{ key: 'account', label: 'Account' }, money('debit', 'Debit'), money('credit', 'Credit')],
            rows: j.trial.map((l) => ({ ...l, debit: l.debit || null, credit: l.credit || null })),
            total: { account: 'Total', debit: j.totals.debit, credit: j.totals.credit },
          },
        ],
      };
    }

    case 'stock': {
      const s = data as StockValue;
      const bar = s.rows.filter((r) => r.store === 'bar_store').reduce((a, r) => a + r.value, 0);
      const food = s.rows.filter((r) => r.store !== 'bar_store').reduce((a, r) => a + r.value, 0);
      return {
        tiles: [
          tile('Stock at cost', s.total, NAVY, `Close of ${dayjs(s.as_of).format('D MMM YYYY')}`),
          tile('Bar', bar, { color: '#862E9C', bg: '#F8F0FC' }),
          tile('Food store and kitchen', food, ORANGE),
          { ...tile('Items with no price', s.rows.reduce((a, r) => a + r.unpriced, 0), GREY), count: true },
        ],
        reports: [
          { title: 'By store', cols: [{ key: 'property', label: 'Property' }, { key: 'label', label: 'Store' }, { key: 'items', label: 'Items', kind: 'qty' }, money('value', 'Value')], rows: s.rows, total: { property: 'Total', value: s.total } },
          {
            title: 'Items',
            cols: [{ key: 'name', label: 'Item' }, { key: 'property', label: 'Property' }, { key: 'store', label: 'Store' }, { key: 'quantity', label: 'Qty', kind: 'qty' },
              { key: 'unit', label: 'Unit' }, money('buy_price', 'Buy price'), money('value', 'Value')],
            rows: s.items,
            total: { name: 'Total', value: s.total },
          },
        ],
      };
    }
  }
}

/** A supplier statement as a report */
export function statementReport(s: SupplierStatement): Report {
  const rows: Row[] = [];
  if (s.from) rows.push({ date: s.from, label: 'Brought forward', detail: '', ref: '', debit: null, credit: null, balance: s.brought_forward });
  for (const l of s.lines) rows.push({ ...l, debit: l.debit || null, credit: l.credit || null, label: l.status === 'voided' ? `${l.label} (voided)` : l.label });
  return {
    title: `${s.supplier.name}: statement`,
    cols: [{ key: 'date', label: 'Date', kind: 'date' }, { key: 'label', label: 'Entry' }, { key: 'ref', label: 'Ref' }, { key: 'detail', label: 'Detail' },
      money('debit', 'Paid / credit'), money('credit', 'Owed'), money('balance', 'Balance')],
    rows,
    ids: [...(s.from ? [''] : []), ...s.lines.map((l) => l.id)],
    total: { date: 'Balance', balance: s.balance },
  };
}

// ─── Formatting and CSV ──────────────────────────────────────────

export const fmtCell = (v: unknown, kind: ColKind = 'text') => {
  if (v == null || v === '') return '';
  if (kind === 'money') {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v);
  }
  if (kind === 'qty') return Number(v).toLocaleString('en-KE', { maximumFractionDigits: 3 });
  if (kind === 'date' && /^\d{4}-\d{2}-\d{2}/.test(String(v))) return dayjs(String(v).slice(0, 10)).format('D MMM YYYY');
  return String(v);
};

/** All of a view's tables in one CSV that opens in Excel */
export function downloadCsv(view: View, title: string, file: string) {
  const cell = (v: unknown) => {
    const t = v == null ? '' : String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const raw = (v: unknown, kind?: ColKind) => (kind === 'money' || kind === 'qty' ? (v == null || v === '' ? '' : Number(v)) : kind === 'date' ? fmtCell(v, 'date') : v);
  const lines: unknown[][] = [[title], []];
  for (const r of view.reports) {
    lines.push([r.title], r.cols.map((c) => c.label));
    for (const row of r.rows) lines.push(r.cols.map((c) => raw(row[c.key], c.kind)));
    if (r.total) lines.push(r.cols.map((c) => raw(r.total?.[c.key], c.kind)));
    lines.push([]);
  }
  const blob = new Blob(['﻿' + lines.map((l) => l.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
