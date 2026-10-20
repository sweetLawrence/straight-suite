import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button, Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft, Scissors } from 'lucide-react';
import { useState } from 'react';
import { useBatch, useBatchPortions } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { Portion } from '@/lib/api/stock';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';
import { useAuth } from '@/lib/auth/useAuth';

import { Can } from '@/components/Can';
export const Route = createFileRoute('/_app/stock/batches/$id')({
  component: BatchDetailPage,
});

function BatchDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
   const navigate = useNavigate(); 
  const batch = useBatch(id);
  const [page, setPage] = useState(1);
  const portions = useBatchPortions(id, { page, limit: 20 });

  const canPortion =
    auth.hasPermission('stock.portion') || auth.hasRole('manager', 'md');
  const alreadyPortioned =
    batch.data?.status === 'depleted' ||
    portions.data?.meta.total && portions.data.meta.total > 0;

  if (batch.isLoading) return <LoadingState />;
  if (batch.error || !batch.data) return <EmptyState title="Batch not found" />;

  const b = batch.data;

  const columns: Column<Portion>[] = [
    {
      key: 'portion_ref',
      header: 'Portion Ref',
      render: (r) => <Text fw={500} size="sm">{r.portion_ref}</Text>,
    },
    {
      key: 'size',
      header: 'Size',
      render: (r) => `${formatNumber(r.portion_size)} ${r.portion_unit?.code || ''}`.trim(),
    },
    {
      key: 'cost_basis',
      header: 'Cost',
      render: (r) => formatCurrency(r.cost_basis),
      align: 'right',
    },
    {
      key: 'sell_price',
      header: 'Sell',
      render: (r) => formatCurrency(r.sell_price),
      align: 'right',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatBadge value={r.status} />,
    },
  ];

  return (
    <>
      <Button
        variant="subtle"
        leftSection={<ArrowLeft size={16} />}
        component={Link}
        to="/stock/batches"
        mb="sm"
      >
        Back to batches
      </Button>

      <PageHeader
        title={b.batch_ref}
        subtitle={b.stock_item?.item?.name || 'Batch'}
        actions={
          !alreadyPortioned && canPortion ? (
            <Can perm="stock.portion">
            <Button
              leftSection={<Scissors size={16} />}
              onClick={() =>
                navigate({
                  to: '/stock/portion',
                  search: { batch_id: b.id },
                })
              }
            >
              Portion this batch
            </Button>
            </Can>
          ) : undefined
        }
      />

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Received
            </Text>
            <Text fw={600}>
              {formatNumber(b.received_qty)} {b.received_unit?.code || ''}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Total Cost
            </Text>
            <Text fw={600}>{formatCurrency(b.total_cost)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Cost per Unit
            </Text>
            <Text fw={600}>{formatCurrency(b.cost_per_unit)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Status
            </Text>
            <Group mt={4}>
              <StatBadge value={b.status} />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Purchase ref
                </Text>
                <Text size="sm">{b.purchase_ref || '-'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Received by
                </Text>
                <Text size="sm">{b.received_by_user?.full_name || '-'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Received at
                </Text>
                <Text size="sm">{formatDateTime(b.received_at)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Expiry
                </Text>
                <Text size="sm">{b.expiry_date || '-'}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Title order={4} mb="sm">
        Portions
      </Title>

      <DataTable
        data={portions.data?.data ?? []}
        columns={columns}
        loading={portions.isLoading}
        error={portions.error ? 'Failed to load portions' : null}
        rowKey={(r) => r.id}
        meta={portions.data?.meta}
        onPageChange={setPage}
        emptyTitle="No portions yet"
        emptyDescription="This batch has not been portioned."
      />
    </>
  );
}