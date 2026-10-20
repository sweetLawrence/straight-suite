import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useReturns } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { CreateReturnModal } from '@/components/returns/CreateReturnModal';
import { StockReturn } from '@/lib/api/operations';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/returns/')({
  component: ReturnsPage,
});

function ReturnsPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [open, { open: openModal, close }] = useDisclosure(false);
  const query = useReturns({ page, limit: 20 });

  const canCreate =
    auth.hasPermission('stock.return') || auth.hasRole('manager');

  const columns: Column<StockReturn>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (r) => (
        <Link
          to="/returns/$id"
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{r.return_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (r) => r.stock_item?.item?.name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <StatBadge value={r.return_type} />,
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      render: (r) => `${formatNumber(r.quantity, 3)} ${r.unit?.code || ''}`,
    },
    {
      key: 'returned_by',
      header: 'Returned By',
      render: (r) => r.returned_by_user?.full_name || '-',
    },
    {
      key: 'when',
      header: 'When',
      render: (r) => formatDateTime(r.returned_at),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock Returns"
        subtitle="Unused stock returned to the store"
        actions={
          canCreate ? (
            <Button leftSection={<Plus size={16} />} onClick={openModal}>
              Record Return
            </Button>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load returns' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No returns"
        emptyDescription="Unused stock returned will appear here."
      />
      <CreateReturnModal opened={open} onClose={close} />
    </>
  );
}