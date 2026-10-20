import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Button, Card, Divider, Group, Menu, Modal, NumberInput, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { ArrowLeft, Banknote, CalendarDays, Check, ChevronDown, FileText, Mail, MapPin, Pencil, Phone, Printer, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { EVENT_STATUS } from '@/components/events/eventStatus';
import { useEvent, useEventAction } from '@/hooks/useEvents';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { emailEventInvoice, type EventItem } from '@/lib/api/events';
import { formatCurrency } from '@/lib/utils/format';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/events/$id')({ component: EventPage });

const C = { navy: '#1F3A5F', line: '#F1F3F5', green: '#2B8A3E', orange: '#E8590C', red: '#C92A2A' };
const q3 = (v: number) => v.toLocaleString('en-KE', { maximumFractionDigits: 3 });
const METHODS = [
  { value: 'mpesa', label: 'M-Pesa' }, { value: 'bank', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' }, { value: 'card', label: 'Card' }, { value: 'other', label: 'Other' },
];

function EventPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const q = useEvent(id);
  const act = useEventAction(id);
  const [paying, setPaying] = useState(false);
  const [pay, setPay] = useState({ amount: 0, method: 'mpesa', reference: '' });
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [moving, setMoving] = useState<{ kind: 'issue' | 'return'; line: EventItem['stock'][number] } | null>(null);
  const [qty, setQty] = useState(0);

  if (q.isLoading) return <LoadingState />;
  if (q.error || !q.data) return <EmptyState title="Event not found" />;
  const e = q.data;
  const st = EVENT_STATUS[e.status];
  const canManage = auth.hasPermission('event.manage') && !auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canStock = auth.hasPermission('stock.bulk_issue') && ['quote', 'confirmed'].includes(e.status);
  const live = !['completed', 'cancelled'].includes(e.status);

  const run = async (a: Parameters<typeof act.mutateAsync>[0], ok: string) => {
    try {
      await act.mutateAsync(a);
      notifications.show({ color: 'green', title: ok, message: e.title });
      return true;
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
      return false;
    }
  };
  const email = async () => {
    try {
      const r = await emailEventInvoice(e.id);
      notifications.show({
        color: r.sent ? 'green' : 'orange',
        title: r.sent ? 'Invoice emailed' : 'Not emailed',
        message: r.sent ? `To ${r.to}` : r.configured ? r.reason || 'Not sent' : 'Email is not set up on the server yet (SMTP).',
      });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not email', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <Button component={Link} to="/events" variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">Events</Button>
      <PageHeader title={e.title} subtitle={`${e.invoice_ref ? `Invoice ${e.invoice_ref}` : 'Quote'} · ${e.event_ref}${e.property ? ` · ${e.property.code}` : ''}`} />
      <Group gap={6} mb="md" mt={-6}>
        <StatusDot color={st.color} />
        <Text size="sm" fw={600} style={{ color: st.color }}>{st.label}</Text>
        {e.reminded_at && <Text size="xs" c="dimmed">· team reminded {dayjs(e.reminded_at).format('D MMM HH:mm')}</Text>}
      </Group>

      <Group gap="xs" mb="md" wrap="wrap">
        {canManage && e.status === 'quote' && <Button color="green" leftSection={<Check size={16} />} loading={act.isPending} onClick={() => run({ kind: 'confirm' }, 'Booked, invoice issued')}>Confirm and issue invoice</Button>}
        {canManage && e.status === 'confirmed' && e.balance > 0 && <Button leftSection={<Banknote size={16} />} onClick={() => { setPay({ amount: e.balance, method: 'mpesa', reference: '' }); setPaying(true); }}>Record payment</Button>}
        <Button variant="default" leftSection={<Printer size={16} />} onClick={() => openPrint(`/event-invoice/${e.id}`, e.invoice_ref ? 'Invoice' : 'Quote')}>{e.invoice_ref ? 'Invoice' : 'Quote'}</Button>
        {canManage && (
          <Menu position="bottom-end">
            <Menu.Target><Button variant="default" rightSection={<ChevronDown size={14} />}>More</Button></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<Mail size={14} />} onClick={email} disabled={!e.client.email}>Email to client</Menu.Item>
              {live && <Menu.Item leftSection={<Pencil size={14} />} component={Link} to={`/events/edit/${e.id}`}>Edit</Menu.Item>}
              {e.status === 'confirmed' && <Menu.Item leftSection={<Check size={14} />} onClick={() => run({ kind: 'complete' }, 'Marked done')}>Mark as done</Menu.Item>}
              {live && <Menu.Item color="red" leftSection={<X size={14} />} onClick={() => { setReason(''); setCancelling(true); }}>Cancel event</Menu.Item>}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
        <Card withBorder radius="md" p="md">
          <Stack gap={6}>
            <Row icon={<CalendarDays size={14} />} text={`${dayjs(e.start_at).format('dddd D MMM YYYY, HH:mm')}`} />
            {e.venue && <Row icon={<MapPin size={14} />} text={e.venue} />}
            <Row icon={<Users size={14} />} text={`${e.guests} guests · ${e.event_type}`} />
            <Divider my={4} />
            <Text size="sm" fw={700}>{e.client.name}</Text>
            {e.client.phone && <Row icon={<Phone size={14} />} text={e.client.phone} />}
            {e.client.email && <Row icon={<Mail size={14} />} text={e.client.email} />}
            {e.client.kra_pin && <Row icon={<FileText size={14} />} text={`KRA PIN ${e.client.kra_pin}`} />}
          </Stack>
        </Card>
        <Card withBorder radius="md" p="md">
          <Money label={`${e.guests} × ${formatCurrency(e.price_per_person)}`} value={e.guests * e.price_per_person} />
          {e.goat_plan !== 'none' && e.goat_total > 0 && (
            <Money label={`${e.goat_plan === 'own' ? 'Own goat fee' : 'Full goat'} × ${e.goat_count}`} value={e.goat_total} />
          )}
          {e.extras.map((x) => <Money key={x.id} label={`${x.description}${x.quantity !== 1 ? ` × ${x.quantity}` : ''}`} value={x.line_total} />)}
          <Divider my={6} />
          <Money label="Subtotal" value={e.subtotal} />
          {e.vat_enabled && <Money label={`VAT ${e.vat_rate}%`} value={e.vat_amount} />}
          <Money label="Total" value={e.total} strong />
          <Money label="Paid" value={e.paid} color={C.green} />
          <Money label="Balance" value={e.balance} strong color={e.balance > 0 ? C.orange : C.green} />
          {e.status === 'completed' && (
            <>
              <Divider my={6} />
              <Money label="Stock used (cost)" value={e.stock_cost} />
              {e.goat_cost > 0 && <Money label="Goat bought (cost)" value={e.goat_cost} />}
              <Money label="Profit before staff and overheads" value={e.profit} strong color={e.profit >= 0 ? C.green : C.red} />
            </>
          )}
        </Card>
      </SimpleGrid>

      {e.menu.length > 0 && (
        <Card withBorder radius="md" p="md" mb="md">
          <Text fw={600} size="sm" mb={6}>Menu</Text>
          {e.menu.map((m) => <Text key={m.id} size="sm">• {m.description}</Text>)}
        </Card>
      )}

      <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
        <Group justify="space-between" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
          <Text fw={600} size="sm">Stock for the event</Text>
          <Text size="xs" c="dimmed">{formatCurrency(e.stock_cost)} used</Text>
        </Group>
        {e.stock.length === 0 ? <Text size="sm" c="dimmed" p="md">Nothing planned. Edit the event to add what the store should set aside.</Text> : e.stock.map((s) => (
          <Group key={s.id} justify="space-between" wrap="nowrap" gap="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>{s.name}</Text>
              <Text size="xs" c="dimmed">
                Planned {q3(s.planned_qty)} · issued {q3(s.issued_qty)}{s.returned_qty ? ` · back ${q3(s.returned_qty)}` : ''} {s.unit || ''}
              </Text>
            </Box>
            {canStock && (
              <Group gap={4} wrap="nowrap">
                <Button size="compact-xs" onClick={() => { setQty(Math.max(0, s.planned_qty - s.issued_qty)); setMoving({ kind: 'issue', line: s }); }}>Issue</Button>
                {s.issued_qty - s.returned_qty > 0 && <Button size="compact-xs" variant="light" onClick={() => { setQty(0); setMoving({ kind: 'return', line: s }); }}>Back</Button>}
              </Group>
            )}
          </Group>
        ))}
      </Card>

      {e.payments.length > 0 && (
        <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
          <Text fw={600} size="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>Payments</Text>
          {e.payments.map((p) => (
            <Group key={p.id} justify="space-between" wrap="nowrap" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Box>
                <Text size="sm" fw={600}>{METHODS.find((m) => m.value === p.method)?.label || p.method}{p.reference ? ` · ${p.reference}` : ''}</Text>
                <Text size="xs" c="dimmed">{dayjs(p.paid_at).format('D MMM YYYY')}{p.received_by ? ` · ${p.received_by}` : ''}</Text>
              </Box>
              <Text fw={700} style={{ color: C.green }}>{formatCurrency(p.amount)}</Text>
            </Group>
          ))}
        </Card>
      )}
      {e.cancel_reason && <Text size="sm" c="dimmed">Cancelled: {e.cancel_reason}</Text>}

      <Modal opened={paying} onClose={() => setPaying(false)} title="Record payment">
        <Stack>
          <Text size="sm" c="dimmed">Balance {formatCurrency(e.balance)}. A deposit can be any part of it.</Text>
          <NumberInput label="Amount" min={0} max={e.balance} thousandSeparator="," prefix="KES " value={pay.amount} onChange={(v) => setPay((p) => ({ ...p, amount: Number(v) || 0 }))} />
          <Select label="How" data={METHODS} value={pay.method} onChange={(v) => setPay((p) => ({ ...p, method: v || 'mpesa' }))} />
          <TextInput label="Reference" placeholder="M-Pesa code, bank ref or cheque no." value={pay.reference} onChange={(ev) => { const r = ev.currentTarget.value; setPay((p) => ({ ...p, reference: r })); }} />
          <Button disabled={!(pay.amount > 0) || pay.amount > e.balance + 0.009} loading={act.isPending}
            onClick={async () => { if (await run({ kind: 'payment', amount: pay.amount, method: pay.method, reference: pay.reference || undefined }, 'Payment recorded')) setPaying(false); }}>
            Record {pay.amount > 0 ? formatCurrency(pay.amount) : ''}
          </Button>
        </Stack>
      </Modal>

      <Modal opened={!!moving} onClose={() => setMoving(null)} title={moving ? `${moving.kind === 'issue' ? 'Issue' : 'Back from the event'}: ${moving.line.name}` : ''}>
        {moving && (
          <Stack>
            <Text size="sm" c="dimmed">
              {moving.kind === 'issue'
                ? `Planned ${q3(moving.line.planned_qty)}, issued so far ${q3(moving.line.issued_qty)}. Taken from the batches that expire first.`
                : `${q3(moving.line.issued_qty - moving.line.returned_qty)} ${moving.line.unit || ''} is out at the event.`}
            </Text>
            <NumberInput label={moving.kind === 'issue' ? 'Issue now' : 'Came back'} min={0} decimalScale={3} value={qty} onChange={(v) => setQty(Number(v) || 0)} />
            <Button disabled={!(qty > 0)} loading={act.isPending}
              onClick={async () => { if (await run({ kind: moving.kind, lineId: moving.line.id, quantity: qty }, moving.kind === 'issue' ? 'Issued' : 'Back in stock')) setMoving(null); }}>
              Save
            </Button>
          </Stack>
        )}
      </Modal>

      <Modal opened={cancelling} onClose={() => setCancelling(false)} title={`Cancel ${e.title}`}>
        <Stack>
          <TextInput label="Reason" value={reason} onChange={(ev) => setReason(ev.currentTarget.value)} />
          <Button color="red" disabled={reason.trim().length < 3} loading={act.isPending}
            onClick={async () => { if (await run({ kind: 'cancel', reason: reason.trim() }, 'Cancelled')) setCancelling(false); }}>
            Cancel event
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box style={{ color: '#868E96', display: 'flex' }}>{icon}</Box>
      <Text size="sm">{text}</Text>
    </Group>
  );
}

function Money({ label, value, strong, color }: { label: string; value: number; strong?: boolean; color?: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={3}>
      <Text size="sm" c={strong ? undefined : 'dimmed'} fw={strong ? 700 : 400}>{label}</Text>
      <Text size="sm" fw={strong ? 800 : 600} style={{ color: color || (strong ? C.navy : undefined), whiteSpace: 'nowrap' }}>{formatCurrency(value)}</Text>
    </Group>
  );
}
