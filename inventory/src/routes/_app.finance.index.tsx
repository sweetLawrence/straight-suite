import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Alert, Badge, Box, Button, Card, Divider, Group, Loader, Modal, ScrollArea, Select, Stack, Text, Textarea, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Lock, LockOpen, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { VatSwitch } from '@/components/settings/VatSwitch';
import { EmptyState } from '@/components/EmptyState';
import { usePeriodAction, useStatement } from '@/hooks/useFinance';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { MonthStatus, Statement, StatementLine } from '@/lib/api/finance';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/finance/')({ component: FinancePage });

const STATUS: Record<MonthStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#1971C2', bg: '#E7F5FF' },
  current: { label: 'This month', color: '#2B8A3E', bg: '#EBFBEE' },
  future: { label: 'Not yet', color: '#868E96', bg: '#F1F3F5' },
  closed: { label: 'Closed', color: '#495057', bg: '#E9ECEF' },
  reopened: { label: 'Reopened', color: '#E8590C', bg: '#FFF4E6' },
  partial: { label: 'Partly closed', color: '#E8590C', bg: '#FFF4E6' },
};

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => String(thisYear - i));

/** Income statement, Jan to Dec. Pick a month (or the year) to read it; close finished months. */
function FinancePage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [year, setYear] = useState(thisYear);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [col, setCol] = useState<number | 'year'>(new Date().getMonth());
  const properties = useProperties(1, 20);
  const q = useStatement({ year, property_id: propertyId || undefined });
  const st = q.data;

  useEffect(() => {
    setCol(year === thisYear ? new Date().getMonth() : 'year');
  }, [year]);

  return (
    <>
      <PageHeader
        title="Income statement"
        subtitle="Sales, cost of sales and expenses by month. Closed months never change."
        actions={<Button variant="light" leftSection={<Receipt size={16} />} component={Link} to="/finance/cost-of-sales">Cost of sales</Button>}
      />
      <VatSwitch />
      <Group gap="sm" mb="md" wrap="wrap">
        <Select w={110} data={YEARS} value={String(year)} onChange={(v) => setYear(Number(v) || thisYear)} allowDeselect={false} />
        {groupLevel && (
          <Select
            w={200}
            placeholder="Both properties"
            clearable
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={propertyId}
            onChange={setPropertyId}
          />
        )}
        {q.isFetching && <Loader size="xs" />}
      </Group>

      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !st ? (
        <EmptyState title="Couldn't load the statement" description={getErrorMessage(q.error)} />
      ) : (
        <>
          <MonthStrip st={st} col={col} onPick={setCol} />
          <Box maw={720}>
            {col !== 'year' && <MonthBar st={st} index={col} propertyId={propertyId} groupLevel={groupLevel} />}
            <StatementCard st={st} col={col} />
            <NetByMonth st={st} onPick={setCol} />
          </Box>
        </>
      )}
    </>
  );
}

