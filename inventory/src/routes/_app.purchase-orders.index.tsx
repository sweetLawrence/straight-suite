import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Group, Loader, Pagination, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { DayGroupedList } from '@/components/DayGroupedList';
import { CreatePOModal } from '@/components/purchasing/CreatePOModal';
import { PO_STATUS } from '@/components/purchasing/poStatus';
import { usePOs } from '@/hooks/usePurchasing';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/purchase-orders/')({ component: POListPage });

type Show = 'open' | 'all';

function POListPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [show, setShow] = useState<Show>('open');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const q = usePOs({ page, limit: 30 });
  const rows = (q.data?.data ?? []).filter((p) => show === 'all' || ['ordered', 'partially_received'].includes(p.status));
  return (
    <>
      <PageHeader
        title="Purchase orders"
        subtitle="Orders to suppliers. Receiving one puts the stock in the store."
        actions={
          <Group gap="xs">
            <Button variant="default" component={Link} to="/reorder">Reorder list</Button>
            {auth.hasPermission('purchase.manage') && <Button leftSection={<Plus size={16} />} onClick={() => setOpen(true)}>New order</Button>}
          </Group>
        }
      />
      <Group mb="md" gap="sm">
        <SegmentedControl value={show} onChange={(v) => setShow(v as Show)} data={[{ value: 'open', label: 'Waiting delivery' }, { value: 'all', label: 'All' }]} />
        {q.isFetching && <Loader size="xs" />}
      </Group>
      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error ? (
        <EmptyState title="Couldn't load orders" description={getErrorMessage(q.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title={show === 'open' ? 'Nothing waiting' : 'No orders yet'} description="Place an order, or start from the reorder list." />
      ) : (
        <DayGroupedList items={rows} getDate={(p) => p.created_at} keyOf={(p) => p.id} gap="xs" render={(p) => (
          <Paper withBorder radius="md" p="sm" component={Link} to={`/purchase-orders/${p.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <StatusDot color={PO_STATUS[p.status].color} />
                  <Text size="sm" fw={700} truncate>{p.supplier?.name}</Text>
                  {groupLevel && p.property && <Badge size="xs" variant="outline" color="gray">{p.property.code}</Badge>}
                </Group>
                <Text size="xs" c="dimmed">{p.po_ref} · {PO_STATUS[p.status].label}{p.expected_date ? ` · due ${dayjs(p.expected_date).format('D MMM')}` : ''}</Text>
              </Stack>
              <Group gap={6} wrap="nowrap">
                <Text fw={700} style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>{formatCurrency(p.total)}</Text>
                <ChevronRight size={16} color="#ADB5BD" />
              </Group>
            </Group>
          </Paper>
        )} />
      )}
      {q.data?.meta && q.data.meta.pages > 1 && (
        <Group justify="center" mt="lg"><Pagination value={page} onChange={setPage} total={q.data.meta.pages} size="sm" siblings={0} /></Group>
      )}
      <CreatePOModal opened={open} onClose={() => setOpen(false)} />
    </>
  );
}
