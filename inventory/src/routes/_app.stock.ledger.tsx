import { createFileRoute } from '@tanstack/react-router';
import { Group, Select, Text } from '@mantine/core';
import { useState } from 'react';
import { useLedger, useStockItems } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { LedgerEntry } from '@/lib/api/stock';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/stock/ledger')({
  component: LedgerPage,
});

const eventTypes = [
  'receipt',
  'portioning',
  'order_issue',
  'bulk_issue',
  'bulk_return',
  'bulk_waste',
  'packaged_sale',
  'production_input',
  'production_receipt',
  'staff_meal',
  'transfer_dispatch',
  'transfer_receipt',
  'transfer_short',
  'return',
  'waste',
  'adjustment',
];

function LedgerPage() {
  const [page, setPage] = useState(1);
  const [stockItemId, setStockItemId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);

  const stockItems = useStockItems({ limit: 200 });
  const query = useLedger({
    page,
    limit: 20,
    stock_item_id: stockItemId || undefined,
    event_type: eventType || undefined,
  });

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'performed_at',
      header: 'When',
      render: (r) => <Text size="sm">{formatDateTime(r.performed_at)}</Text>,
      width: 160,
    },
    {
      key: 'event_type',
      header: 'Event',
      render: (r) => <Text size="sm" fw={500}>{r.event_type.replace(/_/g, ' ')}</Text>,
    },
    {
      key: 'stock_item',
      header: 'Item',
      render: (r) => r.stock_item?.item?.name || '-',
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (r) => r.batch?.batch_ref || '-',
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      render: (r) => {
        const n = parseFloat(r.quantity);
        return (
          <Text
            size="sm"
            c={n < 0 ? 'red' : 'green'}
            fw={500}
          >
            {n > 0 ? '+' : ''}
            {formatNumber(r.quantity, 3)} {r.unit?.code || ''}
          </Text>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (r) => (
        <Text size="xs" c="dimmed">
          {r.reference_type || '-'}
        </Text>
      ),
    },
  ];

  const itemOptions =
    stockItems.data?.data.map((s) => ({
      value: s.id,
      label: s.item?.name || s.item?.code || 'Item',
    })) || [];

  return (
    <>
      <PageHeader
        title="Stock Ledger"
        subtitle="Every movement, append-only, auditable"
      />

      <Group mb="md">
        <Select
          placeholder="All items"
          clearable
          searchable
          data={itemOptions}
          value={stockItemId}
          onChange={(v) => {
            setStockItemId(v);
            setPage(1);
          }}
          w={250}
        />
        <Select
          placeholder="All events"
          clearable
          data={eventTypes}
          value={eventType}
          onChange={(v) => {
            setEventType(v);
            setPage(1);
          }}
          w={220}
        />
      </Group>

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load ledger' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No movements"
        emptyDescription="Stock movements will appear here as they happen."
      />
    </>
  );
}