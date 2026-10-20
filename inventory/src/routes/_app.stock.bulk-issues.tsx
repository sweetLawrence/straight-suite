import { createFileRoute } from '@tanstack/react-router';
import { Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useBulkIssues } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { BulkIssue } from '@/lib/api/stock';
import { CreateBulkIssueModal } from '@/components/stock/CreateBulkIssueModal';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

import { Can } from '@/components/Can';
export const Route = createFileRoute('/_app/stock/bulk-issues')({
  component: BulkIssuesPage,
});

function BulkIssuesPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [modalOpen, { open, close }] = useDisclosure(false);
  const query = useBulkIssues({ page, limit: 20 });

  const canCreate =
    auth.hasPermission('stock.bulk_issue') || auth.hasRole('manager', 'md');

  const columns: Column<BulkIssue>[] = [
    {
      key: 'bulk_issue_ref',
      header: 'Ref',
      render: (r) => <Text fw={500}>{r.bulk_issue_ref}</Text>,
    },
    {
      key: 'item',
      header: 'Item',
      render: (r) => r.stock_item?.item?.name || '-',
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      render: (r) => `${formatNumber(r.quantity, 3)} ${r.unit?.code || ''}`,
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (r) => r.purpose,
    },
    {
      key: 'issued_at',
      header: 'When',
      render: (r) => formatDateTime(r.issued_at),
    },
    {
      key: 'issued_by',
      header: 'By',
      render: (r) => r.issued_by_user?.full_name || '-',
    },
  ];

  return (
    <>
      <PageHeader
        title="Bulk Issues"
        subtitle="Daily issues to kitchen - bulk stock without portioning"
        actions={
          canCreate ? (
            <Can perm="stock.bulk_issue">
            <Button leftSection={<Plus size={16} />} onClick={open}>
              New Bulk Issue
            </Button>
            </Can>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load bulk issues' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No bulk issues"
        emptyDescription="No bulk stock has been issued yet."
      />
      <CreateBulkIssueModal opened={modalOpen} onClose={close} />
    </>
  );
}