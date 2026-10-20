import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Box, Button, Checkbox, Group, Loader, Paper, Select, Stack, Text } from '@mantine/core';
import { History, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { CreatePOModal, type DraftLine } from '@/components/purchasing/CreatePOModal';
import { PriceHistoryDrawer } from '@/components/purchasing/PriceHistoryDrawer';
import { useReorder } from '@/hooks/usePurchasing';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/reorder')({ component: ReorderPage });

const q3 = (v: number) => v.toLocaleString('en-KE', { maximumFractionDigits: 3 });

function ReorderPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canOrder = auth.hasPermission('purchase.manage') && !auth.hasRole('md', 'admin');
  const [store, setStore] = useState<string | null>(null);
  const q = useReorder({ store_type: store || undefined });
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<{ supplier_id?: string | null; lines: DraftLine[] } | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  const rows = useMemo(() => q.data ?? [], [q.data]);

  const order = () => {
    const chosen = rows.filter((r) => picked.has(r.stock_item_id));
    const suppliers = [...new Set(chosen.map((r) => r.supplier?.id).filter(Boolean))];
    setDraft({
      supplier_id: suppliers.length === 1 ? (suppliers[0] as string) : null,
      lines: chosen.map((r) => ({ stock_item_id: r.stock_item_id, quantity: r.suggested_qty || r.reorder_level, unit_price: r.last_unit_cost || 0 })),
    });
  };

  return (
    <>
      <PageHeader title="Reorder list" subtitle="Stock at or below its reorder level, with what was last paid" />
      <Group mb="md" gap="sm" align="flex-end">
        <Select placeholder="All stores" clearable value={store} onChange={setStore} w={180}
          data={[{ value: 'bar_store', label: 'Bar' }, { value: 'food_store', label: 'Food store' }, { value: 'kitchen', label: 'Kitchen' }]} />
        {q.isFetching && <Loader size="xs" />}
      </Group>
      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error ? (
        <EmptyState title="Couldn't load" description={getErrorMessage(q.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing to reorder" description="Every item with a reorder level is above it." />
      ) : (
        <Stack gap="xs" pb={canOrder && picked.size ? 90 : 0}>
          {rows.map((r) => (
            <Paper key={r.stock_item_id} withBorder radius="md" p="sm">
              <Group wrap="nowrap" align="flex-start" gap="sm">
                {canOrder && (
                  <Checkbox mt={2} checked={picked.has(r.stock_item_id)}
                    onChange={(e) => { const on = e.currentTarget.checked; setPicked((s) => { const n = new Set(s); if (on) n.add(r.stock_item_id); else n.delete(r.stock_item_id); return n; }); }} />
                )}
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Group gap={6} wrap="nowrap">
                    <StatusDot color={r.status === 'out' ? '#E03131' : '#F08C00'} />
                    <Text size="sm" fw={700} lineClamp={1}>{r.name}</Text>
                    {groupLevel && <Badge size="xs" variant="outline" color="gray">{r.property}</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {q3(r.balance)} left · reorder at {q3(r.reorder_level)} {r.unit || ''}
                    {r.on_order > 0 ? ` · ${q3(r.on_order)} on order` : ''}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.supplier ? r.supplier.name : 'No supplier yet'}
                    {r.last_unit_cost != null ? ` · last ${formatCurrency(r.last_unit_cost)}` : ''}
                  </Text>
                </Box>
                <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
                  <Text size="sm" fw={700} style={{ color: '#1F3A5F' }}>Order {q3(r.suggested_qty)}</Text>
                  <Button variant="subtle" size="compact-xs" leftSection={<History size={12} />} onClick={() => setHistory(r.stock_item_id)}>Prices</Button>
                </Stack>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
      {canOrder && picked.size > 0 && (
        <Paper shadow="lg" radius={0} p="sm" style={{ position: 'fixed', left: 0, right: 0, bottom: 'var(--bottom-nav-height, 0px)', zIndex: 100, borderTop: '1px solid #E9ECEF' }}>
          <Button fullWidth maw={600} mx="auto" display="block" leftSection={<ShoppingCart size={16} />} onClick={order}>Order {picked.size} item{picked.size === 1 ? '' : 's'}</Button>
        </Paper>
      )}
      <CreatePOModal opened={!!draft} onClose={() => { setDraft(null); setPicked(new Set()); }} initial={draft ?? undefined} />
      <PriceHistoryDrawer stockItemId={history} onClose={() => setHistory(null)} />
    </>
  );
}
