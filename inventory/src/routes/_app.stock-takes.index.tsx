import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { BarChart3, ChevronRight, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { DayGroupedList } from '@/components/DayGroupedList';
import { STORE_OPTIONS, ST, TAKE_STATUS } from '@/components/stock-takes/parts';
import { useStartStockTake, useStockTakes } from '@/hooks/useStockTakes';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { StoreType } from '@/lib/api/stockTakes';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/stock-takes/')({
  component: StockTakesPage,
});

type Show = 'all' | 'counting' | 'submitted';

function StockTakesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const barOnly =
    auth.hasRole('bar_attendant') && !auth.hasRole('store_manager', 'manager', 'supervisor', 'md', 'admin');
  const canCount = auth.hasPermission('stock_take.count');
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);
  const [picking, setPicking] = useState(false);
  const [store, setStore] = useState<StoreType>('bar_store');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const properties = useProperties(1, 20);
  const query = useStockTakes({ page, limit: 30, status: show === 'all' ? undefined : show });
  const start = useStartStockTake();

  const begin = async (storeType: StoreType) => {
    try {
      const t = await start.mutateAsync({ store_type: storeType, property_id: groupLevel ? propertyId || undefined : undefined });
      navigate({ to: '/stock-takes/$id', params: { id: t.id } });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not start', message: getErrorMessage(err) });
    }
  };

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title={barOnly ? 'Bar count' : 'Stock takes'}
        subtitle="Count what is on the shelf. Differences are corrected once a manager approves."
        actions={
          <Group gap="xs">
            <Button variant="default" leftSection={<BarChart3 size={16} />} component={Link} to="/stock-takes/variances">
              Variances
            </Button>
            {canCount && (
              <Button
                leftSection={<ClipboardList size={16} />}
                loading={start.isPending}
                onClick={() => (barOnly ? begin('bar_store') : setPicking(true))}
              >
                {barOnly ? 'Count the bar' : 'New count'}
              </Button>
            )}
          </Group>
        }
      />

      <Group mb="md" gap="sm">
        <SegmentedControl
          value={show}
          onChange={(v) => {
            setShow(v as Show);
            setPage(1);
          }}
          data={[
            { value: 'all', label: 'All' },
            { value: 'counting', label: 'Counting' },
            { value: 'submitted', label: 'To approve' },
          ]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load stock takes" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No counts yet" description="Start a count to check what is really on the shelf." />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(t) => t.created_at}
          keyOf={(t) => t.id}
          gap="xs"
          render={(t) => {
            const st = TAKE_STATUS[t.status];
            const pct = t.progress.total ? Math.round((t.progress.counted / t.progress.total) * 100) : 0;
            return (
              <Paper
                withBorder
                radius="md"
                p="sm"
                component={Link}
                to={`/stock-takes/${t.id}`}
                style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={6} wrap="wrap">
                      <StatusDot color={st.color} />
                      <Text size="sm" fw={700}>
                        {t.store}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {st.label}
                      </Text>
                      {groupLevel && t.property && (
                        <Badge size="xs" variant="outline" color="gray">
                          {t.property.code}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t.take_ref} · {dayjs(t.created_at).format('HH:mm')}
                      {t.counted_by ? ` · ${t.counted_by.full_name}` : ''}
                    </Text>
                    {t.status === 'counting' ? (
                      <Box mt={4}>
                        <Progress value={pct} size="sm" radius="xl" color="blue" />
                        <Text size="xs" c="dimmed" mt={2}>
                          {t.progress.counted} of {t.progress.total} counted
                        </Text>
                      </Box>
                    ) : (
                      t.shortage_value != null && (
                        <Text size="xs" fw={600} style={{ color: t.shortage_value > 0 ? ST.red : ST.green }}>
                          {t.shortage_value > 0 ? `Short ${formatCurrency(t.shortage_value)} at cost` : 'Nothing missing'}
                          {t.shortage_sell_value ? ` · ${formatCurrency(t.shortage_sell_value)} at selling price` : ''}
                        </Text>
                      )
                    )}
                  </Stack>
                  <ChevronRight size={16} color="#ADB5BD" style={{ flexShrink: 0, marginTop: 2 }} />
                </Group>
              </Paper>
            );
          }}
        />
      )}

      {meta && meta.pages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination value={page} onChange={setPage} total={meta.pages} size="sm" siblings={0} />
        </Group>
      )}

      <Modal opened={picking} onClose={() => setPicking(false)} title="What are you counting?">
        <Stack>
          {groupLevel && (
            <Select
              label="Property"
              data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
              value={propertyId}
              onChange={setPropertyId}
            />
          )}
          <SegmentedControl fullWidth value={store} onChange={(v) => setStore(v as StoreType)} data={STORE_OPTIONS} />
          <Text size="xs" c="dimmed">
            Every active item in that store is listed. Count what is physically there; the system figure stays hidden until
            you submit. If a count is already open for that store, you carry on with it.
          </Text>
          <Button loading={start.isPending} disabled={groupLevel && !propertyId} onClick={() => begin(store)}>
            Start counting
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
