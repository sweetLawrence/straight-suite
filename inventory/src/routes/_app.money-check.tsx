import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Group, Loader, SegmentedControl, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useMoneyCheck } from '@/hooks/useIncomeDrops';
import { useAuth } from '@/lib/auth/useAuth';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/money-check')({
  component: MoneyCheck,
});

const KIND: Record<string, string> = { payments: 'Bills and tabs', income: 'Other income', handover: 'Handed to MD' };
const RED = '#dc2626';

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fw={700} c={color}>{formatCurrency(value)}</Text>
    </div>
  );
}

function MoneyCheck() {
  const auth = useAuth();
  const [range, setRange] = useState('today');
  const [from, setFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [kind, setKind] = useState('all');
  const dates =
    range === 'today' ? { from: dayjs().format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }
    : range === 'week' ? { from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }
    : range === 'month' ? { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }
    : { from, to };
  const q = useMoneyCheck(dates, auth.hasPermission('cash.accountability'));
  const d = q.data;
  const rows = (d?.rows ?? []).filter(r => kind === 'all' || r.kind === kind);
  const multi = new Set((d?.rows ?? []).map(r => r.property)).size > 1;

  return (
    <Stack gap="md">
      <PageHeader title="Shortages" subtitle="Expected against received, for each person who handles money" />
      <SegmentedControl fullWidth value={range} onChange={setRange} data={[{ value: 'today', label: 'Today' }, { value: 'week', label: '7 days' }, { value: 'month', label: 'Month' }, { value: 'custom', label: 'Dates' }]} />
      {range === 'custom' && (
        <Group grow>
          <TextInput type="date" label="From" value={from} onChange={e => setFrom(e.currentTarget.value)} />
          <TextInput type="date" label="To" value={to} onChange={e => setTo(e.currentTarget.value)} />
        </Group>
      )}
      <SegmentedControl fullWidth size="xs" value={kind} onChange={setKind} data={[{ value: 'all', label: 'All' }, { value: 'payments', label: 'Bills' }, { value: 'income', label: 'Income' }, { value: 'handover', label: 'To MD' }]} />

      {q.isLoading && <Loader size="sm" />}
      {d && (
        <Card withBorder radius="md" p="md">
          <SimpleGrid cols={{ base: 2, sm: 5 }}>
            <Stat label="Expected" value={d.totals.expected} />
            <Stat label={kind === 'all' || kind === 'handover' ? 'Reached MD' : 'Received'} value={d.totals.received} color="#16a34a" />
            <Stat label="Waiting" value={d.totals.waiting} color="#f59e0b" />
            <Stat label="Short" value={d.totals.short} color={d.totals.short > 0 ? RED : undefined} />
            <Stat label="Still with them" value={d.totals.with_them} color={d.totals.with_them > 0 ? RED : undefined} />
          </SimpleGrid>
        </Card>
      )}

      {d && rows.length === 0 && <EmptyState title="No money moved" description="Nothing for this period." />}
      {rows.map(r => {
        return (
          <Card key={r.kind + r.person.id} withBorder radius="md" p="sm">
            <Group justify="space-between" mb={6} wrap="nowrap">
              <div>
                <Group gap={8} wrap="nowrap">
                  <span style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: r.short > 0 ? RED : r.with_them > 0 ? '#f59e0b' : '#16a34a' }} />
                  <Text fw={600}>{r.person.full_name}</Text>
                </Group>
                <Text size="xs" c="dimmed">{KIND[r.kind]}{multi ? ` · ${r.property}` : ''}</Text>
              </div>
              {r.short > 0 ? <Badge color={RED} variant="light">Short {formatCurrency(r.short)}</Badge> : r.with_them > 0 ? <Badge color="#f59e0b" variant="light">Not in yet</Badge> : <Badge color="#16a34a" variant="light">Clear</Badge>}
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              <Stat label="Expected" value={r.expected} />
              <Stat label="Received" value={r.received} color="#16a34a" />
              <Stat label="Waiting" value={r.waiting} color={r.waiting > 0 ? '#f59e0b' : undefined} />
              <Stat label="Still with them" value={r.with_them} color={r.with_them > 0 ? RED : undefined} />
            </SimpleGrid>
          </Card>
        );
      })}
    </Stack>
  );
}
