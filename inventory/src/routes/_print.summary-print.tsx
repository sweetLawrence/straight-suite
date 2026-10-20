import { useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Group, Loader } from '@mantine/core';
import dayjs from 'dayjs';
import { Printer } from 'lucide-react';
import { useDaily, useStore, useValue } from '@/hooks/useDaySummary';
import { formatCurrency } from '@/lib/utils/format';
import type { FootRow, SummaryRecord } from '@/lib/api/daySummary';

import { PrintLogo } from '@/components/PrintLogo';
import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/summary-print')({ component: DaySummaryPrint });

const m = (v: number | null | undefined) => (v == null ? '' : formatCurrency(v).replace('KES ', ''));
const cell = { border: '1px solid #495057', padding: '4px 6px', fontSize: 12, textAlign: 'right' as const };
const left = { ...cell, textAlign: 'left' as const };
const head = { ...cell, background: '#DCE9F5', fontWeight: 700, textAlign: 'center' as const };
const sig = (s: { name: string; at: string } | null | undefined) => (s ? `${s.name} ${dayjs(s.at).format('D/M HH:mm')}` : '');

function Foot({ rows }: { rows: FootRow[] }) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '60%', marginTop: 14 }}>
      <thead><tr>{['Personnel', 'Department', 'B/F', 'Shortage', 'C/F'].map((h) => <th key={h} style={head}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}><td style={left}>{p.name}</td><td style={left}>{p.department}</td><td style={cell}>{m(p.brought_forward)}</td><td style={cell}>{m(p.shortage)}</td><td style={cell}>{m(p.carried_forward)}</td></tr>
        ))}
        {rows.length === 0 && <tr><td style={left} colSpan={5}>No shortages</td></tr>}
      </tbody>
    </table>
  );
}
function Sigs({ rec }: { rec: SummaryRecord }) {
  return (
    <div style={{ marginTop: 18, fontSize: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div>Prepared by: <b>{rec.prepared_by || ''}</b></div>
      <div>Cashier: <b>{sig(rec.cashier_sign)}</b></div>
      <div>Closed by: <b>{sig(rec.closed_sign)}</b></div>
      <div>Acknowledged: <b>{sig(rec.ack_sign)}</b></div>
    </div>
  );
}

/** A4 paper versions of the three layouts */
function DaySummaryPrint() {
  const p = useMemo(() => Object.fromEntries(new URLSearchParams(window.location.search)), []);
  const args = { date: p.date || undefined, property_id: p.property_id || undefined };
  const layout = p.layout || 'daily';
  const daily = useDaily(args, layout === 'daily');
  const value = useValue(args, layout === 'value');
  const store = useStore(args, layout === 'store');
  const ready = layout === 'daily' ? daily.data : layout === 'value' ? value.data : store.data;

  useEffect(() => {
    if (ready) {
      if (isEmbed) return;
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!ready) return <Group justify="center" mt="xl"><Loader /></Group>;
  const title = (name?: string, what = 'DAILY SUMMARY') => `${(name || '').toUpperCase()} ${what}`;

  return (
    <>
      <style>{`@page { size: A4 ${layout === 'store' ? 'landscape' : 'portrait'}; margin: 10mm; }`}</style>
      <Group justify="space-between" p="md" className="no-print" style={{ borderBottom: '1px solid #DEE2E6' }}>
        <span>Daily summary</span>
        <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>Print again</Button>
      </Group>
      <div style={{ padding: 16, fontFamily: 'Arial, Helvetica, sans-serif', color: '#212529', background: '#FFFFFF' }}>
        {layout === 'daily' && daily.data && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <PrintLogo code={daily.data.property?.code} />
              <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>{title(daily.data.property?.name)}</div>
            <div style={{ textAlign: 'center', fontSize: 13 }}>FOR {dayjs(daily.data.date).format('DD / MM / YYYY')}</div>
              </div>
              <div style={{ width: 54 }} />
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr>{['Account', 'Person in charge', 'Shs expected', 'Shs declared', 'Shs M-Pesa', 'Shs cash', 'Card / other', 'Signed bill', 'Sign'].map((h) => <th key={h} style={head}>{h}</th>)}</tr></thead>
              <tbody>
                {daily.data.rows.map((r) => (
                  <tr key={r.key}>
                    <td style={left}>{r.account}</td><td style={left}>{r.person.name}</td><td style={cell}>{m(r.expected)}</td><td style={cell}>{m(r.declared)}</td>
                    <td style={cell}>{m(r.mpesa)}</td><td style={cell}>{m(r.cash)}</td><td style={cell}>{m(r.card)}</td><td style={cell}>{m(r.signed)}</td>
                    <td style={{ ...left, fontSize: 10 }}>{sig(daily.data.record.signs[r.person.id])}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td style={left} colSpan={2}>TOTAL AMOUNTS</td><td style={cell}>{m(daily.data.totals.expected)}</td><td style={cell}>{m(daily.data.totals.declared)}</td>
                  <td style={cell}>{m(daily.data.totals.mpesa)}</td><td style={cell}>{m(daily.data.totals.cash)}</td><td style={cell}>{m(daily.data.totals.card)}</td><td style={cell}>{m(daily.data.totals.signed)}</td><td style={cell} />
                </tr>
              </tbody>
            </table>
            {daily.data.cashier && (
              <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 12 }}>
                <table style={{ borderCollapse: 'collapse', flex: 1 }}>
                  <tbody>
                    <tr><th style={left} colSpan={2}>CASHIER</th></tr>
                    {([['Cash brought forward', daily.data.cashier.brought_forward], ['Cash collection for the day', daily.data.cashier.collection], ['Total', daily.data.cashier.total], ['Expenses', daily.data.cashier.expenses], ['Cash transferred to MD', daily.data.cashier.to_md], ['Cash carried forward', daily.data.cashier.carried_forward]] as [string, number][]).map(([l, v]) => (
                      <tr key={l}><td style={left}>{l}</td><td style={cell}>{m(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <table style={{ borderCollapse: 'collapse', flex: 1, alignSelf: 'flex-start' }}>
                  <tbody>
                    {([['Total paybill amount', daily.data.paybill], ['Signed bills', daily.data.signed_bills], ['Unsigned bills', daily.data.unsigned_bills], ['Bar stock value', daily.data.stock?.bar_value ?? 0], ['Store stock value', daily.data.stock?.store_value ?? 0]] as [string, number][]).map(([l, v]) => (
                      <tr key={l}><td style={left}>{l}</td><td style={cell}>{m(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {daily.data.record.note && <div style={{ marginTop: 10, fontSize: 12 }}><b>NB:</b> {daily.data.record.note}</div>}
            <Foot rows={daily.data.footnote} />
            <Sigs rec={daily.data.record} />
            <div style={{ marginTop: 14, fontSize: 10, color: '#495057' }}>This form must be completed daily and signed by all accounts and forwarded to the HQ Accountant.</div>
          </>
        )}

        {layout === 'value' && value.data && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <PrintLogo code={value.data.property?.code} />
              <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>{title(value.data.property?.name, 'SUMMARY')}</div>
            <div style={{ textAlign: 'center', fontSize: 13 }}>{dayjs(value.data.date).format('DD/MM/YYYY')}</div>
              </div>
              <div style={{ width: 54 }} />
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr>{['', 'Opening', 'Addition', 'Total', 'Closing', 'Sales'].map((h) => <th key={h} style={head}>{h}</th>)}</tr></thead>
              <tbody>
                {value.data.lines.map((l) => (
                  <tr key={l.label}><td style={left}>{l.label}</td><td style={cell}>{m(l.opening)}</td><td style={cell}>{m(l.addition)}</td><td style={cell}>{m(l.total)}</td><td style={cell}>{m(l.closing)}</td><td style={cell}>{m(l.sales)}</td></tr>
                ))}
                <tr style={{ fontWeight: 700 }}><td style={left} colSpan={5}>TOTAL</td><td style={cell}>{m(value.data.total_sales)}</td></tr>
                <tr><td style={{ ...left, fontWeight: 700 }} colSpan={6}>APPROVED CASH DISTRIBUTION</td></tr>
                {value.data.distribution.map((x) => <tr key={x.label}><td style={left} colSpan={5}>{x.label}</td><td style={cell}>{m(x.amount)}</td></tr>)}
                <tr style={{ fontWeight: 700 }}><td style={left} colSpan={5}>TOTAL</td><td style={cell}>{m(value.data.distribution_total)}</td></tr>
                <tr><td style={{ ...left, fontWeight: 700 }} colSpan={6}>PRODUCTION AND EXPENSES</td></tr>
                {value.data.expenses.map((x) => <tr key={x.label}><td style={left} colSpan={5}>{x.label}</td><td style={cell}>{m(x.amount)}</td></tr>)}
                <tr style={{ fontWeight: 700 }}><td style={left} colSpan={5}>TOTAL</td><td style={cell}>{m(value.data.expenses_total)}</td></tr>
                <tr style={{ fontWeight: 700 }}><td style={left} colSpan={5}>AMOUNT EXPECTED FROM CASHIER</td><td style={cell}>{m(value.data.expected_from_cashier)}</td></tr>
                {value.data.shortages.map((s) => <tr key={s.name}><td style={left} colSpan={5}>{s.name} shortage</td><td style={cell}>{m(s.amount)}</td></tr>)}
                <tr style={{ fontWeight: 700 }}><td style={left} colSpan={5}>AMOUNT AVAILED BY CASHIER</td><td style={cell}>{m(value.data.availed_by_cashier)}</td></tr>
                <tr><td style={left} colSpan={5}>Cash in hand per the system</td><td style={cell}>{m(value.data.cash_in_hand_per_system)}</td></tr>
                <tr><td style={left} colSpan={5}>Difference</td><td style={cell}>{m(value.data.difference)}</td></tr>
              </tbody>
            </table>
            <Foot rows={value.data.footnote} />
            <Sigs rec={value.data.record} />
          </>
        )}

        {layout === 'store' && store.data && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <PrintLogo code={store.data.property?.code} />
              <div style={{ flex: 1 }}>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>{title(store.data.property?.name, 'KITCHEN STORE')}</div>
            <div style={{ textAlign: 'center', fontSize: 13 }}>{dayjs(store.data.date).format('DD/MM/YYYY')}</div>
              </div>
              <div style={{ width: 54 }} />
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr>{['#', 'Particulars', 'Opening', 'Addition', 'Total', 'Closing', 'Sale', 'P/U', 'Opening', 'Add', 'Total', 'Closing', 'Sales'].map((h, i) => <th key={h + i} style={head}>{h}</th>)}</tr></thead>
              <tbody>
                {store.data.items.map((i, k) => (
                  <tr key={i.name + k}>
                    <td style={cell}>{k + 1}</td><td style={left}>{i.name}</td><td style={cell}>{i.opening}</td><td style={cell}>{i.received}</td><td style={cell}>{i.total}</td><td style={cell}>{i.closing}</td><td style={cell}>{i.used}</td>
                    <td style={cell}>{m(i.price)}</td><td style={cell}>{m(i.v_opening)}</td><td style={cell}>{m(i.v_received)}</td><td style={cell}>{m(i.v_total)}</td><td style={cell}>{m(i.v_closing)}</td><td style={cell}>{m(i.v_used)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td style={left} colSpan={8}>TOTAL</td><td style={cell}>{m(store.data.totals.opening)}</td><td style={cell}>{m(store.data.totals.received)}</td><td style={cell}>{m(store.data.totals.total)}</td><td style={cell}>{m(store.data.totals.closing)}</td><td style={cell}>{m(store.data.totals.used)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
