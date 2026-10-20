import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Group, Loader, Pagination, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { DayGroupedList } from '@/components/DayGroupedList';
import { DisputeRemittanceModal } from '@/components/cashier/DisputeRemittanceModal';
import { C, METHOD_OF, REMIT_STATUS } from '@/components/cashier/CashParts';
import { RemitTotals } from '@/components/cashier/RemitTotals';
import { useDecideRemittance, useRemittances } from '@/hooks/useCashier';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { Remittance } from '@/lib/api/cashier';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/cash-handovers')({
  component: CashHandoversPage,
});

type Show = 'pending' | 'all' | 'disputed' | 'totals';

function CashHandoversPage() {
  const auth = useAuth();
  const canReceive = auth.hasPermission('cash.remit.receive');
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const oversight = auth.hasRole('md', 'admin', 'auditor', 'manager', 'supervisor');
  const [show, setShow] = useState<Show>(canReceive ? 'pending' : 'all');
  const [page, setPage] = useState(1);
  const [disputing, setDisputing] = useState<Remittance | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const query = useRemittances({ page, limit: 30, status: show === 'all' || show === 'totals' ? undefined : show });
  const decide = useDecideRemittance();

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const waiting = query.data?.pending_total ?? 0;

  const confirm = async (r: Remittance, method?: string) => {
    setBusy(r.id + (method ?? r.lines[0]?.method ?? ''));
    try {
      await decide.mutateAsync({ id: r.id, decision: 'receive', method });
      const l = r.lines.find((x) => x.method === method);
      notifications.show({ color: 'green', title: method ? `${METHOD_OF[method]?.label ?? method} confirmed` : 'Received', message: `${r.remit_ref} · ${formatCurrency(l ? l.amount : r.amount)}` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Handovers to the MD"
        subtitle={canReceive ? 'Cash, M-Pesa, card and more handed to you. Check it, then confirm or dispute.' : 'Money handed to the MD'}
      />

      {waiting > 0 && show !== 'totals' && (
        <Card radius="md" p="md" mb="md" style={{ background: '#FFF4E6' }}>
          <Text size="sm" style={{ color: '#D9480F' }}>
            Waiting to be confirmed
          </Text>
          <Text fw={800} fz={26} style={{ color: '#D9480F' }}>
            {formatCurrency(waiting)}
          </Text>
        </Card>
      )}

      <Group mb="md" gap="sm">
        <SegmentedControl
          value={show}
          onChange={(v) => {
            setShow(v as Show);
            setPage(1);
          }}
          data={[
            { value: 'pending', label: 'Waiting' },
            { value: 'disputed', label: 'Disputed' },
            { value: 'all', label: 'All' },
            ...(oversight ? [{ value: 'totals', label: 'Totals' }] : []),
          ]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {show === 'totals' ? (
        <Box maw={760}>
          <RemitTotals />
        </Box>
      ) : query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load handovers" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={show === 'pending' ? 'Nothing waiting' : 'No handovers'}
          description="When a cashier hands over cash it shows here until the MD confirms it."
        />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(r) => r.created_at}
          keyOf={(r) => r.id}
          gap="xs"
          render={(r) => {
            const st = REMIT_STATUS[r.status];
            const short = r.received_amount != null ? r.amount - r.received_amount : 0;
            return (
              <Paper withBorder radius="md" p="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <Stack gap={3} style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="wrap">
                      <StatusDot color={st.color} />
                      <Text size="sm" fw={700}>
                        {r.cashier?.full_name || 'Cashier'}
                      </Text>
                      {groupLevel && r.property && (
                        <Badge size="xs" variant="outline" color="gray">
                          {r.property.code}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {r.remit_ref} · {dayjs(r.created_at).format('HH:mm')} · {st.label}
                      {r.receiver ? ` by ${r.receiver.full_name}` : ''}
                    </Text>
                    {r.expected_amount - r.amount > 0.009 && (
                      <Text size="xs" style={{ color: C.orange }}>
                        Held {formatCurrency(r.expected_amount)}, kept {formatCurrency(r.expected_amount - r.amount)}
                      </Text>
                    )}
                    {(r.lines.length > 1 || r.lines[0]?.method !== 'cash') && (
                      <Group gap={4}>
                        {r.lines.map((l) => (
                          <Badge key={l.method} size="xs" style={{ color: METHOD_OF[l.method]?.color, backgroundColor: METHOD_OF[l.method]?.bg, textTransform: 'none' }}>
                            {r.status === 'pending' && l.received_amount != null ? '✓ ' : ''}{METHOD_OF[l.method]?.label} {formatCurrency(l.amount)}
                            {l.received_amount != null && l.received_amount !== l.amount ? ` (got ${formatCurrency(l.received_amount)})` : ''}
                          </Badge>
                        ))}
                      </Group>
                    )}
                    {r.notes && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        "{r.notes}"
                      </Text>
                    )}
                    {r.status === 'disputed' && (
                      <Text size="xs" style={{ color: C.red }}>
                        Counted {formatCurrency(r.received_amount)}
                        {short > 0 ? ` (short ${formatCurrency(short)})` : ''}: {r.dispute_reason}
                      </Text>
                    )}
                  </Stack>
                  <Text fw={800} size="md" style={{ whiteSpace: 'nowrap', color: C.navy }}>
                    {formatCurrency(r.amount)}
                  </Text>
                </Group>
                {canReceive && r.status === 'pending' && (
                  <Box mt="sm">
                    <Stack gap="xs">
                      {r.lines.filter((l) => l.received_amount == null).map((l) => (
                        <Button
                          key={l.method}
                          color="green"
                          leftSection={<Check size={16} />}
                          loading={busy === r.id + l.method}
                          disabled={!!busy}
                          onClick={() => confirm(r, r.lines.length > 1 ? l.method : undefined)}
                        >
                          {l.method === 'cash' ? 'Cash counted' : l.method === 'mpesa' ? 'M-Pesa verified' : `${METHOD_OF[l.method]?.label ?? l.method} received`} · {formatCurrency(l.amount)}
                        </Button>
                      ))}
                      <Button
                        variant="light"
                        color="red"
                        style={{ flex: 1 }}
                        leftSection={<X size={16} />}
                        disabled={!!busy}
                        onClick={() => setDisputing(r)}
                      >
                        Dispute
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Paper>
            );
          }}
        />
      )}

      {show !== 'totals' && meta && meta.pages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination value={page} onChange={setPage} total={meta.pages} size="sm" siblings={0} />
        </Group>
      )}

      <DisputeRemittanceModal remittance={disputing} onClose={() => setDisputing(null)} />
    </>
  );
}
