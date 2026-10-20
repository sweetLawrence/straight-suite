import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Group, Select, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useExceptions } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { CreateExceptionModal } from '@/components/exceptions/CreateExceptionModal';
import { AppException } from '@/lib/api/admin';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/exceptions/')({
  component: ExceptionsPage,
});

function ExceptionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);
  const [open, { open: openModal, close }] = useDisclosure(false);

  const query = useExceptions({
    page,
    limit: 20,
    status: status || undefined,
    severity: severity || undefined,
  });

  const columns: Column<AppException>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (e) => (
        <Link
          to="/exceptions/$id"
          params={{ id: e.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{e.exception_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (e) => e.exception_type.replace(/_/g, ' '),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (e) => <StatBadge value={e.severity} />,
    },
    {
      key: 'description',
      header: 'Description',
      render: (e) => (
        <Text size="sm" lineClamp={1}>
          {e.description}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (e) => (e.amount ? formatCurrency(e.amount) : '-'),
    },
    {
      key: 'created',
      header: 'Created',
      render: (e) => formatDateTime(e.created_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatBadge value={e.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Exceptions"
        subtitle="Flagged issues requiring attention"
        actions={
          <Button leftSection={<Plus size={16} />} onClick={openModal}>
            Create Exception
          </Button>
        }
      />
      <Group mb="md">
        <Select
          placeholder="All severities"
          clearable
          data={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ]}
          value={severity}
          onChange={(v) => { setSeverity(v); setPage(1); }}
          w={180}
        />
        <Select
          placeholder="All statuses"
          clearable
          data={[
            { value: 'open', label: 'Open' },
            { value: 'investigating', label: 'Investigating' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'escalated', label: 'Escalated' },
            { value: 'closed', label: 'Closed' },
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
        error={query.error ? 'Failed to load exceptions' : null}
        rowKey={(e) => e.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No exceptions"
        emptyDescription="Flagged issues will appear here."
      />
      <CreateExceptionModal opened={open} onClose={close} />
    </>
  );
}