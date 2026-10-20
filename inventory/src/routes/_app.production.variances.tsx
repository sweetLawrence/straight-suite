import { createFileRoute, Link } from '@tanstack/react-router';
import { Text } from '@mantine/core';
import { useState } from 'react';
import { useProductionVariances } from '@/hooks/useProduction';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { ProductionVariance } from '@/lib/api/production';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/production/variances')({
  component: VariancesPage,
});

function VariancesPage() {
  const [page, setPage] = useState(1);
  const query = useProductionVariances({ page, limit: 20 });

  const columns: Column<ProductionVariance>[] = [
    {
      key: 'batch',
      header: 'Batch',
      render: (v) => (
        <Link
          to="/production/$id"
          params={{ id: v.production_batch_id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500} size="sm">
            {v.production_batch?.production_ref || '-'}
          </Text>
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (v) => v.variance_type.replace(/_/g, ' '),
    },
    {
      key: 'expected',
      header: 'Expected',
      align: 'right',
      render: (v) => formatNumber(v.expected_qty),
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      render: (v) => formatNumber(v.actual_qty),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (v) => {
        const pct = parseFloat(v.variance_pct);
        return (
          <Text c={Math.abs(pct) > 10 ? 'red' : 'orange'} fw={500} size="sm">
            {pct > 0 ? '+' : ''}{pct}%
          </Text>
        );
      },
    },
    {
      key: 'cost',
      header: 'Cost Impact',
      align: 'right',
      render: (v) => formatCurrency(v.cost_impact),
    },
    {
      key: 'created',
      header: 'Flagged',
      render: (v) => formatDateTime(v.created_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatBadge value={v.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Production Variances"
        subtitle="Yield shortfalls and excesses across production batches"
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load variances' : null}
        rowKey={(v) => v.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No variances"
        emptyDescription="Production variances will appear here."
      />
    </>
  );
}