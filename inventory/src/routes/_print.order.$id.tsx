import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Button, Group, Loader } from '@mantine/core';
import { Printer } from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/order/$id')({
  component: OrderPrintPage,
});

/** Order ticket for the thermal printer: what was ordered, for which table, by whom. */
function OrderPrintPage() {
  const { id } = Route.useParams();
  const query = useOrder(id);

  useEffect(() => {
    if (query.data) {
      if (isEmbed) return;
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [query.data]);

  if (query.isLoading) return <Group justify="center" mt="xl"><Loader /></Group>;
  if (query.error || !query.data) return <div>Order not found</div>;

  const o = query.data;
  const lines = (o.order_lines ?? []).filter((l) => l.status !== 'cancelled');
  const total = lines.reduce((a, l) => a + Number(l.line_total || 0), 0);

  return (
    <>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #eaeaea' }} className="no-print">
        <span>Order {o.order_ref}</span>
        <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>Print again</Button>
      </Group>
      <div className="bill">
        <div className="bill-header">
          <div className="bill-property-name">{(o.property?.name || '').toUpperCase()}</div>
          <div className="bill-doc-title">ORDER</div>
          <div className="bill-ref">{o.order_ref}</div>
        </div>
        <div className="bill-meta">
          <div className="bill-meta-row"><span className="bill-meta-label">Table:</span><span className="bill-meta-value">{o.table_number || '-'}</span></div>
          <div className="bill-meta-row"><span className="bill-meta-label">Customer:</span><span className="bill-meta-value">{o.customer_code}</span></div>
          <div className="bill-meta-row"><span className="bill-meta-label">Waiter:</span><span className="bill-meta-value">{o.waiter?.full_name || ''}</span></div>
          <div className="bill-meta-row"><span className="bill-meta-label">Time:</span><span className="bill-meta-value">{formatDateTime(o.created_at)}</span></div>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        {lines.map((l) => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
            <span>{Number(l.quantity)} x {l.menu_item?.display_name || 'Item'}{l.notes ? ` (${l.notes})` : ''}</span>
            <span>{formatCurrency(Number(l.line_total || 0))}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
      </div>
    </>
  );
}
