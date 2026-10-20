import { createFileRoute, Link } from '@tanstack/react-router';
import { Text } from '@mantine/core';
import { useState } from 'react';
import { useDisputes } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { Dispute } from '@/lib/api/operations';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/disputes/')({
  component: DisputesPage,
});

function DisputesPage() {
  const [page, setPage] = useState(1);
  const query = useDisputes({ page, limit: 20 });

  const columns: Column<Dispute>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (r) => (
        <Link
          to="/disputes/$id"
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{r.dispute_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'raised_by',
      header: 'Raised By',
      render: (r) => r.raised_by_user?.full_name || '-',
    },
    {
      key: 'against',
      header: 'Against',
      render: (r) => r.against_user?.full_name || '-',
    },
    {
      key: 'amount',
      header: 'Disputed',
      align: 'right',
      render: (r) => formatCurrency(r.amount_disputed),
    },
    {
      key: 'created',
      header: 'Created',
      render: (r) => formatDateTime(r.created_at),
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
        title="Disputes"
        subtitle="Cash and payment discrepancies"
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load disputes' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No disputes"
        emptyDescription="Disputes between waiters and cashiers appear here."
      />
    </>
  );
}