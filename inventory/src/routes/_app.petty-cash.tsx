import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Loader, Modal, Pagination, Paper, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Package, Plus, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { DayGroupedList } from '@/components/DayGroupedList';
import { PettyCashModal } from '@/components/cashier/PettyCashModal';
import { C } from '@/components/cashier/CashParts';
import { useCashierSummary, useDecidePettyCash, usePettyCash } from '@/hooks/useCashier';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/petty-cash')({
  component: PettyCashPage,
});

type Show = 'all' | 'expense' | 'stock';

function PettyCashPage() {
  const auth = useAuth();
  const canRecord = auth.hasPermission('petty_cash.record') && !auth.hasRole('md', 'admin');
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const canAuthorise = auth.hasPermission('petty_cash.authorise');
  const decide = useDecidePettyCash();
  const [confirm, setConfirm] = useState<{ id: string; ref: string; amount: number; reject: boolean } | null>(null);
  const [why, setWhy] = useState('');
  const submitDecision = async () => {
    if (!confirm) return;
    try {
      await decide.mutateAsync({ id: confirm.id, decision: confirm.reject ? 'reject' : 'authorise', note: why.trim() });
      notifications.show({ color: confirm.reject ? 'orange' : 'green', title: confirm.reject ? 'Rejected' : 'Authorised', message: confirm.ref });
      setConfirm(null);
      setWhy('');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };
  const query = usePettyCash({ page, limit: 30, kind: show === 'all' ? undefined : show });
  // Only needed to cap what the cashier can pay out
  const mine = useCashierSummary({}, canRecord);

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader
        title="Petty cash"
        subtitle="Small payments out of the cash the cashier holds"
        actions={
          canRecord ? (
            <Button leftSection={<Plus size={16} />} onClick={() => setOpen(true)}>
              Pay petty cash
            </Button>
          ) : undefined
        }
      />

      <Card withBorder radius="md" p="md" mb="md">
        <Text size="xs" c="dimmed">
          Total {show === 'all' ? '' : show === 'stock' ? 'stock bought' : 'expenses'}
        </Text>
        <Text fw={800} fz={24} style={{ color: C.navy }}>
          {formatCurrency(query.data?.total_amount ?? 0)}
        </Text>
      </Card>

      <Group mb="md" gap="sm">
        <SegmentedControl
          value={show}
          onChange={(v) => {
            setShow(v as Show);
            setPage(1);
          }}
          data={[
            { value: 'all', label: 'All' },
            { value: 'expense', label: 'Expenses' },
            { value: 'stock', label: 'Stock bought' },
          ]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load petty cash" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No petty cash yet" description="Transport, repairs, market buys and other cash payments show here." />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(p) => p.created_at}
          keyOf={(p) => p.id}
          gap="xs"
          render={(p) => (
            <Paper withBorder radius="md" p="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                  {p.kind === 'stock' ? (
                    <Package size={18} color="#2B8A3E" style={{ marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <Receipt size={18} color="#868E96" style={{ marginTop: 2, flexShrink: 0 }} />
                  )}
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} lineClamp={2}>
                      {p.description}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {p.kind === 'stock' && p.item ? `${p.quantity} × ${p.item}` : p.category}
                      {p.payee ? ` · ${p.payee}` : ''}
                      {p.receipt_ref ? ` · Rcpt ${p.receipt_ref}` : ''}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {p.petty_ref} · {dayjs(p.created_at).format('HH:mm')}
                      {p.paid_by ? ` · ${p.paid_by.full_name}` : ''}
                    </Text>
                    <Group gap={6}>
                      {p.status === 'pending' && <Badge size="xs" color="yellow" variant="light">Waiting for the manager</Badge>}
                      {p.status === 'rejected' && <Badge size="xs" color="red" variant="light">Rejected</Badge>}
                      {p.status === 'authorised' && p.authorised_by && (
                        <Badge size="xs" color="teal" variant="light">Authorised by {p.authorised_by.full_name}</Badge>
                      )}
                      {groupLevel && p.property && (
                        <Badge size="xs" variant="outline" color="gray">
                          {p.property.code}
                        </Badge>
                      )}
                      {p.batch && (
                        <Badge
                          size="xs"
                          variant="light"
                          component={Link}
                          to={`/stock/batches/${p.batch.id}`}
                          style={{ color: '#2B8A3E', backgroundColor: '#EBFBEE', cursor: 'pointer' }}
                        >
                          In stock as {p.batch.batch_ref}
                        </Badge>
                      )}
                    </Group>
                    {p.status === 'rejected' && p.decision_note && (
                      <Text size="xs" c="red">Reason: {p.decision_note}</Text>
                    )}
                    {p.status === 'pending' && canAuthorise && (
                      <Group gap="xs" mt={4}>
                        <Button size="compact-sm" color="green" onClick={() => { setWhy(''); setConfirm({ id: p.id, ref: p.petty_ref, amount: p.amount, reject: false }); }}>
                          Authorise
                        </Button>
                        <Button size="compact-sm" color="red" variant="light" onClick={() => { setWhy(''); setConfirm({ id: p.id, ref: p.petty_ref, amount: p.amount, reject: true }); }}>
                          Reject
                        </Button>
                      </Group>
                    )}
                  </Stack>
                </Group>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: C.navy }}>
                  {formatCurrency(p.amount)}
                </Text>
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

      <Modal
        opened={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `${confirm.reject ? 'Reject' : 'Authorise'} ${confirm.ref}?` : ''}
      >
        <Stack>
          <Text size="sm">
            {confirm?.reject
              ? 'Are you sure you want to reject this petty cash? Say why.'
              : `Are you sure? The cashier will pay out ${formatCurrency(confirm?.amount ?? 0)} from the cash they hold, and your name is recorded as the one who authorised it.`}
          </Text>
          {confirm?.reject && (
            <Textarea label="Reason" required autosize minRows={2} value={why} onChange={(e) => setWhy(e.currentTarget.value)} />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              color={confirm?.reject ? 'red' : 'green'}
              disabled={!!confirm?.reject && why.trim().length < 3}
              loading={decide.isPending}
              onClick={submitDecision}
            >
              {confirm?.reject ? 'Yes, reject' : 'Yes, authorise'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <PettyCashModal opened={open} onClose={() => setOpen(false)} inHand={mine.data?.cash.in_hand ?? 0} />
    </>
  );
}
