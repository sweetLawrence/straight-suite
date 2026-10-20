import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Loader, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useConfirmIncomeDrop, useHandIn, useIncomeDrops, useMyIncome, useRejectIncomeDrop } from '@/hooks/useIncomeDrops';
import { type IncomeDrop } from '@/lib/api/incomeDrops';
import { useAuth } from '@/lib/auth/useAuth';
import { getActing } from '@/lib/auth/acting';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/income-handin')({
  component: HandIn,
});

const METHOD: Record<string, string> = { cash: 'Cash', mpesa: 'M-Pesa', card: 'Card', cheque: 'Cheque', other: 'Other' };
const COLOR: Record<string, string> = { pending: '#f59e0b', verified: '#16a34a', disputed: '#dc2626' };
const WORD: Record<string, string> = { pending: 'Waiting', verified: 'Received', disputed: 'Refused' };

const methods = (m: Record<string, number>) =>
  Object.entries(m).map(([k, v]) => `${METHOD[k] || k} ${formatCurrency(v)}`).join(' · ');

function HandIn() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin') && !getActing();
  const canCollect = auth.hasPermission('income.record') && !groupLevel;
  const canReceive = auth.hasPermission('cash.drop.verify') && !groupLevel;
  const mine = useMyIncome(canCollect);
  const waiting = useIncomeDrops('pending', canReceive);
  const send = useHandIn();
  const confirm = useConfirmIncomeDrop();
  const reject = useRejectIncomeDrop();
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState<IncomeDrop | null>(null);
  const [counted, setCounted] = useState<number | string>('');
  const [why, setWhy] = useState('');
  const [refusing, setRefusing] = useState(false);

  const my = mine.data;
  const myId = auth.user?.id;
  const toConfirm = (waiting.data ?? []).filter(d => d.collector?.id !== myId);

  const doHandIn = async () => {
    try {
      const d = await send.mutateAsync({ notes: notes.trim() || undefined });
      notifications.show({ color: 'green', title: 'Handed in', message: `${d.drop_ref} · ${formatCurrency(d.expected_amount)} waiting for the cashier to count` });
      setNotes('');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not hand in', message: getErrorMessage(err) });
    }
  };

  const close = () => { setOpen(null); setCounted(''); setWhy(''); setRefusing(false); };
  const short = open && counted !== '' ? Math.max(0, open.expected_amount - Number(counted)) : 0;

  const decide = async () => {
    if (!open) return;
    try {
      if (refusing) await reject.mutateAsync({ id: open.id, reason: why.trim() });
      else await confirm.mutateAsync({ id: open.id, received_amount: counted === '' ? open.expected_amount : Number(counted), reason: why.trim() || undefined });
      notifications.show({ color: refusing ? 'orange' : 'green', title: refusing ? 'Refused' : 'Received', message: open.drop_ref });
      close();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not done', message: getErrorMessage(err) });
    }
  };

  return (
    <Stack gap="md">
      <PageHeader title="Hand in money" subtitle="Pool, parking, hire and other income: hand it to the cashier, any method" />

      {canCollect && (
        <Card withBorder radius="md" p="md">
          {mine.isLoading ? <Loader size="sm" /> : (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">You are holding, not yet handed in</Text>
              <Text fw={700} fz={28}>{formatCurrency(my?.total ?? 0)}</Text>
              {my && my.total > 0 && <Text size="sm">{methods(my.by_method)} · {my.entries.length} entries</Text>}
              {my && my.total > 0 ? (
                <>
                  <Textarea placeholder="Note for the cashier (optional)" value={notes} onChange={e => setNotes(e.currentTarget.value)} autosize minRows={1} />
                  <Button color="#0f766e" onClick={doHandIn} loading={send.isPending} size="md">Hand in {formatCurrency(my.total)} to the cashier</Button>
                </>
              ) : <Text size="sm" c="dimmed">Nothing to hand in.</Text>}
            </Stack>
          )}
        </Card>
      )}

      {canReceive && (
        <Stack gap="xs">
          <Text fw={600}>Waiting for you to count ({toConfirm.length})</Text>
          {toConfirm.length === 0 && <Text size="sm" c="dimmed">None waiting.</Text>}
          {toConfirm.map(d => (
            <Card key={d.id} withBorder radius="md" p="sm">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text fw={600}>{d.collector?.full_name}</Text>
                  <Text size="xs" c="dimmed">{d.drop_ref} · {dayjs(d.created_at).format('D MMM HH:mm')}</Text>
                  <Text size="sm">{methods(d.by_method)}</Text>
                </div>
                <Stack gap={4} align="flex-end">
                  <Text fw={700}>{formatCurrency(d.expected_amount)}</Text>
                  <Button size="xs" color="#0f766e" onClick={() => { setOpen(d); setCounted(d.expected_amount); }}>Count</Button>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {canCollect && (
        <Stack gap="xs">
          <Text fw={600}>Your recent hand-ins</Text>
          {(my?.drops ?? []).length === 0 && !mine.isLoading && <EmptyState title="No hand-ins yet" description="Record income, then hand it in here." />}
          {(my?.drops ?? []).map(d => (
            <Card key={d.id} withBorder radius="md" p="sm">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="sm" fw={600}>{d.drop_ref}</Text>
                  <Text size="xs" c="dimmed">{dayjs(d.created_at).format('D MMM HH:mm')}{d.receiver ? ` · ${d.receiver.full_name}` : ''}</Text>
                  {d.short > 0 && <Text size="xs" c="#dc2626">Short {formatCurrency(d.short)} (counted {formatCurrency(d.received_amount ?? 0)})</Text>}
                  {d.status === 'disputed' && <Text size="xs" c="#dc2626">Refused: the money is back on you, hand in again</Text>}
                </div>
                <Stack gap={4} align="flex-end">
                  <Text fw={700}>{formatCurrency(d.expected_amount)}</Text>
                  <Badge color={COLOR[d.status]} variant="light">{WORD[d.status]}</Badge>
                </Stack>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={!!open} onClose={close} title={open ? `Count ${open.drop_ref}` : ''} fullScreen={false} centered>
        {open && (
          <Stack gap="sm">
            <Text size="sm">{open.collector?.full_name} says: <b>{formatCurrency(open.expected_amount)}</b></Text>
            <Text size="xs" c="dimmed">{methods(open.by_method)}</Text>
            {open.notes && <Text size="xs">Note: {open.notes}</Text>}
            {!refusing && (
              <NumberInput label="Amount you received" value={counted} onChange={setCounted} min={0} max={open.expected_amount} decimalScale={2} thousandSeparator="," inputMode="decimal" />
            )}
            {!refusing && short > 0 && <Text size="sm" c="#dc2626">Short by {formatCurrency(short)}: it is recorded against {open.collector?.full_name}</Text>}
            {(refusing || short > 0) && (
              <Textarea label={refusing ? 'Why are you refusing it?' : 'Why is it short?'} value={why} onChange={e => setWhy(e.currentTarget.value)} autosize minRows={2} />
            )}
            <Group grow>
              <Button color="#0f766e" onClick={decide} loading={confirm.isPending || reject.isPending} disabled={(refusing || short > 0) && why.trim().length < 3}>
                {refusing ? 'Refuse' : 'Confirm received'}
              </Button>
              <Button variant="default" onClick={() => setRefusing(v => !v)}>{refusing ? 'Back' : 'Refuse'}</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