function MonthStrip({ st, col, onPick }: { st: Statement; col: number | 'year'; onPick: (c: number | 'year') => void }) {
  // Keep the picked month in view on a phone
  useEffect(() => {
    document.getElementById(`month-chip-${col}`)?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [col]);
  const chip = (key: string, label: string, active: boolean, onClick: () => void, status?: MonthStatus) => (
    <UnstyledButton
      key={key}
      id={`month-chip-${key === 'year' ? 'year' : Number(key) - 1}`}
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? '#1F3A5F' : '#DEE2E6'}`,
        background: active ? '#1F3A5F' : '#FFFFFF',
        color: active ? '#FFFFFF' : status === 'future' ? '#ADB5BD' : '#212529',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {status === 'closed' && <Lock size={11} />}
      {label}
    </UnstyledButton>
  );
  return (
    <ScrollArea type="never" mb="md">
      <Group gap={6} wrap="nowrap" pb={4}>
        {st.months.map((m, i) => chip(String(m.month), m.label, col === i, () => onPick(i), m.status))}
        {chip('year', `Year ${st.year}`, col === 'year', () => onPick('year'))}
      </Group>
    </ScrollArea>
  );
}

/** Status of the picked month, with close / reopen */
function MonthBar({ st, index, propertyId, groupLevel }: { st: Statement; index: number; propertyId: string | null; groupLevel: boolean }) {
  const auth = useAuth();
  const m = st.months[index];
  const s = STATUS[m.status];
  const action = usePeriodAction();
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState('');
  const needsProperty = groupLevel && !propertyId;
  const canClose = auth.hasPermission('finance.close') && ['open', 'reopened', 'partial'].includes(m.status);
  const canReopen = auth.hasPermission('finance.reopen') && m.status === 'closed';

  const run = async (a: Parameters<typeof action.mutateAsync>[0], ok: string) => {
    try {
      await action.mutateAsync(a);
      notifications.show({ color: 'green', title: ok, message: `${m.label} ${st.year}` });
      setReopenOpen(false);
      setReason('');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not done', message: getErrorMessage(err) });
    }
  };

  return (
    <Card withBorder radius="md" p="sm" mb="sm">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Box>
          <Group gap={8}>
            <Text fw={700}>{m.label} {st.year}</Text>
            <Badge style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</Badge>
          </Group>
          {m.status === 'closed' && m.closed_by && <Text size="xs" c="dimmed">Closed by {m.closed_by}</Text>}
          {m.status === 'reopened' && m.reopen_reason && <Text size="xs" c="dimmed">Reopened: {m.reopen_reason}</Text>}
          {m.status === 'current' && <Text size="xs" c="dimmed">Figures change as the month goes on. Close it once it ends.</Text>}
        </Box>
        {(canClose || canReopen) && needsProperty ? (
          <Text size="xs" c="dimmed">Pick a property to close or reopen</Text>
        ) : canClose ? (
          <Button
            size="sm"
            leftSection={<Lock size={14} />}
            loading={action.isPending}
            style={{ backgroundColor: '#1F3A5F' }}
            onClick={() => run({ kind: 'close', year: st.year, month: m.month, property_id: propertyId || undefined }, 'Month closed')}
          >
            Close month
          </Button>
        ) : canReopen ? (
          <Button size="sm" variant="light" color="orange" leftSection={<LockOpen size={14} />} onClick={() => setReopenOpen(true)}>
            Reopen
          </Button>
        ) : null}
      </Group>
      <Modal opened={reopenOpen} onClose={() => setReopenOpen(false)} title={`Reopen ${m.label} ${st.year}`} centered>
        <Stack>
          <Alert color="orange" variant="light">Figures will be worked out again and changes dated in this month will be allowed until it is closed again.</Alert>
          <Textarea label="Why" placeholder="e.g. Late supplier invoice" value={reason} onChange={(e) => setReason(e.currentTarget.value)} autosize minRows={2} />
          <Button
            color="orange"
            disabled={reason.trim().length < 3}
            loading={action.isPending}
            onClick={() => run({ kind: 'reopen', year: st.year, month: m.month, property_id: propertyId || undefined, reason: reason.trim() }, 'Month reopened')}
          >
            Reopen month
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
}

function StatementCard({ st, col }: { st: Statement; col: number | 'year' }) {
  const val = (v: { values: number[]; total: number }) => (col === 'year' ? v.total : v.values[col]);
  const pick = (section: StatementLine['section']) => st.lines.filter((l) => l.section === section && (val(l) !== 0 || ['sales_restaurant', 'sales_bar', 'cos_kitchen', 'cos_bar'].includes(l.key)));
  const revenue = val(st.totals.revenue);
  const pct = (v: number) => (revenue ? `${Math.round((v / revenue) * 1000) / 10}%` : '');
  const unpaid = val(st.unpaid);

  const row = (label: string, v: number, opts: { muted?: boolean; strong?: boolean; color?: string; note?: string } = {}) => (
    <Group key={label} justify="space-between" wrap="nowrap" py={4} gap="sm">
      <Text size="sm" c={opts.muted ? 'dimmed' : undefined} fw={opts.strong ? 700 : 400} style={{ minWidth: 0 }}>{label}</Text>
      <Group gap={8} wrap="nowrap">
        {opts.note && <Text size="xs" c="dimmed">{opts.note}</Text>}
        <Text size="sm" fw={opts.strong ? 800 : 500} style={{ color: opts.color || (v < 0 ? '#C92A2A' : '#212529'), whiteSpace: 'nowrap' }}>{formatCurrency(v)}</Text>
      </Group>
    </Group>
  );
  const head = (t: string) => <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt="sm" mb={2} style={{ letterSpacing: 0.6 }}>{t}</Text>;
  const gp = val(st.totals.gross_profit);
  const np = val(st.totals.net_profit);

  return (
    <Card withBorder radius="md" p="md" mb="sm">
      {head('Revenue')}
      {pick('revenue').map((l) => row(l.label, val(l), { muted: l.key === 'house' || l.key === 'vat' }))}
      <Divider my={4} />
      {row('Net revenue', revenue, { strong: true })}

      {head('Cost of sales')}
      {pick('cost').map((l) => row(l.label, val(l)))}
      <Divider my={4} />
      {row('Total cost of sales', val(st.totals.cost), { strong: true })}
      <Box mt={6} p="xs" style={{ background: '#E7F5FF', borderRadius: 8 }}>
        {row('Gross profit', gp, { strong: true, color: gp < 0 ? '#C92A2A' : '#1864AB', note: pct(gp) })}
      </Box>

      {head('Expenses')}
      {pick('expense').length === 0 ? <Text size="sm" c="dimmed" py={4}>None</Text> : pick('expense').map((l) => row(l.label, val(l)))}
      <Divider my={4} />
      {row('Total expenses', val(st.totals.expenses), { strong: true })}

      <Box mt="sm" p="sm" style={{ background: np < 0 ? '#FFF5F5' : '#EBFBEE', borderRadius: 8 }}>
        {row('Net profit', np, { strong: true, color: np < 0 ? '#C92A2A' : '#2B8A3E', note: pct(np) })}
      </Box>

      {unpaid > 0 && <Text size="xs" c="dimmed" mt="sm">Unpaid bills of {formatCurrency(unpaid)} are not counted until they are paid.</Text>}
      {st.vat_rate > 0 && <Text size="xs" c="dimmed" mt={4}>Menu prices include VAT at {st.vat_rate}%. Event invoices are counted before VAT.</Text>}
    </Card>
  );
}

/** Net profit per month as bars; tap a month to open it */
function NetByMonth({ st, onPick }: { st: Statement; onPick: (c: number) => void }) {
  const values = st.totals.net_profit.values;
  const max = useMemo(() => Math.max(1, ...values.map((v) => Math.abs(v))), [values]);
  return (
    <Card withBorder radius="md" p="md">
      <Text fw={700} mb="xs">Net profit by month</Text>
      <Stack gap={4}>
        {st.months.map((m, i) => {
          const v = values[i];
          const w = `${Math.max(v ? 2 : 0, (Math.abs(v) / max) * 100)}%`;
          return (
            <UnstyledButton key={m.month} onClick={() => onPick(i)}>
              <Group gap={8} wrap="nowrap">
                <Text size="xs" w={30} c={m.status === 'future' ? 'dimmed' : undefined}>{m.label}</Text>
                <Box style={{ flex: 1, height: 14, background: '#F1F3F5', borderRadius: 4, overflow: 'hidden' }}>
                  <Box style={{ width: w, height: '100%', background: v < 0 ? '#FA5252' : '#40C057', borderRadius: 4 }} />
                </Box>
                <Text size="xs" w={110} ta="right" style={{ color: v < 0 ? '#C92A2A' : '#495057', whiteSpace: 'nowrap' }}>
                  {m.status === 'future' ? '-' : formatCurrency(v)}
                </Text>
              </Group>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Card>
  );
}
