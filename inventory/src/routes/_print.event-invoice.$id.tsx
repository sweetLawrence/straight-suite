import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Button, Group, Loader } from '@mantine/core';
import { PrintLogo } from '@/components/PrintLogo';
import { Printer } from 'lucide-react';
import { useEvent } from '@/hooks/useEvents';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';
import { EtimsStamp } from '@/components/finance/EtimsStamp';
import { useEtimsFor } from '@/hooks/useFinance';

import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/event-invoice/$id')({
  component: EventInvoicePage,
});

const ink = '#212529';
const navy = '#1F3A5F';
const muted = '#6C757D';
const line = '#DEE2E6';

const cell: CSSProperties = { padding: '8px 6px', borderBottom: `1px solid ${line}` };
const right: CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };

/** A4 invoice (or quote, before the event is booked) for a function */
function EventInvoicePage() {
  const { id } = Route.useParams();
  const query = useEvent(id);

  // Wait for the eTIMS details so they are on the printout
  const etims = useEtimsFor('event', id);

  useEffect(() => {
    if (query.data && !etims.isLoading) {
      if (isEmbed) return;
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [query.data, etims.isLoading]);

  if (query.isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }
  if (query.error || !query.data) return <div style={{ padding: 24 }}>Event not found</div>;

  const e = query.data;
  const isInvoice = !!e.invoice_ref && e.status !== 'quote';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const p = e.property;

  const totalRow = (label: string, value: string, strong = false) => (
    <tr>
      <td style={{ padding: '5px 6px', color: strong ? navy : muted, fontWeight: strong ? 700 : 400 }}>{label}</td>
      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: strong ? 800 : 500, color: strong ? navy : ink, fontSize: strong ? 16 : 14 }}>{value}</td>
    </tr>
  );

  return (
    <>
      <Group justify="space-between" p="md" style={{ borderBottom: `1px solid ${line}` }} className="no-print">
        <span>{docTitle} {e.invoice_ref || e.event_ref}</span>
        <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>Print again</Button>
      </Group>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 24px', color: ink, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 14, background: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: `3px solid ${navy}`, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <PrintLogo code={p?.code} height={60} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: navy }}>{(p?.name || 'Straight Group').toUpperCase()}</div>
              {p?.address && <div style={{ color: muted }}>{p.address}</div>}
              {p?.phone && <div style={{ color: muted }}>Tel: {p.phone}</div>}
              {p?.kra_pin && <div style={{ color: muted }}>PIN: {p.kra_pin}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: navy }}>{docTitle}</div>
            <div style={{ fontWeight: 700 }}>{e.invoice_ref || e.event_ref}</div>
            {e.invoice_ref && <div style={{ color: muted }}>Booking {e.event_ref}</div>}
            <div style={{ color: muted }}>Date {formatDate(e.confirmed_at || e.created_at)}</div>
          </div>
        </div>

        {/* Client and event */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 18 }}>
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>BILL TO</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{e.client.name}</div>
            {e.client.phone && <div>{e.client.phone}</div>}
            {e.client.email && <div>{e.client.email}</div>}
            {e.client.kra_pin && <div>KRA PIN: {e.client.kra_pin}</div>}
          </div>
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>EVENT</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{e.title}</div>
            <div style={{ textTransform: 'capitalize' }}>{e.event_type}</div>
            <div>{formatDateTime(e.start_at)}{e.end_at ? ` to ${formatDateTime(e.end_at)}` : ''}</div>
            {e.venue && <div>Venue: {e.venue}</div>}
            <div>Guests: {e.guests.toLocaleString()}</div>
          </div>
        </div>

        {/* Lines */}
        <div style={{ overflowX: 'auto', marginTop: 22 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F1F3F5' }}>
              <th style={{ ...cell, textAlign: 'left' }}>DESCRIPTION</th>
              <th style={{ ...right }}>QTY</th>
              <th style={{ ...right }}>PRICE</th>
              <th style={{ ...right }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>Event package per person</td>
              <td style={right}>{e.guests.toLocaleString()}</td>
              <td style={right}>{formatCurrency(e.price_per_person)}</td>
              <td style={{ ...right, fontWeight: 600 }}>{formatCurrency(e.guests * e.price_per_person)}</td>
            </tr>
            {e.goat_plan !== 'none' && e.goat_total > 0 && (
              <tr>
                <td style={cell}>{e.goat_plan === 'own' ? 'Own goat fee (use of premises)' : 'Goat, supplied and cooked'}</td>
                <td style={right}>{e.goat_count}</td>
                <td style={right}>{formatCurrency(e.goat_fee)}</td>
                <td style={{ ...right, fontWeight: 600 }}>{formatCurrency(e.goat_total)}</td>
              </tr>
            )}
            {e.extras.map((x) => (
              <tr key={x.id}>
                <td style={cell}>{x.description}</td>
                <td style={right}>{x.quantity}</td>
                <td style={right}>{formatCurrency(x.unit_price)}</td>
                <td style={{ ...right, fontWeight: 600 }}>{formatCurrency(x.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <table style={{ minWidth: 280, borderCollapse: 'collapse' }}>
            <tbody>
              {totalRow('Subtotal', formatCurrency(e.subtotal))}
              {e.vat_enabled && totalRow(`VAT ${e.vat_rate}%`, formatCurrency(e.vat_amount))}
              {totalRow('TOTAL', formatCurrency(e.total), true)}
              {e.paid > 0 && totalRow('Paid', formatCurrency(e.paid))}
              {e.paid > 0 && totalRow('BALANCE DUE', formatCurrency(e.balance), true)}
            </tbody>
          </table>
        </div>

        {/* Menu */}
        {e.menu.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>MENU</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {e.menu.map((m) => <li key={m.id} style={{ marginBottom: 2 }}>{m.description}</li>)}
            </ul>
          </div>
        )}

        {/* Payments */}
        {e.payments.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>PAYMENTS RECEIVED</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
              <tbody>
                {e.payments.map((pm) => (
                  <tr key={pm.id}>
                    <td style={cell}>{formatDate(pm.paid_at)}</td>
                    <td style={{ ...cell, textTransform: 'uppercase' }}>{pm.method}{pm.reference ? ` · ${pm.reference}` : ''}</td>
                    <td style={right}>{formatCurrency(pm.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isInvoice && <EtimsStamp type="event" id={e.id} />}

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 12, borderTop: `1px solid ${line}`, color: muted, fontSize: 12 }}>
          {isInvoice
            ? 'A deposit secures the date. The balance is due before the event.'
            : 'This is a quotation. Prices hold once the booking is confirmed and an invoice is issued.'}
          {e.status === 'cancelled' && <div style={{ color: '#E03131', fontWeight: 700, marginTop: 6 }}>CANCELLED{e.cancel_reason ? `: ${e.cancel_reason}` : ''}</div>}
        </div>
      </div>
    </>
  );
}
