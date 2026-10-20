import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Group, Loader, Modal, NumberInput, Paper, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { CalendarClock, ChefHat, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { CreateBulkIssueModal } from '@/components/stock/CreateBulkIssueModal';
import { useCloseKitchenIssue, useExpiring, useKitchenDay } from '@/hooks/useKitchen';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { KitchenRow } from '@/lib/api/kitchen';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/kitchen')({ component: KitchenPage });

const C = { navy: '#1F3A5F', green: '#2B8A3E', red: '#C92A2A', orange: '#F08C00', blue: '#1971C2', muted: '#868E96' };
const q3 = (v: number | null | undefined) => Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 3 });
type When = 'today' | 'yesterday' | 'date';

function KitchenPage() {
  const auth = useAuth();
  const canIssue = auth.hasPermission('stock.bulk_issue');
  const [tab, setTab] = useState<'day' | 'expiring'>('day');
  const [when, setWhen] = useState<When>('today');
  const [date, setDate] = useState<string | null>(dayjs().subtract(2, 'day').format('YYYY-MM-DD'));
  const [issuing, setIssuing] = useState(false);
  const [closing, setClosing] = useState<KitchenRow | null>(null);
  const day = when === 'yesterday' ? dayjs().subtract(6, 'hour').subtract(1, 'day').format('YYYY-MM-DD') : when === 'date' ? date || undefined : undefined;
  const q = useKitchenDay(day);
  const k = q.data;

  return (
    <>
      <PageHeader
        title="Kitchen"
        subtitle="Bulk stock issued to the kitchen, and what came back at the end of the day"
        actions={canIssue ? <Button leftSection={<Plus size={16} />} onClick={() => setIssuing(true)}>Issue to kitchen</Button> : undefined}
      />
      <SegmentedControl mb="md" value={tab} onChange={(v) => setTab(v as 'day' | 'expiring')}
        data={[{ value: 'day', label: 'Day sheet' }, { value: 'expiring', label: 'Expiring soon' }]} />

      {tab === 'expiring' ? <Expiring /> : (
        <>
          <Group gap="sm" mb="md" align="flex-end">
            <Select value={when} onChange={(v) => setWhen((v as When) || 'today')} allowDeselect={false} w={150}
              data={[{ value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' }, { value: 'date', label: 'Pick a day' }]} />
            {when === 'date' && <DatePickerInput value={date} onChange={(v) => setDate(v ? dayjs(v).format('YYYY-MM-DD') : null)} maxDate={new Date()} valueFormat="D MMM YYYY" w={150} />}
            {q.isFetching && <Loader size="xs" />}
          </Group>
          {q.isLoading ? <Group justify="center" py="xl"><Loader /></Group>
            : q.error || !k ? <EmptyState title="Couldn't load" description={q.error ? getErrorMessage(q.error) : ''} />
            : (
              <Stack gap="md">
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                  <Tile label="Issued" value={formatCurrency(k.totals.issued_value)} hint={`${k.totals.issues} items`} />
                  <Tile label="Used" value={formatCurrency(k.totals.used_cost)} hint="Cost of what was used" color={C.navy} />
                  <Tile label="Came back" value={formatCurrency(k.totals.returned_value)} color={C.green} hint="Back on the shelf" />
                  <Tile label="Wasted" value={formatCurrency(k.totals.wasted_value)} color={k.totals.wasted_value ? C.red : C.navy} hint={k.totals.open ? `${k.totals.open} not closed yet` : 'All closed'} />
                </SimpleGrid>
                {k.rows.length === 0 ? <EmptyState title="Nothing issued" description="Stock issued to the kitchen this day shows here." /> : k.rows.map((r) => (
                  <Paper key={r.id} withBorder radius="md" p="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                      <Box style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <StatusDot color={r.closed ? C.green : C.orange} />
                          <Text size="sm" fw={700} truncate>{r.item}</Text>
                        </Group>
                        <Text size="xs" c="dimmed">{q3(r.issued_qty)} {r.unit || ''} issued · {dayjs(r.issued_at).format('HH:mm')} · {r.purpose}</Text>
                        {r.closed ? (
                          <Text size="xs" mt={2}>
                            <Text span c={C.green} fw={600}>{q3(r.returned_qty)} back</Text>
                            {r.wasted_qty ? <Text span c={C.red} fw={600}> · {q3(r.wasted_qty)} wasted</Text> : null}
                            <Text span fw={600}> · {q3(r.used_qty)} used</Text>
                          </Text>
                        ) : <Badge mt={4} size="xs" variant="light" color="orange">Not closed</Badge>}
                      </Box>
                      <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                        <Text size="sm" fw={700} style={{ color: C.navy }}>{formatCurrency(r.closed ? r.used_cost : r.issued_value)}</Text>
                        {!r.closed && canIssue && <Button size="compact-xs" onClick={() => setClosing(r)}>Close</Button>}
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
        </>
      )}
      <CreateBulkIssueModal opened={issuing} onClose={() => setIssuing(false)} />
      <CloseModal row={closing} onClose={() => setClosing(null)} />
    </>
  );
}

function CloseModal({ row, onClose }: { row: KitchenRow | null; onClose: () => void }) {
  const close = useCloseKitchenIssue();
  const [back, setBack] = useState(0);
  const [wasted, setWasted] = useState(0);
  const [notes, setNotes] = useState('');
  const issued = row?.issued_qty ?? 0;
  const used = Math.round((issued - back - wasted) * 1000) / 1000;
  const save = async () => {
    if (!row) return;
    try {
      const r = await close.mutateAsync({ id: row.id, returned_qty: back, wasted_qty: wasted, notes: notes.trim() || undefined });
      notifications.show({ color: 'green', title: 'Closed', message: `${q3(r.used_qty)} used · ${formatCurrency(r.used_cost)}` });
      setBack(0); setWasted(0); setNotes('');
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not close', message: getErrorMessage(err) });
    }
  };
  return (
    <Modal opened={!!row} onClose={onClose} title={row ? `Close ${row.item}` : ''}>
      {row && (
        <Stack>
          <Text size="sm" c="dimmed">{q3(issued)} {row.unit || ''} went to the kitchen. What is left goes back into the batch it came from.</Text>
          <SimpleGrid cols={2} spacing="sm">
            <NumberInput label="Came back" min={0} max={issued} decimalScale={3} value={back} onChange={(v) => setBack(Number(v) || 0)} />
            <NumberInput label="Wasted" min={0} max={issued} decimalScale={3} value={wasted} onChange={(v) => setWasted(Number(v) || 0)} />
          </SimpleGrid>
          <Card withBorder radius="md" p="sm" style={{ background: used < 0 ? '#FFF5F5' : '#F8F9FA' }}>
            <Group justify="space-between">
              <Text size="sm">Used</Text>
              <Text fw={800} style={{ color: used < 0 ? C.red : C.navy }}>{q3(used)} {row.unit || ''} · {formatCurrency(Math.max(0, used) * row.unit_cost)}</Text>
            </Group>
          </Card>
          <TextInput label="Note" placeholder="e.g. Burnt pot, 0.5 kg thrown" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
          <Button disabled={used < 0} loading={close.isPending} onClick={save}>Close for the day</Button>
        </Stack>
      )}
    </Modal>
  );
}

function Expiring() {
  const [days, setDays] = useState('7');
  const q = useExpiring(Number(days));
  const rows = q.data ?? [];
  return (
    <>
      <Group mb="md" gap="sm">
        <Select value={days} onChange={(v) => setDays(v || '7')} allowDeselect={false} w={170}
          data={[{ value: '3', label: 'Next 3 days' }, { value: '7', label: 'Next 7 days' }, { value: '30', label: 'Next 30 days' }]} />
        {q.isFetching && <Loader size="xs" />}
      </Group>
      {q.isLoading ? <Group justify="center" py="xl"><Loader /></Group>
        : rows.length === 0 ? <EmptyState title="Nothing expiring" description="Batches with an expiry date in this window show here. Issue these first." />
        : (
          <Stack gap="xs">
            {rows.map((r) => {
              const color = r.expired ? C.red : r.days_left <= 2 ? C.orange : C.blue;
              return (
                <Paper key={r.batch_id} withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      {r.store_type === 'kitchen' ? <ChefHat size={18} color={color} /> : <CalendarClock size={18} color={color} />}
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={700} truncate>{r.name}</Text>
                        <Text size="xs" c="dimmed">{q3(r.left_qty)} {r.unit || ''} left · {r.batch_ref} · {r.property}</Text>
                      </Box>
                    </Group>
                    <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                      <Text size="sm" fw={800} style={{ color }}>
                        {r.expired ? `Expired ${-r.days_left}d ago` : r.days_left === 0 ? 'Expires today' : `In ${r.days_left}d`}
                      </Text>
                      <Text size="xs" c="dimmed">{formatCurrency(r.value)}</Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
    </>
  );
}

function Tile({ label, value, hint, color = '#1F3A5F' }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <Card withBorder radius="md" p="sm">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fw={800} fz={{ base: 16, sm: 20 }} style={{ color, whiteSpace: 'nowrap' }}>{value}</Text>
      {hint && <Text size="xs" c="dimmed">{hint}</Text>}
    </Card>
  );
}
