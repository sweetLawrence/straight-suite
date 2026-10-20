import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useBatches } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { ReceiveBatchModal } from '@/components/stock/ReceiveBatchModal';
import { Batch } from '@/lib/api/stock';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';

import { Can } from '@/components/Can';
export const Route = createFileRoute('/_app/stock/batches/')({   // ← trailing slash
  component: BatchesPage,
});

function BatchesPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [modalOpen, { open, close }] = useDisclosure(false);
  const query = useBatches({ page, limit: 20 });

  const canReceive =
    auth.hasPermission('stock.receive') || auth.hasRole('manager', 'md');

  const columns: Column<Batch>[] = [
    {
      key: 'batch_ref',
      header: 'Batch Ref',
      render: (r) => (
        <Text component={Link} to={`/stock/batches/${r.id}`} c="blue" fw={500}>
          {r.batch_ref}
        </Text>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (r) => r.stock_item?.item?.name || '-',
    },
    {
      key: 'received_qty',
      header: 'Received',
      render: (r) =>
        `${formatNumber(r.received_qty)} ${r.received_unit?.code || ''}`.trim(),
      align: 'right',
    },
    {
      key: 'cost_per_unit',
      header: 'Cost / Unit',
      render: (r) => formatCurrency(r.cost_per_unit),
      align: 'right',
    },
    {
      key: 'total_cost',
      header: 'Total Cost',
      render: (r) => formatCurrency(r.total_cost),
      align: 'right',
    },
    {
      key: 'received_at',
      header: 'Received',
      render: (r) => formatDateTime(r.received_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatBadge value={r.status} />,
      width: 100,
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock Batches"
        subtitle="Received stock, portioning status, and costs"
        actions={
          canReceive ? (
            <Can perm="stock.receive">
            <Button leftSection={<Plus size={16} />} onClick={open}>
              Receive Batch
            </Button>
            </Can>
          ) : undefined
        }
      />

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load batches' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No batches"
        emptyDescription="No stock batches have been received yet."
      />

      <ReceiveBatchModal opened={modalOpen} onClose={close} />
    </>
  );
}