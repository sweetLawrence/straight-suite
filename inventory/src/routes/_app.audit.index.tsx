import { createFileRoute, Link } from '@tanstack/react-router';
import { Group, Select, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useAuditEvents } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { EventLogEntry } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/audit/')({
  component: AuditPage,
});

function AuditPage() {
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const query = useAuditEvents({
    page,
    limit: 50,
    event_type: eventType || undefined,
    entity_type: entityType || undefined,
  });

  const columns: Column<EventLogEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (e) => (
        <Link
          to="/audit/$id"
          params={{ id: e.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text size="xs" c="blue">
            {formatDateTime(e.occurred_at)}
          </Text>
        </Link>
      ),
      width: 160,
    },
    {
      key: 'event_type',
      header: 'Event',
      render: (e) => (
        <Text size="sm" fw={500}>
          {e.event_type}
        </Text>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (e) => (
        <Text size="xs" c="dimmed">
          {e.entity_type}
        </Text>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (e) => e.actor?.full_name || 'system',
    },
    {
      key: 'action',
      header: 'Action',
      render: (e) => <Text size="sm">{e.action}</Text>,
    },
  ];

  const filtered = (query.data?.data ?? []).filter((e) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      e.event_type.toLowerCase().includes(s) ||
      e.entity_type.toLowerCase().includes(s) ||
      e.entity_id.toLowerCase().includes(s) ||
      (e.actor?.full_name || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Every state-changing action, append-only"
      />

      <Group mb="md">
        <TextInput
          placeholder="Search event, entity, actor…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          w={280}
        />
        <Select
          placeholder="Entity type"
          clearable
          data={[
            { value: 'order', label: 'Order' },
            { value: 'bill', label: 'Bill' },
            { value: 'payment', label: 'Payment' },
            { value: 'cash_drop', label: 'Cash Drop' },
            { value: 'batch', label: 'Batch' },
            { value: 'stock_ledger', label: 'Stock Ledger' },
            { value: 'transfer', label: 'Transfer' },
            { value: 'production_batch', label: 'Production' },
          ]}
          value={entityType}
          onChange={(v) => { setEntityType(v); setPage(1); }}
          w={200}
        />
      </Group>

      <DataTable
        data={filtered}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load events' : null}
        rowKey={(e) => e.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No events"
        emptyDescription="Activity across the system will appear here."
      />
    </>
  );
}