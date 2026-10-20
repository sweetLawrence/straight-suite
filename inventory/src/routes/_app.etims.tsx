import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert, Badge, Box, Button, Card, Group, Loader, Pagination, SegmentedControl, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CheckCircle2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useEtims, useEtimsAction, useEtimsDevice } from '@/hooks/useFinance';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { EtimsDevice, EtimsInvoice } from '@/lib/api/finance';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/etims')({ component: EtimsPage });

const STATUS = {
  sent: { label: 'Accepted', color: '#2B8A3E', bg: '#EBFBEE' },
  pending: { label: 'Waiting', color: '#1971C2', bg: '#E7F5FF' },
  failed: { label: 'Failed', color: '#C92A2A', bg: '#FFF5F5' },
} as const;
const MODE = {
  off: { label: 'eTIMS off', color: '#868E96', bg: '#F1F3F5' },
  sandbox: { label: 'KRA sandbox (test)', color: '#E8590C', bg: '#FFF4E6' },
  live: { label: 'KRA live', color: '#2B8A3E', bg: '#EBFBEE' },
} as const;

/** Sales sent to KRA eTIMS, what failed, and the device set-up */
function EtimsPage() {
  const [status, setStatus] = useState<'all' | 'pending' | 'failed' | 'sent'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useEtims({ page, limit: 30, status: status === 'all' ? undefined : status, search: search.trim() || undefined });
  const device = useEtimsDevice();
  const s = q.data?.summary;
  const rows = q.data?.data ?? [];
  const mode = MODE[(s?.mode as keyof typeof MODE) || 'off'];

  return (
    <>
      <PageHeader title="eTIMS" subtitle="Every paid bill and event invoice is sent to KRA. Failures are retried every few minutes." />
      <Box maw={760}>
        <Group gap="xs" mb="sm">
          <Badge size="lg" style={{ color: mode.color, backgroundColor: mode.bg }}>{mode.label}</Badge>
          {q.isFetching && <Loader size="xs" />}
        </Group>
        {s?.mode === 'off' && (
          <Alert color="gray" variant="light" mb="md">
            Sales are queued but not sent. Set ETIMS_MODE=sandbox on the server to test with KRA, then live when certified.
          </Alert>
        )}

        <SimpleGrid cols={3} spacing="xs" mb="md">
          {(['sent', 'pending', 'failed'] as const).map((k) => (
            <Card key={k} withBorder radius="md" p="sm" style={{ background: STATUS[k].bg, borderColor: STATUS[k].bg }}>
              <Text size="xs" fw={600} style={{ color: STATUS[k].color }}>{STATUS[k].label}</Text>
              <Text fw={800} size="lg" style={{ color: STATUS[k].color }}>{s?.[k] ?? 0}</Text>
            </Card>
          ))}
        </SimpleGrid>

        {device.data && <DeviceSetup data={device.data} />}

        <Group gap="sm" mb="sm" wrap="wrap">
          <SegmentedControl
            value={status}
            onChange={(v) => { setStatus(v as typeof status); setPage(1); }}
            data={[{ value: 'all', label: 'All' }, { value: 'failed', label: 'Failed' }, { value: 'pending', label: 'Waiting' }, { value: 'sent', label: 'Accepted' }]}
          />
          <TextInput placeholder="Bill or invoice ref" leftSection={<Search size={14} />} value={search} onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }} w={200} />
        </Group>

        {q.isLoading ? (
          <Group justify="center" py="xl"><Loader /></Group>
        ) : q.error ? (
          <EmptyState title="Couldn't load eTIMS invoices" description={getErrorMessage(q.error)} />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing here" description="Paid bills and confirmed event invoices appear here." />
        ) : (
          <Stack gap="xs">
            {rows.map((r) => <InvoiceRow key={r.id} r={r} />)}
            {(q.data?.meta?.pages ?? 1) > 1 && <Pagination value={page} onChange={setPage} total={q.data?.meta?.pages ?? 1} size="sm" mt="xs" />}
          </Stack>
        )}
      </Box>
    </>
  );
}

