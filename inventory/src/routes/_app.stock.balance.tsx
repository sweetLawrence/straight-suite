import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ActionIcon, CloseButton, Group, SegmentedControl, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ScanLine, Search } from 'lucide-react';
import { BarcodeScanner } from '@/components/scan/BarcodeScanner';
import { lookupBarcode } from '@/lib/api/stock';
import { useLedgerSummary } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { LedgerSummaryRow } from '@/lib/api/stock';
import { formatNumber, formatPacks } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/api/client';

export const Route = createFileRoute('/_app/stock/balance')({
  component: BalancePage,
});

type Show = 'all' | 'in' | 'empty';

function BalancePage() {
  const query = useLedgerSummary();
  const [q, setQ] = useState('');
  const [scanning, setScanning] = useState(false);
  const [show, setShow] = useState<Show>('all');

  const rows = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (query.data ?? [])
      .filter((r) => {
        const bal = Number(r.balance);
        if (show === 'in' && bal <= 0) return false;
        if (show === 'empty' && bal > 0) return false;
        if (!words.length) return true;
        const hay = `${r.item?.name ?? ''} ${r.item?.code ?? ''} ${r.stock_item?.stock_model ?? ''} ${r.stock_item?.store_type ?? ''}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || ''));
  }, [query.data, q, show]);

  const columns: Column<LedgerSummaryRow>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (r) => <Text fw={500}>{r.item?.name || '-'}</Text>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (r) => (
        <Text size="sm" c="dimmed">
          {r.item?.code || '-'}
        </Text>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      render: (r) => r.stock_item?.stock_model || '-',
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      render: (r) => {
        const packs = formatPacks(r.balance, r.stock_item?.pack_size, r.stock_item?.pack_label);
        return (
          <>
            <Text fw={600} c={r.balance < 0 ? 'red' : r.balance === 0 ? 'dimmed' : 'green'}>
              {formatNumber(r.balance, 3)} {r.stock_item?.item?.base_unit?.code || ''}
            </Text>
            {packs && (
              <Text size="xs" c="dimmed">
                {packs}
              </Text>
            )}
          </>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock Balance"
        subtitle={
          query.data
            ? `${rows.length} of ${query.data.length} items · sum of all ledger movements`
            : 'Current balance per item, the sum of all ledger movements'
        }
      />
      <Group gap="sm" mb="md" wrap="wrap" align="center">
        <TextInput
          placeholder="Search item or code, e.g. rice, beer"
          leftSection={<Search size={16} />}
          rightSection={q ? <CloseButton size="sm" aria-label="Clear" onClick={() => setQ('')} /> : null}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220, maxWidth: 420 }}
          autoComplete="off"
        />
        <ActionIcon size="lg" variant="light" aria-label="Scan barcode" onClick={() => setScanning(true)}>
          <ScanLine size={18} />
        </ActionIcon>
        <BarcodeScanner
          opened={scanning}
          onClose={() => setScanning(false)}
          onCode={async (code) => {
            setScanning(false);
            try {
              const hits = await lookupBarcode(code);
              setQ(hits[0].name);
            } catch {
              notifications.show({ color: 'orange', title: 'Unknown barcode', message: `${code}: add it on the stock item first` });
            }
          }}
        />
        <SegmentedControl
          value={show}
          onChange={(v) => setShow(v as Show)}
          data={[
            { value: 'all', label: 'All' },
            { value: 'in', label: 'In stock' },
            { value: 'empty', label: 'Empty' },
          ]}
        />
      </Group>
      <DataTable
        data={rows}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? getErrorMessage(query.error, 'Failed to load balance') : null}
        rowKey={(r) => `${r.property_id}:${r.stock_item_id}`}
        emptyTitle={q || show !== 'all' ? 'Nothing matches' : 'No stock yet'}
        emptyDescription={q || show !== 'all' ? 'Try another search or filter.' : 'No stock movements have been recorded.'}
      />
    </>
  );
}
