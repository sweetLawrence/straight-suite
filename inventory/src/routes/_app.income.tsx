import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Loader, Modal, Pagination, Paper, Select, SimpleGrid, Stack, Text, Textarea, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { DayGroupedList } from '@/components/DayGroupedList';
import { IncomeModal } from '@/components/income/IncomeModal';
import { InHousePanel } from '@/components/income/InHousePanel';
import { PricesModal } from '@/components/income/PricesModal';
import { STREAM_CARD } from '@/components/income/streams';
import { useIncome, useIncomePrices, useVoidIncome } from '@/hooks/useIncome';
import { STREAM_LABEL, type IncomeEntry, type IncomeStream } from '@/lib/api/income';
import { useAuth } from '@/lib/auth/useAuth';
import { getActing } from '@/lib/auth/acting';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/income')({
  component: IncomePage,
});

const detailLine = (e: IncomeEntry) => {
  const d = e.details || {};
  if (e.stream === 'parking') return `${d.plate}${d.vehicle ? ` · ${d.vehicle}` : ''} · ${d.owner_name}${d.owner_phone ? ` · ${d.owner_phone}` : ''}`;
  if (e.stream === 'bus_hire') return `${d.bus_reg} · ${d.hirer_name}${d.destination ? ` · ${d.destination}` : ''}${d.driver ? ` · driver ${d.driver}` : ''}`;
  if (e.stream === 'accommodation' && d.room_type) return `${d.guest_name || 'Guest'}${d.room ? ` · ${d.room}` : ''} · ${d.room_type} · ${String(d.plan).toUpperCase()} · ${d.nights} night(s)`;
  if (e.stream === 'hall_hire') return `${e.venue?.name || 'Hall'} · ${d.hirer_name}${d.hours ? ` · ${d.hours} h` : ''}`;
  return [e.quantity ? `${e.quantity} people` : null, e.description].filter(Boolean).join(' · ');
};

