import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAdjustments } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { CreateAdjustmentModal } from '@/components/adjustments/CreateAdjustmentModal';
import { Adjustment } from '@/lib/api/admin';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/adjustments/')({
  component: AdjustmentsPage,
});

function AdjustmentsPage() {
  const [page, setPage] = useState(1);
  const [open, { open: openModal, close }] = useDisclosure(false);
  const query = useAdjustments({ page, limit: 20 });

  const columns: Column<Adjustment>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (a) => (
        <Link
          to="/adjustments/$id"
          params={{ id: a.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{a.adjustment_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (a) => a.adjustment_type.replace(/_/g, ' '),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (a) => (a.amount ? formatCurrency(a.amount) : '-'),
    },
    {
      key: 'requested',
      header: 'Requested By',
      render: (a) => a.requested_by_user?.full_name || '-',
    },
    {
      key: 'created',
      header: 'Created',
      render: (a) => formatDateTime(a.created_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatBadge value={a.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Adjustments"
        subtitle="Authorized corrections to posted records"
        actions={
          <Button leftSection={<Plus size={16} />} onClick={openModal}>
            Request Adjustment
          </Button>
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load adjustments' : null}
        rowKey={(a) => a.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No adjustments"
        emptyDescription="Adjustments are corrections to previously posted records."
      />
      <CreateAdjustmentModal opened={open} onClose={close} />
    </>
  );
}