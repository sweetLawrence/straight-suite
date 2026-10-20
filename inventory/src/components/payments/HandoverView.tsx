import { ActionIcon, Alert, Box, Card, Group, Loader, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import dayjs from 'dayjs';
import { Info, RotateCw } from 'lucide-react';
import { useCurrentHandover } from '@/hooks/usePayments';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

const METHODS = [
  { key: 'cash', label: 'Cash' },
  { key: 'mpesa', label: 'M-Pesa' },
  { key: 'card', label: 'Card' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'house', label: 'House (MD)' },
  { key: 'other', label: 'Other' },
] as const;

const C = {
  navy: '#1F3A5F',
  orange: '#E8590C',
  orangeBg: '#FFF4E6',
  green: '#2B8A3E',
  greenBg: '#EBFBEE',
  red: '#E03131',
  muted: '#868E96',
  line: '#F1F3F5',
};

/**
 * One handover screen for waiters (their own bills) and the bar (the whole bar's
 * takings this shift). Built phone first: the one number that matters, cash still
 * to drop, sits at the top; everything else is a short list underneath.
 */
export function HandoverView({ title }: { title: string }) {
  const auth = useAuth();
  // A handover belongs to one waiter (or the bar) at one property and shift
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [which, setWhich] = useState<'current' | 'previous'>('current');
  const query = useCurrentHandover(!groupLevel, which);

  // Switch between the live shift and the one before it (e.g. last night after the 06:00 roll-over)
  const controls = (
    <Group gap="xs" wrap="nowrap" mb="md">
      <SegmentedControl
        fullWidth
        style={{ flex: 1, maxWidth: 360 }}
        value={which}
        onChange={(v) => setWhich(v as 'current' | 'previous')}
        data={[
          { value: 'current', label: 'This shift' },
          { value: 'previous', label: 'Previous shift' },
        ]}
      />
      <ActionIcon
        variant="default"
        size={36}
        radius="md"
        aria-label="Refresh"
        loading={query.isFetching}
        onClick={() => query.refetch()}
      >
        <RotateCw size={16} />
      </ActionIcon>
    </Group>
  );

  if (groupLevel) {
    return (
      <>
        <PageHeader title={title} subtitle="Per waiter and shift" />
        <EmptyState
          title="Handovers are per waiter"
          description="Each waiter and the bar see their own handover for the current shift. For every waiter across both properties, open Reports, Sales and collections by waiter."
        />
      </>
    );
  }

  if (query.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  if (query.error || !query.data) {
    return (
      <>
        <PageHeader title={title} />
        {controls}
        <EmptyState title="Handover unavailable" description={getErrorMessage(query.error)} />
      </>
    );
  }

  const h = query.data;
  if (h.no_previous) {
    return (
      <>
        <PageHeader title={title} subtitle="Previous shift" />
        {controls}
        <EmptyState
          title="No earlier shift yet"
          description="The previous shift shows here once a manager has started a new shift. Your figures so far are under This shift."
        />
      </>
    );
  }
  const isBar = h.scope === 'outlet';
  const live = which === 'current';
  const shiftText = h.shift
    ? live
      ? `${h.shift.name} · since ${dayjs(h.shift.opened_at).format('ddd D MMM, HH:mm')}`
      : `${h.shift.name} · ${dayjs(h.shift.opened_at).format('ddd D MMM, HH:mm')} to ${
          h.shift.closed_at ? dayjs(h.shift.closed_at).format('HH:mm') : 'now'
        }`
    : 'Current shift';

  const cashTaken = Number(h.totals_by_method?.cash || 0);
  const pending = Number(h.cash_pending || 0);
  const nothingYet =
    h.total_bills_count === 0 &&
    Object.values(h.totals_by_method || {}).every((v) => !Number(v)) &&
    !h.drops_count;
  const collected = Object.values(h.totals_by_method || {}).reduce((a, v) => a + Number(v || 0), 0);

  // Only the methods actually used this shift
  const used = METHODS.filter(({ key }) => {
    const st = h.status_by_method[key];
    const count = st ? st.pending + st.verified + st.unverified + st.failed : 0;
    return Number((h.totals_by_method[key] ?? 0)) > 0 || count > 0;
  });

  return (
    <>
      <PageHeader title={title} subtitle={`${shiftText} · ${isBar ? "the whole bar's takings" : 'your bills and cash'}`} />
      {controls}

      {nothingYet && (
        <Alert color="blue" variant="light" icon={<Info size={16} />} mb="md">
          {live
            ? `Nothing recorded yet in this shift (started ${dayjs(h.shift?.opened_at).format('HH:mm')}). Figures appear as soon as you bill, take payment or drop cash. Earlier work is under Previous shift.`
            : 'Nothing was recorded in the previous shift.'}
        </Alert>
      )}

      {/* The number that matters */}
      <Card
        withBorder
        radius="md"
        mb="sm"
        style={{ backgroundColor: pending > 0 ? C.orangeBg : C.greenBg, borderColor: pending > 0 ? '#FFD8A8' : '#B2F2BB' }}
      >
        <Text size="xs" fw={700} tt="uppercase" style={{ color: pending > 0 ? C.orange : C.green, letterSpacing: 0.4 }}>
          Cash still to drop
        </Text>
        <Text fw={800} fz={30} lh={1.15} style={{ color: pending > 0 ? C.orange : C.green }}>
          {formatCurrency(pending)}
        </Text>
        <Text size="xs" mt={4} style={{ color: '#495057' }}>
          Cash taken {formatCurrency(cashTaken)} · dropped {formatCurrency(h.cash_dropped)} ({h.drops_count} drop
          {h.drops_count === 1 ? '' : 's'})
        </Text>
      </Card>

      <SimpleGrid cols={2} spacing="sm" mb="sm">
        <Card withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed">
            Bills
          </Text>
          <Text fw={700} fz={20} style={{ color: C.navy }}>
            {h.total_bills_count}
          </Text>
          <Text size="xs" c="dimmed">
            {formatCurrency(h.total_bills)}
          </Text>
        </Card>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed">
            Collected
          </Text>
          <Text fw={700} fz={20} style={{ color: C.navy }}>
            {formatCurrency(collected)}
          </Text>
          <Text size="xs" c="dimmed">
            All payment methods
          </Text>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p={0} mb="sm">
        <Text fw={600} size="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
          Payments by method
        </Text>
        {used.length === 0 ? (
          <Text size="sm" c="dimmed" px="md" py="sm">
            No payments yet
          </Text>
        ) : (
          used.map(({ key, label }, i) => {
            const st = h.status_by_method[key] || { pending: 0, verified: 0, unverified: 0, failed: 0 };
            const parts = [
              st.pending ? { n: st.pending, t: 'waiting', c: C.orange } : null,
              st.verified ? { n: st.verified, t: 'checked', c: C.green } : null,
              st.unverified ? { n: st.unverified, t: 'not matched', c: C.orange } : null,
              st.failed ? { n: st.failed, t: 'failed', c: C.red } : null,
            ].filter(Boolean) as { n: number; t: string; c: string }[];
            return (
              <Group
                key={key}
                justify="space-between"
                wrap="nowrap"
                px="md"
                py={10}
                style={{ borderTop: i ? `1px solid ${C.line}` : undefined }}
              >
                <Box style={{ minWidth: 0 }}>
                  <Text fw={500} size="sm">
                    {label}
                  </Text>
                  <Text size="xs">
                    {parts.map((p, j) => (
                      <span key={p.t} style={{ color: p.c }}>
                        {j ? ' · ' : ''}
                        {p.n} {p.t}
                      </span>
                    ))}
                  </Text>
                </Box>
                <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap', color: C.navy }}>
                  {formatCurrency((h.totals_by_method[key] ?? 0))}
                </Text>
              </Group>
            );
          })
        )}
      </Card>

      <Text size="xs" c="dimmed" px={2}>
        Waiting means the cashier has not checked it yet. Cash is checked when your cash drop is confirmed. Updated{' '}
        {dayjs(h.as_of || undefined).format('HH:mm')}. {isBar ? 'Covers all bar sales in this shift.' : 'A new shift starts from zero.'}
      </Text>
    </>
  );
}
