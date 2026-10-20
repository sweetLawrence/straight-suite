import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Group, Select, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { useReconciliationChecks } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { RunCheckModal } from '@/components/reconciliation/RunCheckModal';
import { ReconciliationCheck } from '@/lib/api/admin';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Can } from '@/components/Can';

export const Route = createFileRoute('/_app/reconciliation/')({
  component: ReconciliationPage,
});

function ReconciliationPage() {
  const [page, setPage] = useState(1);
  const [checkType, setCheckType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [open, { open: openModal, close }] = useDisclosure(false);

  const query = useReconciliationChecks({
    page,
    limit: 20,
    check_type: checkType || undefined,
    status: status || undefined,
  });

  const columns: Column<ReconciliationCheck>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (c) => (
        <Link
          to="/reconciliation/$id"
          params={{ id: c.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{c.check_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => <StatBadge value={c.check_type} />,
    },
    {
      key: 'reference',
      header: 'Entity',
      render: (c) => (
        <Text size="sm" c="dimmed">
          {c.reference_type || '-'} {c.reference_id?.slice(0, 8) || ''}
        </Text>
      ),
    },
    {
      key: 'expected',
      header: 'Expected',
      align: 'right',
      render: (c) => (c.expected_amount ? formatCurrency(c.expected_amount) : '-'),
    },
    {
      key: 'actual',
      header: 'Actual',
      align: 'right',
      render: (c) => (c.actual_amount ? formatCurrency(c.actual_amount) : '-'),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (c) => {
        if (!c.variance) return '-';
        const v = parseFloat(c.variance);
        return (
          <Text c={v === 0 ? 'green' : 'red'} fw={500} size="sm">
            {v > 0 ? '+' : ''}{formatCurrency(v)}
          </Text>
        );
      },
    },
    {
      key: 'when',
      header: 'Checked',
      render: (c) => formatDateTime(c.checked_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatBadge value={c.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reconciliation Checks"
        subtitle="Three checks: customer bill, waiter collections, stock fulfilment"
        actions={
          <Can perm="reconciliation.run">
          <Button leftSection={<Play size={16} />} onClick={openModal}>
            Run Check
          </Button>
          </Can>
        }
      />
      <Group mb="md">
        <Select
          placeholder="All types"
          clearable
          data={[
            { value: 'customer_bill', label: 'Customer Bill' },
            { value: 'waiter_collections', label: 'Waiter Collections' },
            { value: 'stock_fulfilment', label: 'Stock Fulfilment' },
          ]}
          value={checkType}
          onChange={(v) => { setCheckType(v); setPage(1); }}
          w={220}
        />
        <Select
          placeholder="All statuses"
          clearable
          data={[
            { value: 'pending', label: 'Pending' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'exception', label: 'Exception' },
          ]}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          w={180}
        />
      </Group>
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load checks' : null}
        rowKey={(c) => c.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No checks"
        emptyDescription="Run a check to compare expected vs actual."
      />
      <RunCheckModal opened={open} onClose={close} />
    </>
  );
}