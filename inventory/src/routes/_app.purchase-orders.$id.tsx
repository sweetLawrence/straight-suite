import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Button, Card, Checkbox, Group, Modal, NumberInput, SimpleGrid, Stack, Text, Textarea, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { ArrowLeft, PackageCheck, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { PriceHistoryDrawer } from '@/components/purchasing/PriceHistoryDrawer';
import { PO_STATUS } from '@/components/purchasing/poStatus';
import { useCancelPO, usePO, useReceivePO } from '@/hooks/usePurchasing';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/purchase-orders/$id')({ component: POPage });

const q3 = (v: number) => v.toLocaleString('en-KE', { maximumFractionDigits: 3 });

function POPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const q = usePO(id);
  const receive = useReceivePO(id);
  const cancel = useCancelPO(id);
  const [receiving, setReceiving] = useState(false);
  const [rx, setRx] = useState<Record<string, { quantity: number; unit_price: number }>>({});
  const [close, setClose] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<string | null>(null);

  if (q.isLoading) return <LoadingState />;
  if (q.error || !q.data) return <EmptyState title="Order not found" />;
  const po = q.data;
  const lines = po.lines ?? [];
  const open = ['ordered', 'partially_received'].includes(po.status);
  const canReceive = open && auth.hasPermission('stock.receive');

  const startReceive = () => {
    setRx(Object.fromEntries(lines.map((l) => [l.id, { quantity: l.outstanding, unit_price: l.unit_price }])));
    setClose(false);
    setReceiving(true);
  };
  const doReceive = async () => {
    try {
      const r = await receive.mutateAsync({
        close,
        lines: lines.filter((l) => (rx[l.id]?.quantity || 0) > 0).map((l) => ({ line_id: l.id, quantity: rx[l.id].quantity, unit_price: rx[l.id].unit_price })),
      });
      notifications.show({ color: 'green', title: 'Received into stock', message: r.batches.join(', ') });
      setReceiving(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not receive', message: getErrorMessage(err) });
    }
  };
  const rxTotal = lines.reduce((a, l) => a + (rx[l.id]?.quantity || 0) * (rx[l.id]?.unit_price || 0), 0);

  return (
    <>
      <Button component={Link} to="/purchase-orders" variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">Purchase orders</Button>
      <PageHeader title={po.supplier?.name || 'Purchase order'} subtitle={`${po.po_ref}${po.property ? ` · ${po.property.code}` : ''} · ${po.created_by?.full_name ?? ''} · ${dayjs(po.created_at).format('D MMM YYYY')}`} />
      <Group gap={6} mb="md" mt={-6}>
        <StatusDot color={PO_STATUS[po.status].color} />
        <Text size="sm" fw={600} style={{ color: PO_STATUS[po.status].color }}>{PO_STATUS[po.status].label}</Text>
        {po.expected_date && <Text size="sm" c="dimmed">· due {dayjs(po.expected_date).format('D MMM')}</Text>}
      </Group>

      <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
        {lines.map((l) => (
          <UnstyledButton key={l.id} onClick={() => setHistory(l.stock_item_id)} w="100%">
            <Group justify="space-between" wrap="nowrap" gap="sm" px="md" py="sm" style={{ borderBottom: '1px solid #F1F3F5' }}>
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} lineClamp={2}>{l.name}</Text>
                <Text size="xs" c="dimmed">
                  {q3(l.quantity)} {l.unit || ''} × {formatCurrency(l.unit_price)}
                  {l.received_qty > 0 ? ` · ${q3(l.received_qty)} received` : ''}
                </Text>
              </Box>
              <Text fw={700} style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>{formatCurrency(l.line_total)}</Text>
            </Group>
          </UnstyledButton>
        ))}
        <Group justify="space-between" px="md" py="sm" style={{ background: '#E7F5FF' }}>
          <Text fw={700} style={{ color: '#1864AB' }}>Total</Text>
          <Text fw={800} fz={20} style={{ color: '#1864AB' }}>{formatCurrency(po.total)}</Text>
        </Group>
      </Card>
      <Text size="xs" c="dimmed" mb="md">Tap an item to see what it cost before.</Text>
      {po.notes && <Text size="sm" mb="md">"{po.notes}"</Text>}

      {open && (
        <Group gap="sm" wrap="nowrap">
          {canReceive && <Button style={{ flex: 1 }} leftSection={<PackageCheck size={16} />} onClick={startReceive}>Receive delivery</Button>}
          {po.status === 'ordered' && auth.hasPermission('purchase.manage') && (
            <Button variant="light" color="red" leftSection={<X size={16} />} onClick={() => setCancelling(true)}>Cancel</Button>
          )}
        </Group>
      )}

      <Modal opened={receiving} onClose={() => setReceiving(false)} title="Receive delivery" size="lg">
        <Stack>
          <Text size="sm" c="dimmed">Enter what actually arrived. Change the price if the invoice differs.</Text>
          {lines.filter((l) => l.outstanding > 0).map((l) => (
            <Card key={l.id} withBorder radius="md" p="sm">
              <Text size="sm" fw={600} mb={6}>{l.name} <Text span size="xs" c="dimmed">({q3(l.outstanding)} {l.unit || ''} to come)</Text></Text>
              <SimpleGrid cols={2} spacing="xs">
                <NumberInput label="Arrived" min={0} decimalScale={3} value={rx[l.id]?.quantity ?? 0}
                  onChange={(v) => setRx((s) => ({ ...s, [l.id]: { ...s[l.id], quantity: Number(v) || 0 } }))} />
                <NumberInput label="Price per unit" min={0} decimalScale={2} thousandSeparator="," value={rx[l.id]?.unit_price ?? 0}
                  onChange={(v) => setRx((s) => ({ ...s, [l.id]: { ...s[l.id], unit_price: Number(v) || 0 } }))} />
              </SimpleGrid>
            </Card>
          ))}
          <Checkbox checked={close} onChange={(e) => setClose(e.currentTarget.checked)} label="Nothing more is coming, close this order" />
          <Group justify="space-between">
            <Text fw={700}>{formatCurrency(rxTotal)}</Text>
            <Button loading={receive.isPending} disabled={rxTotal <= 0 && !lines.some((l) => (rx[l.id]?.quantity || 0) > 0)} onClick={doReceive}>Receive into stock</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={cancelling} onClose={() => setCancelling(false)} title={`Cancel ${po.po_ref}`}>
        <Stack>
          <Textarea label="Reason" required autosize minRows={2} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button color="red" disabled={reason.trim().length < 3} loading={cancel.isPending}
              onClick={async () => { try { await cancel.mutateAsync(reason.trim()); setCancelling(false); } catch (err) { notifications.show({ color: 'red', title: 'Could not cancel', message: getErrorMessage(err) }); } }}>
              Cancel order
            </Button>
          </Group>
        </Stack>
      </Modal>
      <PriceHistoryDrawer stockItemId={history} onClose={() => setHistory(null)} />
    </>
  );
}
