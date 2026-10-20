import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useProductionBatches } from '@/hooks/useProduction';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { StartProductionModal } from '@/components/production/StartProductionModal';
import { ProductionBatch } from '@/lib/api/production';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/production/')({
  component: ProductionPage,
});

function ProductionPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [open, { open: openModal, close }] = useDisclosure(false);
  const query = useProductionBatches({ page, limit: 20 });

  const canStart =
    auth.hasPermission('production.create') || auth.hasRole('manager', 'md');

  const columns: Column<ProductionBatch>[] = [
    {
      key: 'production_ref',
      header: 'Ref',
      render: (r) => (
        <Link
          to="/production/$id"
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{r.production_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'output',
      header: 'Producing',
      render: (r) => r.output_stock_item?.item?.name || '-',
    },
    {
      key: 'expected',
      header: 'Expected',
      align: 'right',
      render: (r) => formatNumber(r.expected_output_qty),
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      render: (r) => formatNumber(r.actual_output_qty),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (r) => {
        const v = parseFloat(r.variance_pct);
        if (r.status !== 'completed') return '-';
        return (
          <Text c={Math.abs(v) > 5 ? 'red' : 'green'} fw={500} size="sm">
            {v > 0 ? '+' : ''}{v}%
          </Text>
        );
      },
    },
    {
      key: 'produced_at',
      header: 'When',
      render: (r) => formatDateTime(r.produced_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatBadge value={r.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Production"
        subtitle="Batches produced from raw inputs"
        actions={
          canStart ? (
            <Button leftSection={<Plus size={16} />} onClick={openModal}>
              Start Production
            </Button>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load production batches' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No production batches"
        emptyDescription="Start a production batch to track inputs and outputs."
      />
      <StartProductionModal opened={open} onClose={close} />
    </>
  );
}