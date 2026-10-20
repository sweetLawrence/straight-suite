import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Loader, Modal, NumberInput, ScrollArea, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Download, Pencil, Printer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useDaily, useEditSummary, useStore, useSummaryAction, useValue } from '@/hooks/useDaySummary';
import { useProperties } from '@/hooks/useCore';
import { downloadSummary, type FootRow, type SummaryRecord } from '@/lib/api/daySummary';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/day-summary')({
  component: DaySummaryPage,
});

const RED = '#dc2626';
const AMBER = '#f59e0b';
const GREEN = '#16a34a';
const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: AMBER },
  closed: { label: 'Closed', color: '#2563eb' },
  acknowledged: { label: 'Acknowledged', color: GREEN },
};
const m = (v: number | null | undefined) => (v == null ? '' : formatCurrency(v).replace('KES ', ''));
const when = (iso: string) => dayjs(iso).format('D MMM HH:mm');
const trading = () => dayjs().subtract(6, 'hour').format('YYYY-MM-DD');

function Dot({ color }: { color: string }) {
  return <span style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: color, display: 'inline-block' }} />;
}
function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fw={700} size="sm" c={color}>{m(value) || '0.00'}</Text>
    </div>
  );
}
function Line({ label, value, bold }: { label: string; value: number | null; bold?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" fw={bold ? 700 : 400}>{label}</Text>
      <Text size="sm" fw={bold ? 700 : 500}>{m(value) || '0.00'}</Text>
    </Group>
  );
}

function Foot({ rows }: { rows: FootRow[] }) {
  if (!rows.length) return null;
  return (
    <Card withBorder radius="md" p="sm">
      <Text fw={600} mb={6}>Shortages by person</Text>
      <ScrollArea>
        <Table withRowBorders fz="xs">
          <Table.Thead>
            <Table.Tr><Table.Th>Personnel</Table.Th><Table.Th>Department</Table.Th><Table.Th ta="right">B/F</Table.Th><Table.Th ta="right">Shortage</Table.Th><Table.Th ta="right">C/F</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.name}</Table.Td><Table.Td>{p.department}</Table.Td>
                <Table.Td ta="right">{m(p.brought_forward)}</Table.Td><Table.Td ta="right">{m(p.shortage)}</Table.Td><Table.Td ta="right">{m(p.carried_forward)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Card>
  );
}