function InvoiceRow({ r }: { r: EtimsInvoice }) {
  const auth = useAuth();
  const action = useEtimsAction();
  const st = STATUS[r.status];
  const to = r.source_type === 'bill' ? `/bills/${r.source_id}` : `/events/${r.source_id}`;
  const resend = async () => {
    try {
      const x = (await action.mutateAsync({ kind: 'resend', id: r.id })) as EtimsInvoice;
      notifications.show({ color: x.status === 'sent' ? 'green' : 'red', title: x.status === 'sent' ? 'Accepted by KRA' : 'Still failing', message: x.last_error || r.source_ref });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not resend', message: getErrorMessage(err) });
    }
  };
  return (
    <Card withBorder radius="md" p="sm">
      <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
        <Box style={{ minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            <Text size="sm" fw={700} component={Link} to={to} style={{ color: '#1971C2', textDecoration: 'none' }} truncate>{r.source_ref}</Text>
            <Badge size="xs" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            No. {r.invc_no} · {r.source_type === 'bill' ? 'Bill' : 'Event invoice'} · {formatDateTime(r.created_at)}
            {r.property ? ` · ${r.property.code}` : ''}
          </Text>
          {r.status === 'sent' ? (
            <Text size="xs" style={{ color: '#2B8A3E' }}>Receipt {r.rcpt_no} · {r.sdc_id}</Text>
          ) : r.last_error ? (
            <Text size="xs" style={{ color: '#C92A2A' }}>{r.last_error}{r.attempts ? ` (${r.attempts} tries)` : ''}</Text>
          ) : null}
        </Box>
        <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
          <Text size="sm" fw={700}>{formatCurrency(r.total)}</Text>
          <Text size="xs" c="dimmed">VAT {formatCurrency(r.tax_amount)}</Text>
          {r.status !== 'sent' && auth.hasPermission('etims.manage') && (
            <Button size="compact-xs" variant="light" leftSection={<RefreshCw size={12} />} loading={action.isPending} onClick={resend}>Resend</Button>
          )}
        </Stack>
      </Group>
    </Card>
  );
}

/** KRA PIN, branch and device serial per property; initialise once to get the device key */
function DeviceSetup({ data }: { data: EtimsDevice }) {
  const auth = useAuth();
  const can = auth.hasPermission('etims.manage');
  return (
    <Stack gap="xs" mb="md">
      {data.properties.map((p) => <DeviceCard key={p.id} p={p} can={can} mode={data.mode} />)}
    </Stack>
  );
}

function DeviceCard({ p, can, mode }: { p: EtimsDevice['properties'][number]; can: boolean; mode: EtimsDevice['mode'] }) {
  const action = useEtimsAction();
  const [pin, setPin] = useState(p.kra_pin || '');
  const [bhf, setBhf] = useState(p.bhf_id || '00');
  const [serial, setSerial] = useState(p.device_serial || '');
  useEffect(() => { setPin(p.kra_pin || ''); setBhf(p.bhf_id || '00'); setSerial(p.device_serial || ''); }, [p]);
  const dirty = pin !== (p.kra_pin || '') || bhf !== (p.bhf_id || '00') || serial !== (p.device_serial || '');

  const run = async (a: Parameters<typeof action.mutateAsync>[0], ok: string) => {
    try {
      await action.mutateAsync(a);
      notifications.show({ color: 'green', title: ok, message: p.name });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not done', message: getErrorMessage(err) });
    }
  };

  return (
    <Card withBorder radius="md" p="sm">
      <Group justify="space-between" mb={can ? 'xs' : 0}>
        <Group gap={6}>
          <ShieldCheck size={16} color="#1F3A5F" />
          <Text fw={700} size="sm">{p.name} device</Text>
        </Group>
        {p.initialised ? (
          <Badge leftSection={<CheckCircle2 size={11} />} style={{ color: '#2B8A3E', backgroundColor: '#EBFBEE' }}>Ready {p.sdc_id ? `· ${p.sdc_id}` : ''}</Badge>
        ) : (
          <Badge style={{ color: '#E8590C', backgroundColor: '#FFF4E6' }}>Not set up</Badge>
        )}
      </Group>
      {can ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <TextInput size="xs" label="KRA PIN" placeholder="P051234567X" value={pin} onChange={(e) => setPin(e.currentTarget.value.toUpperCase())} />
            <TextInput size="xs" label="Branch id" placeholder="00" value={bhf} onChange={(e) => setBhf(e.currentTarget.value)} />
            <TextInput size="xs" label="Device serial" placeholder="From KRA" value={serial} onChange={(e) => setSerial(e.currentTarget.value)} />
          </SimpleGrid>
          <Group gap="xs" mt="xs">
            <Button size="xs" variant="light" disabled={!dirty} loading={action.isPending}
              onClick={() => run({ kind: 'save', property_id: p.id, kra_pin: pin.trim() || undefined, bhf_id: bhf.trim() || undefined, device_serial: serial.trim() || undefined }, 'Saved')}>
              Save
            </Button>
            <Button size="xs" disabled={dirty || !p.kra_pin || !p.device_serial || mode === 'off'} loading={action.isPending}
              onClick={() => run({ kind: 'initialise', property_id: p.id }, 'Device initialised')}>
              {p.initialised ? 'Initialise again' : 'Initialise with KRA'}
            </Button>
          </Group>
        </>
      ) : (
        <Text size="xs" c="dimmed">PIN {p.kra_pin || '-'} · branch {p.bhf_id} · serial {p.device_serial || '-'}</Text>
      )}
    </Card>
  );
}
