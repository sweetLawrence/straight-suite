import { useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Group, Loader } from '@mantine/core';
import dayjs from 'dayjs';
import { Printer } from 'lucide-react';
import { useStockSheet } from '@/hooks/useStockSheet';
import { useProperties } from '@/hooks/useCore';
import { formatCurrency } from '@/lib/utils/format';

import { PrintLogo } from '@/components/PrintLogo';
import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/stock-sheet')({ component: StockSheetPrint });

const STORE_LABEL: Record<string, string> = { bar_store: 'Bar', food_store: 'Food store', kitchen: 'Kitchen', all: 'All stores' };
const q3 = (v: number) => (v ? v.toLocaleString('en-KE', { maximumFractionDigits: 3 }) : '0');
const m = (v: number | null) => (v == null ? '' : formatCurrency(v).replace('KES ', ''));

/** Landscape A4 stock sheet, the same as the one written by hand */
function StockSheetPrint() {
  const p = useMemo(() => Object.fromEntries(new URLSearchParams(window.location.search)), []);
  const q = useStockSheet({ from: p.from || undefined, to: p.to || undefined, store: p.store === 'all' ? undefined : p.store, property_id: p.property_id || undefined });
  const props = useProperties(1, 20);
  const d = q.data;

  useEffect(() => {
    if (d) {
      if (isEmbed) return;
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [d]);

  if (q.isLoading) return <Group justify="center" mt="xl"><Loader /></Group>;
  if (!d) return <div style={{ padding: 24 }}>Could not load the stock sheet</div>;

  const prop = (props.data?.data ?? []).find((x) => x.id === d.property_id);
  const name = prop?.name ?? '';
  const cell = { border: '1px solid #ADB5BD', padding: '3px 5px', fontSize: 11, textAlign: 'right' as const, whiteSpace: 'nowrap' as const };
  const head = { ...cell, background: '#E9ECEF', fontWeight: 700, textAlign: 'center' as const };

  return (
    <>
      <style>{'@page { size: A4 landscape; margin: 10mm; }'}</style>
      <Group justify="space-between" p="md" className="no-print" style={{ borderBottom: '1px solid #DEE2E6' }}>
        <span>Stock sheet</span>
        <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>Print again</Button>
      </Group>
      <div style={{ padding: 16, fontFamily: 'Arial, Helvetica, sans-serif', color: '#212529', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PrintLogo code={prop?.code} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1F3A5F' }}>{name.toUpperCase()} STOCK SHEET</div>
              <div style={{ fontSize: 12 }}>{STORE_LABEL[d.store] ?? d.store}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            {d.from === d.to ? dayjs(d.from).format('dddd D MMMM YYYY') : `${dayjs(d.from).format('D MMM YYYY')} to ${dayjs(d.to).format('D MMM YYYY')}`}
            <div>Printed {dayjs().format('D MMM YYYY HH:mm')}</div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Item', 'Unit', 'Opening', 'In', 'Sold', 'Used', 'Waste', 'Staff/house', 'Transfer', 'Correction', 'Closing', 'Buy', 'Sell', 'Keep each', 'Sold for', 'Profit'].map((h) => (
                <th key={h} style={head}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.items.map((i) => (
              <tr key={i.stock_item_id}>
                <td style={{ ...cell, textAlign: 'left' }}>{i.name}</td>
                <td style={{ ...cell, textAlign: 'left' }}>{i.unit ?? ''}</td>
                <td style={cell}>{q3(i.opening)}</td>
                <td style={cell}>{q3(i.received)}</td>
                <td style={cell}>{q3(i.sold)}</td>
                <td style={cell}>{q3(i.issued)}</td>
                <td style={cell}>{q3(i.waste)}</td>
                <td style={cell}>{q3(i.staff_house)}</td>
                <td style={cell}>{q3(i.transferred)}</td>
                <td style={cell}>{q3(i.corrected)}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{q3(i.closing)}</td>
                <td style={cell}>{m(i.buy_price)}</td>
                <td style={cell}>{m(i.sell_price)}</td>
                <td style={cell}>{m(i.profit_each)}</td>
                <td style={cell}>{m(i.sold_value)}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{m(i.profit)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 800 }} colSpan={14}>TOTAL</td>
              <td style={{ ...cell, fontWeight: 800 }}>{m(d.totals.sold_value)}</td>
              <td style={{ ...cell, fontWeight: 800 }}>{m(d.totals.profit)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 48, marginTop: 28, fontSize: 12 }}>
          <div>Prepared by: ______________________</div>
          <div>Checked by: ______________________</div>
          <div>Stock value at close: KES {m(d.totals.closing_value)}</div>
        </div>
      </div>
    </>
  );
}