function Signatures({ rec }: { rec: SummaryRecord }) {
  const items: [string, { name: string; at: string } | null][] = [['Cashier', rec.cashier_sign], ['Closed by', rec.closed_sign], ['Acknowledged', rec.ack_sign]];
  return (
    <Card withBorder radius="md" p="sm">
      <Stack gap={4}>
        {items.map(([l, s]) => (
          <Group key={l} justify="space-between" wrap="nowrap">
            <Group gap={8}><Dot color={s ? GREEN : '#adb5bd'} /><Text size="sm">{l}</Text></Group>
            <Text size="sm" c={s ? undefined : 'dimmed'}>{s ? `${s.name} · ${when(s.at)}` : 'Not yet'}</Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

function DaySummaryPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canEdit = auth.hasPermission('summary.edit');
  const canClose = auth.hasPermission('summary.close');
  const canAck = auth.hasPermission('summary.ack');
  const seesAll = canEdit || canAck || groupLevel;
  const me = auth.user?.id;
  const [date, setDate] = useState(trading());
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [tab, setTab] = useState('daily');
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [prep, setPrep] = useState('');
  const [extras, setExtras] = useState<{ label: string; amount: number }[]>([]);
  const properties = useProperties(1, 20);
  const pid = groupLevel ? propertyId || properties.data?.data?.[0]?.id || undefined : undefined;
  const p = { date, property_id: pid };
  const ready = !groupLevel || !!pid;
  const daily = useDaily(p, ready && tab === 'daily');
  const value = useValue(p, ready && tab === 'value' && seesAll);
  const store = useStore(p, ready && tab === 'store' && seesAll);
  const act = useSummaryAction();
  const edit = useEditSummary();

  const d = daily.data;
  const rec = (tab === 'value' ? value.data?.record : d?.record) ?? d?.record;
  const status = rec ? STATUS[rec.status] : null;
  const open = rec?.status === 'open';

  const run = async (action: 'sign-row' | 'sign-cashier' | 'close' | 'reopen' | 'acknowledge', ok: string) => {
    try {
      await act.mutateAsync({ ...p, action });
      notifications.show({ color: 'green', title: ok, message: dayjs(date).format('D MMM YYYY') });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not done', message: getErrorMessage(err) });
    }
  };
  const startEdit = () => {
    setNote(rec?.note ?? '');
    setPrep(rec?.prepared_by ?? '');
    setExtras(rec?.extras?.length ? rec.extras : []);
    setEditing(true);
  };
  const saveEdit = async () => {
    try {
      await edit.mutateAsync({ ...p, note: note.trim() || null, prepared_by: prep.trim() || null, extras: extras.filter((e) => e.label.trim() && e.amount) });
      setEditing(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not saved', message: getErrorMessage(err) });
    }
  };
  const layout = tab === 'value' ? 'value' : tab === 'store' ? 'store' : 'daily';
  const printUrl = `/summary-print?layout=${layout}&date=${date}${pid ? `&property_id=${pid}` : ''}`;
  const mine = d?.rows.filter((r) => r.person.id === me) ?? [];
  const iSigned = !!rec?.signs?.[me ?? ''];

  return (
    <Stack gap="md">
      <PageHeader
        title="Daily summary"
        subtitle={d?.property ? `${d.property.name} · ${dayjs(date).format('dddd D MMMM YYYY')}` : 'The signed summary of the day'}
        actions={status ? <Badge variant="light" color={status.color} leftSection={<Dot color={status.color} />}>{status.label}</Badge> : undefined}
      />
      <Group grow align="flex-end">
        <TextInput type="date" label="Day" value={date} max={trading()} onChange={(e) => setDate(e.currentTarget.value || trading())} />
        {groupLevel && (
          <Select label="Property" styles={{ input: { fontWeight: 700, color: '#1F3A5F', borderColor: '#1F3A5F', borderWidth: 2 } }} value={pid ?? null} onChange={setPropertyId} allowDeselect={false}
            data={(properties.data?.data ?? []).map((x) => ({ value: x.id, label: x.name }))} />
        )}
      </Group>
      {seesAll && (
        <SegmentedControl fullWidth value={tab} onChange={setTab} data={[{ value: 'daily', label: 'Daily' }, { value: 'value', label: 'Stock value' }, { value: 'store', label: 'Kitchen store' }]} />
      )}
      {seesAll && (
        <Group gap="xs">
          <Button size="xs" variant="default" leftSection={<Printer size={14} />} onClick={() => openPrint(printUrl, 'Daily summary')}>Print</Button>
          <Button size="xs" variant="default" leftSection={<Download size={14} />} onClick={() => downloadSummary(layout, p).catch((err) => notifications.show({ color: 'red', title: 'Download failed', message: getErrorMessage(err) }))}>Excel</Button>
          {canEdit && open && tab !== 'store' && <Button size="xs" variant="default" leftSection={<Pencil size={14} />} onClick={startEdit}>Note and extras</Button>}
        </Group>
      )}

      {tab === 'daily' && (
        <>
          {daily.isLoading && <Loader size="sm" />}
          {d && (
            <>
              {seesAll && <Card withBorder radius="md" p="md">
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Stat label="Expected" value={d.totals.expected} />
                  <Stat label="Declared" value={d.totals.declared} />
                  <Stat label="M-Pesa" value={d.totals.mpesa} />
                  <Stat label="Cash" value={d.totals.cash} />
                  <Stat label="Card / other" value={d.totals.card} />
                  <Stat label="Signed bills" value={d.totals.signed} />
                  <Stat label="Not in yet" value={d.totals.outstanding} color={d.totals.outstanding > 0 ? RED : undefined} />
                </SimpleGrid>
              </Card>}

              {open && mine.length > 0 && !iSigned && (
                <Button color="#0f766e" onClick={() => run('sign-row', 'Signed')} loading={act.isPending}>Sign my row for {dayjs(date).format('D MMM')}</Button>
              )}

              {d.rows.length === 0 && <EmptyState title="No money moved" description="Nothing recorded for this day." />}
              {d.rows.map((r) => {
                const sig = rec?.signs?.[r.person.id];
                return (
                  <Card key={r.key} withBorder radius="md" p="sm">
                    <Group justify="space-between" mb={6} wrap="nowrap">
                      <div>
                        <Group gap={8} wrap="nowrap"><Dot color={r.outstanding > 0 ? RED : GREEN} /><Text fw={600}>{r.person.name}</Text></Group>
                        <Text size="xs" c="dimmed">{r.account}</Text>
                      </div>
                      <Text size="xs" c={sig ? GREEN : 'dimmed'}>{sig ? `Signed ${dayjs(sig.at).format('HH:mm')}` : 'Not signed'}</Text>
                    </Group>
                    <SimpleGrid cols={{ base: 3, sm: 7 }} spacing="xs">
                      <Stat label="Expected" value={r.expected} />
                      <Stat label="Declared" value={r.declared} />
                      <Stat label="M-Pesa" value={r.mpesa} />
                      <Stat label="Cash" value={r.cash} />
                      <Stat label="Card / other" value={r.card} />
                      <Stat label="Signed bill" value={r.signed} />
                      <Stat label="Not in yet" value={r.outstanding} color={r.outstanding > 0 ? RED : undefined} />
                    </SimpleGrid>
                  </Card>
                );
              })}

              {d.cashier && (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Card withBorder radius="md" p="sm">
                    <Text fw={600} mb={6}>Cashier</Text>
                    <Stack gap={4}>
                      <Line label="Cash brought forward" value={d.cashier.brought_forward} />
                      <Line label="Cash collection for the day" value={d.cashier.collection} />
                      <Line label="Total" value={d.cashier.total} bold />
                      <Line label="Expenses" value={d.cashier.expenses} />
                      <Line label="Cash transferred to MD" value={d.cashier.to_md} />
                      <Line label="Cash carried forward" value={d.cashier.carried_forward} bold />
                    </Stack>
                  </Card>
                  <Card withBorder radius="md" p="sm">
                    <Text fw={600} mb={6}>Paybill and bills</Text>
                    <Stack gap={4}>
                      <Line label="Total paybill amount" value={d.paybill} />
                      <Line label="Signed bills" value={d.signed_bills} />
                      <Line label="Unsigned bills" value={d.unsigned_bills} />
                      {d.stock && <Line label="Bar stock value" value={d.stock.bar_value} />}
                      {d.stock && <Line label="Store stock value" value={d.stock.store_value} />}
                    </Stack>
                  </Card>
                </SimpleGrid>
              )}
              {d.record.note && <Card withBorder radius="md" p="sm"><Text size="sm"><b>NB:</b> {d.record.note}</Text></Card>}
              <Foot rows={d.footnote} />
              {seesAll && <Signatures rec={d.record} />}
              <Group>
                {open && canEdit && !d.record.cashier_sign && <Button variant="default" onClick={() => run('sign-cashier', 'Signed as cashier')}>Sign as cashier</Button>}
                {open && canClose && <Button color="#0f766e" onClick={() => run('close', 'Day closed')}>Close and sign off</Button>}
                {rec?.status === 'closed' && canClose && <Button variant="default" onClick={() => run('reopen', 'Reopened')}>Reopen</Button>}
                {rec?.status === 'closed' && canAck && <Button color="#0f766e" onClick={() => run('acknowledge', 'Acknowledged')}>Acknowledge</Button>}
              </Group>
            </>
          )}
        </>
      )}

      {tab === 'value' && (
        <>
          {value.isLoading && <Loader size="sm" />}
          {value.data && (
            <>
              <Card withBorder radius="md" p="sm">
                <ScrollArea>
                  <Table withRowBorders fz="xs">
                    <Table.Thead>
                      <Table.Tr><Table.Th>Particulars</Table.Th><Table.Th ta="right">Opening</Table.Th><Table.Th ta="right">Addition</Table.Th><Table.Th ta="right">Total</Table.Th><Table.Th ta="right">Closing</Table.Th><Table.Th ta="right">Sales</Table.Th></Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {value.data.lines.map((l) => (
                        <Table.Tr key={l.label}>
                          <Table.Td>{l.label}</Table.Td><Table.Td ta="right">{m(l.opening)}</Table.Td><Table.Td ta="right">{m(l.addition)}</Table.Td>
                          <Table.Td ta="right">{m(l.total)}</Table.Td><Table.Td ta="right">{m(l.closing)}</Table.Td><Table.Td ta="right">{m(l.sales)}</Table.Td>
                        </Table.Tr>
                      ))}
                      <Table.Tr><Table.Td fw={700}>Total</Table.Td><Table.Td /><Table.Td /><Table.Td /><Table.Td /><Table.Td ta="right" fw={700}>{m(value.data.total_sales)}</Table.Td></Table.Tr>
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
                <Text size="xs" c="dimmed" mt={6}>Store and bar are valued at the selling price (P/U). Items without a selling price are not valued.</Text>
              </Card>
              <Card withBorder radius="md" p="sm">
                <Text fw={600} mb={6}>Approved cash distribution</Text>
                <Stack gap={4}>
                  {value.data.distribution.map((x) => <Line key={x.label} label={x.label} value={x.amount} />)}
                  <Line label="Total" value={value.data.distribution_total} bold />
                </Stack>
              </Card>
              <Card withBorder radius="md" p="sm">
                <Text fw={600} mb={6}>Production and expenses</Text>
                <Stack gap={4}>
                  {value.data.expenses.map((x) => <Line key={x.label} label={x.label} value={x.amount} />)}
                  <Line label="Total" value={value.data.expenses_total} bold />
                </Stack>
              </Card>
              <Card withBorder radius="md" p="sm">
                <Stack gap={4}>
                  <Line label="Amount expected from cashier" value={value.data.expected_from_cashier} bold />
                  {value.data.shortages.map((s) => <Line key={s.name} label={`${s.name} not in / short`} value={s.amount} />)}
                  <Line label="Amount availed by cashier" value={value.data.availed_by_cashier} bold />
                  <Line label="Cash in hand per the system" value={value.data.cash_in_hand_per_system} />
                  <Line label="Difference" value={value.data.difference} bold />
                </Stack>
              </Card>
              <Foot rows={value.data.footnote} />
            </>
          )}
        </>
      )}

      {tab === 'store' && (
        <>
          {store.isLoading && <Loader size="sm" />}
          {store.data && store.data.items.length === 0 && <EmptyState title="No store items moved" description="Nothing in the food store for this day." />}
          {store.data && store.data.items.length > 0 && (
            <Card withBorder radius="md" p="sm">
              <ScrollArea>
                <Table withRowBorders fz="xs" miw={720}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th><Table.Th>Particulars</Table.Th><Table.Th ta="right">Opening</Table.Th><Table.Th ta="right">Addition</Table.Th><Table.Th ta="right">Total</Table.Th>
                      <Table.Th ta="right">Closing</Table.Th><Table.Th ta="right">Sale</Table.Th><Table.Th ta="right">P/U</Table.Th><Table.Th ta="right">Sales value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {store.data.items.map((i, k) => (
                      <Table.Tr key={i.name + k}>
                        <Table.Td>{k + 1}</Table.Td><Table.Td>{i.name}</Table.Td><Table.Td ta="right">{i.opening}</Table.Td><Table.Td ta="right">{i.received}</Table.Td>
                        <Table.Td ta="right">{i.total}</Table.Td><Table.Td ta="right">{i.closing}</Table.Td><Table.Td ta="right">{i.used}</Table.Td>
                        <Table.Td ta="right">{i.price == null ? '-' : m(i.price)}</Table.Td><Table.Td ta="right">{m(i.v_used)}</Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr><Table.Td /><Table.Td fw={700}>Total value</Table.Td><Table.Td ta="right">{m(store.data.totals.opening)}</Table.Td><Table.Td ta="right">{m(store.data.totals.received)}</Table.Td>
                      <Table.Td ta="right">{m(store.data.totals.total)}</Table.Td><Table.Td ta="right">{m(store.data.totals.closing)}</Table.Td><Table.Td /><Table.Td /><Table.Td ta="right" fw={700}>{m(store.data.totals.used)}</Table.Td></Table.Tr>
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Card>
          )}
        </>
      )}

      <Modal opened={editing} onClose={() => setEditing(false)} title="Note and extra lines" centered>
        <Stack gap="sm">
          <TextInput label="Prepared by" value={prep} onChange={(e) => setPrep(e.currentTarget.value)} />
          <Textarea label="Note (NB)" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} maxLength={500} />
          <Text size="sm" fw={600}>Extra lines on the stock-value summary</Text>
          <Text size="xs" c="dimmed">For example value added on chips, or profit on a dish sold above its price.</Text>
          {extras.map((e, i) => (
            <Group key={i} grow wrap="nowrap" align="flex-end">
              <TextInput placeholder="What" value={e.label} onChange={(ev) => setExtras(extras.map((x, k) => (k === i ? { ...x, label: ev.currentTarget.value } : x)))} />
              <NumberInput placeholder="Amount" value={e.amount} decimalScale={2} onChange={(v) => setExtras(extras.map((x, k) => (k === i ? { ...x, amount: Number(v) || 0 } : x)))} />
            </Group>
          ))}
          {extras.length < 10 && <Button variant="default" size="xs" onClick={() => setExtras([...extras, { label: '', amount: 0 }])}>Add a line</Button>}
          <Button color="#0f766e" onClick={saveEdit} loading={edit.isPending}>Save</Button>
        </Stack>
      </Modal>
    </Stack>
  );
}