function IncomePage() {
  const auth = useAuth();
  const canRecord = auth.hasPermission('income.record');
  const canVoid = auth.hasPermission('bill.void');
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [stream, setStream] = useState<string | null>(null);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [page, setPage] = useState(1);
  const canPrice = auth.hasPermission('income.price');
  const canTap = canRecord && (!auth.hasRole('md', 'admin') || (auth.hasRole('admin') && !!getActing()));
  const [picked, setPicked] = useState<IncomeStream | null>(null);
  const [pricesOpen, setPricesOpen] = useState(false);
  const prices = useIncomePrices(undefined, canTap);
  const [voiding, setVoiding] = useState<IncomeEntry | null>(null);
  const [why, setWhy] = useState('');
  const query = useIncome({ page, limit: 30, stream: stream || undefined, from, to });
  const voidIt = useVoidIncome();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  const doVoid = async () => {
    if (!voiding) return;
    try {
      await voidIt.mutateAsync({ id: voiding.id, reason: why.trim() });
      notifications.show({ color: 'orange', title: 'Cancelled', message: voiding.entry_ref });
      setVoiding(null);
      setWhy('');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not cancel', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader
        title="Other income"
        subtitle="Pool, washrooms, playground, parking, bus hire and hall hire"
        actions={canPrice ? <Button variant="default" leftSection={<Settings2 size={16} />} onClick={() => setPricesOpen(true)}>Prices</Button> : undefined}
      />

      {canTap && (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" mb="md">
          {(Object.keys(STREAM_CARD) as IncomeStream[]).map((s) => {
            const c = STREAM_CARD[s];
            const Icon = c.icon;
            const price = s === 'other' || s === 'accommodation' ? null : prices.data?.find((x) => x.stream === s)?.price;
            return (
              <UnstyledButton key={s} onClick={() => setPicked(s)} style={{ background: c.bg, border: `1px solid ${c.color}33`, borderRadius: 12, padding: 14, minHeight: 96 }}>
                <Icon size={24} color={c.color} />
                <Text fw={700} size="sm" mt={6} style={{ color: c.color }}>{STREAM_LABEL[s]}</Text>
                <Text size="xs" c="dimmed">{s === 'accommodation' ? 'Room rates, per night' : s === 'other' ? 'Type the amount' : price ? `${formatCurrency(price)} per ${c.unit}` : 'Price not set'}</Text>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      )}

      {canRecord && <InHousePanel />}

      <Card withBorder radius="md" p="md" mb="md">
        <Text size="xs" c="dimmed">Total for the period</Text>
        <Text fw={800} fz={26} style={{ color: '#1F3A5F' }}>{formatCurrency(query.data?.total ?? 0)}</Text>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" mt="sm">
          {(query.data?.by_stream ?? []).map((s) => (
            <Text key={s.stream} size="xs" c="dimmed">{s.label}: <b style={{ color: '#343A40' }}>{formatCurrency(s.total)}</b></Text>
          ))}
        </SimpleGrid>
      </Card>

      <Group mb="md" gap="sm" wrap="wrap" align="flex-end">
        <Select
          label="Type"
          clearable
          placeholder="All"
          data={Object.entries(STREAM_LABEL).map(([value, label]) => ({ value, label }))}
          value={stream}
          onChange={(v) => { setStream(v); setPage(1); }}
          style={{ minWidth: 150 }}
        />
        <div>
          <Text size="sm" fw={500} mb={4}>From</Text>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 8px', border: '1px solid #CED4DA', borderRadius: 4 }} />
        </div>
        <div>
          <Text size="sm" fw={500} mb={4}>To</Text>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} style={{ height: 36, padding: '0 8px', border: '1px solid #CED4DA', borderRadius: 4 }} />
        </div>
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load income" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No income recorded" description="Money taken for the pool, parking, hire and the rest shows here." />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(e) => e.created_at}
          keyOf={(e) => e.id}
          gap="xs"
          render={(e) => (
            <Paper withBorder radius="md" p="sm" style={{ opacity: e.voided ? 0.55 : 1 }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Group gap={6}>
                    <Badge size="sm" variant="light">{e.stream_label}</Badge>
                    <Badge size="xs" variant="outline" color="gray">{e.method === 'mpesa' ? 'M-Pesa' : e.method}</Badge>
                    {groupLevel && e.property && <Badge size="xs" variant="outline" color="gray">{e.property.code}</Badge>}
                    {e.voided && <Badge size="xs" color="red" variant="light">Cancelled</Badge>}
                  </Group>
                  <Text size="sm" fw={600} lineClamp={2}>{detailLine(e) || e.entry_ref}</Text>
                  <Text size="xs" c="dimmed">
                    {e.entry_ref} · {dayjs(e.created_at).format('HH:mm')}{e.recorded_by ? ` · ${e.recorded_by.full_name}` : ''}
                    {e.transaction_ref ? ` · ${e.transaction_ref}` : ''}
                  </Text>
                  {e.voided && e.void_reason && <Text size="xs" c="red">Reason: {e.void_reason}</Text>}
                  {!e.voided && canVoid && (
                    <Button size="compact-xs" variant="subtle" color="red" w="fit-content" onClick={() => { setWhy(''); setVoiding(e); }}>Cancel entry</Button>
                  )}
                </Stack>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>{formatCurrency(e.amount)}</Text>
              </Group>
            </Paper>
          )}
        />
      )}

      {meta && meta.pages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination value={page} onChange={setPage} total={meta.pages} size="sm" siblings={0} />
        </Group>
      )}

      <IncomeModal opened={!!picked} stream={picked} onClose={() => setPicked(null)} />
      {canPrice && <PricesModal opened={pricesOpen} onClose={() => setPricesOpen(false)} groupLevel={groupLevel && auth.hasRole('md', 'admin')} />}

      <Modal opened={!!voiding} onClose={() => setVoiding(null)} title={voiding ? `Cancel ${voiding.entry_ref}?` : ''}>
        <Stack>
          <Text size="sm">Are you sure? This takes {voiding ? formatCurrency(voiding.amount) : ''} out of the income and the cash the person holds.</Text>
          <Textarea label="Reason" required autosize minRows={2} value={why} onChange={(e) => setWhy(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoiding(null)}>Back</Button>
            <Button color="red" disabled={why.trim().length < 3} loading={voidIt.isPending} onClick={doVoid}>Yes, cancel it</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
