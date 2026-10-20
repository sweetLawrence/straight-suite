import type { StockSheet } from '@/lib/api/stockSheet';

const STORE: Record<string, string> = { bar_store: 'Bar', food_store: 'Food store', kitchen: 'Kitchen' };

/** Download the stock sheet as a CSV that opens in Excel */
export function downloadStockSheet(s: StockSheet, propertyName = '') {
  const head = ['Item', 'Store', 'Unit', 'Opening', 'Received', 'Sold', 'Issued/used', 'Waste', 'Staff/house', 'Transferred', 'Count corrections',
    'Closing', 'Buying price', 'Selling price', 'Profit per unit', 'Margin %', 'Sold value', 'Cost of sold', 'Profit', 'Closing value'];
  const cell = (v: unknown) => {
    if (v == null) return '';
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const rows = s.items.map((i) => [i.name, STORE[i.store] ?? i.store, i.unit ?? '', i.opening, i.received, i.sold, i.issued, i.waste, i.staff_house,
    i.transferred, i.corrected, i.closing, i.buy_price, i.sell_price, i.profit_each, i.margin, i.sold_value, i.sold_cost, i.profit, i.closing_value]);
  const total = ['TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', s.totals.sold_value, s.totals.sold_cost, s.totals.profit, s.totals.closing_value];
  const title = [`Stock sheet ${propertyName} ${s.from === s.to ? s.from : `${s.from} to ${s.to}`} ${s.store === 'all' ? 'All stores' : STORE[s.store] ?? ''}`];
  const csv = [title, [], head, ...rows, total].map((r) => r.map(cell).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `stock-sheet-${s.from}${s.from === s.to ? '' : `-to-${s.to}`}-${s.store}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
