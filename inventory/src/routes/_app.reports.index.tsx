import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Coins,
  Download,
  PackageMinus,
  PackagePlus,
  Receipt,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import {
  AttentionTile,
  BarList,
  DataTable,
  DayColumns,
  Empty,
  Kpi,
  RC,
  Section,
  kes,
  num,
} from '@/components/reports/ReportWidgets';
import {
  useDownloadReport,
  usePropertiesForReports,
  useReportActivity,
  useReportOverview,
} from '@/hooks/useReports';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { ReportOverview, ReportParams, StockOnHandRow } from '@/lib/api/reports';
import { formatPacks } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/reports/')({
  component: ReportsPage,
});

// ─── Period presets ─────────────────────────────────────────────────

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
];

const D = 'YYYY-MM-DD';

function presetRange(p: Preset): [string, string] {
  const t = dayjs();
  switch (p) {
    case 'yesterday': {
      const y = t.subtract(1, 'day').format(D);
      return [y, y];
    }
    case 'week': {
      // Week starts Monday
      const monday = t.subtract((t.day() + 6) % 7, 'day');
      return [monday.format(D), t.format(D)];
    }
    case 'month':
      return [t.startOf('month').format(D), t.format(D)];
    case 'last_month': {
      const lm = t.subtract(1, 'month');
      return [lm.startOf('month').format(D), lm.endOf('month').format(D)];
    }
    default:
      return [t.format(D), t.format(D)];
  }
}

const periodLabel = (from: string, to: string) =>
  from === to
    ? dayjs(from).format('ddd D MMM YYYY')
    : `${dayjs(from).format('D MMM')} – ${dayjs(to).format('D MMM YYYY')}`;

const METHOD_NAMES: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  cheque: 'Cheque',
  house: 'House (MD)',
  bank: 'Bank transfer',
  credit: 'Credit',
  voucher: 'Voucher',
};
const METHOD_COLORS: Record<string, string> = {
  cash: RC.green,
  mpesa: '#37B24D',
  card: RC.blue,
  cheque: '#4263EB',
  house: '#D6336C',
  bank: RC.teal,
  credit: RC.orange,
};
const titleCase = (s: string | null | undefined) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

// ═══ Page ═══════════════════════════════════════════════════════════

function ReportsPage() {
  const auth = useAuth();
  const isMobile = useIsMobile();
  const isGroupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');

  const [preset, setPreset] = useState<Preset>('today');
  const [custom, setCustom] = useState<[string | null, string | null]>(presetRange('today'));
  const [propertyId, setPropertyId] = useState<string>('all');
  const [tab, setTab] = useState<string | null>('finance');

  const [from, to] = useMemo<[string, string]>(() => {
    if (preset !== 'custom') return presetRange(preset);
    const [f, t] = custom;
    if (f && t) return [f, t];
    if (f) return [f, f];
    return presetRange('today');
  }, [preset, custom]);

  const params: ReportParams = {
    from,
    to,
    property_id: isGroupLevel && propertyId !== 'all' ? propertyId : undefined,
  };

  const properties = usePropertiesForReports();
  const overview = useReportOverview(params);
  const download = useDownloadReport();
  const data = overview.data;

  const scopeName = data?.period.property?.name || (isGroupLevel ? 'All properties' : '');

  const onExport = () =>
    download.mutate(params, {
      onError: (e) => notifications.show({ color: 'red', title: 'Export failed', message: getErrorMessage(e) }),
    });

  return (
    <Stack gap="md" pb="xl">
      <PageHeader
        title="Reports"
        subtitle={
          <>
            {periodLabel(from, to)}
            {scopeName ? ` · ${scopeName}` : ''}
            {overview.isFetching && <Loader size={10} ml={8} />}
          </>
        }
        actions={
          <Button
            leftSection={<Download size={16} />}
            onClick={onExport}
            loading={download.isPending}
            style={{ backgroundColor: RC.navy }}
          >
            {isMobile ? 'Excel' : 'Export to Excel'}{scopeName ? <b style={{ marginLeft: 6 }}>· {scopeName}</b> : null}
          </Button>
        }
      />

      {/* ── Filters ── */}
      <Card withBorder radius="md" p="sm">
        <Stack gap="sm">
          {isMobile ? (
            <Select
              label="Period"
              data={PRESETS}
              value={preset}
              allowDeselect={false}
              onChange={(v) => v && setPreset(v as Preset)}
            />
          ) : (
            <SegmentedControl
              data={PRESETS}
              value={preset}
              onChange={(v) => setPreset(v as Preset)}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
          <Group gap="sm" align="flex-end" grow={isMobile}>
            {preset === 'custom' && (
              <DatePickerInput
                type="range"
                label="From – to"
                placeholder="Pick dates"
                valueFormat="D MMM YYYY"
                value={custom}
                onChange={(v) => setCustom(v as [string | null, string | null])}
                maxDate={dayjs().format(D)}
                allowSingleDateInRange
                miw={isMobile ? undefined : 260}
              />
            )}
            {isGroupLevel && (
              <Select
                label="Property"
                styles={{ input: { fontWeight: 700, color: '#1F3A5F', borderColor: '#1F3A5F', borderWidth: 2 } }}
                value={propertyId}
                allowDeselect={false}
                onChange={(v) => setPropertyId(v || 'all')}
                data={[
                  { value: 'all', label: 'All properties' },
                  ...(properties.data || []).map((p) => ({ value: p.id, label: p.name })),
                ]}
                miw={isMobile ? undefined : 220}
              />
            )}
          </Group>
        </Stack>
      </Card>

      {overview.isLoading || !data ? (
        overview.isError ? (
          <Card withBorder p="lg">
            <Text c="red">{getErrorMessage(overview.error)}</Text>
          </Card>
        ) : (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        )
      ) : (
        <Tabs value={tab} onChange={setTab} keepMounted={false}>
          <Tabs.List mb="md" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
            <Tabs.Tab value="finance" leftSection={<Wallet size={16} />}>
              Finance
            </Tabs.Tab>
            <Tabs.Tab value="stock" leftSection={<Boxes size={16} />}>
              Stock
            </Tabs.Tab>
            <Tabs.Tab value="activity" leftSection={<Users size={16} />}>
              Staff activity
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="finance">
            <FinanceTab data={data} isGroupLevel={isGroupLevel && !params.property_id} />
          </Tabs.Panel>
          <Tabs.Panel value="stock">
            <StockTab data={data} />
          </Tabs.Panel>
          <Tabs.Panel value="activity">
            <ActivityTab params={params} isMobile={isMobile} />
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  );
}

// ═══ Finance ════════════════════════════════════════════════════════

function FinanceTab({ data, isGroupLevel }: { data: ReportOverview; isGroupLevel: boolean }) {
  const f = data.finance;
  const c = data.control;
  const s = f.summary;
  const openExceptions = c.exceptions.reduce((a, x) => a + x.count, 0);
  const openTransfers = c.transfers_open.reduce((a, x) => a + x.count, 0);
  const multiDay = data.period.from !== data.period.to;

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} spacing="sm">
        <Kpi label="Net sales" value={kes(s.net)} hint={`${num(s.bills)} bills`} icon={<TrendingUp size={18} />} color={RC.blue} />
        <Kpi label="Average bill" value={kes(s.avg_bill)} hint={s.discounts ? `Discounts ${kes(s.discounts)}` : 'No discounts'} icon={<Receipt size={18} />} color={RC.teal} />
        <Kpi
          label="Collected"
          value={kes(s.payments)}
          hint={`${kes(s.payments_verified)} verified`}
          icon={<Banknote size={18} />}
          color={RC.green}
        />
        <Kpi
          label="Awaiting verification"
          value={kes(s.payments_unverified)}
          hint="Payments not yet confirmed"
          icon={<AlertTriangle size={18} />}
          color={s.payments_unverified > 0 ? RC.orange : RC.muted}
        />
        <Kpi
          label="Open bills"
          value={kes(s.open_value)}
          hint={`${num(s.open_bills)} unpaid`}
          icon={<ShoppingBag size={18} />}
          color={s.open_bills > 0 ? RC.red : RC.muted}
        />
        <Kpi
          label="Cash dropped"
          value={kes(f.cash.dropped)}
          hint={f.cash.pending ? `${kes(f.cash.pending)} not confirmed` : `${num(f.cash.drops)} drops, all confirmed`}
          icon={<Coins size={18} />}
          color={RC.grape}
        />
      </SimpleGrid>

      <Section title="Needs attention" subtitle="As of now, regardless of period">
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="sm">
          <AttentionTile label="Unverified payments" count={c.payments_unverified.count} amount={c.payments_unverified.amount} color={RC.orange} to="/payments/pending" />
          <AttentionTile label="Unconfirmed cash drops" count={c.cash_drops_pending.count} amount={c.cash_drops_pending.amount} color={RC.grape} to="/cash-drops" />
          <AttentionTile label="Open bills" count={c.open_bills.count} amount={c.open_bills.amount} color={RC.red} to="/bills" />
          <AttentionTile label="Pending adjustments" count={c.adjustments_pending.count} amount={c.adjustments_pending.amount} color={RC.orange} to="/adjustments" />
          <AttentionTile label="Open exceptions" count={openExceptions} color={RC.red} to="/exceptions" />
          <AttentionTile label="Transfers in progress" count={openTransfers} color={RC.blue} to="/transfers" />
        </SimpleGrid>
      </Section>

      {multiDay && (
        <Section title="Sales by day" subtitle="Net sales per business day">
          <DayColumns
            days={f.by_day.map((d) => ({
              day: d.day,
              value: d.net,
              label: dayjs(d.day).format(f.by_day.length > 31 ? 'D/M' : 'D MMM'),
              tip: `${dayjs(d.day).format('ddd D MMM')}: ${kes(d.net)} · ${d.bills} bills`,
            }))}
          />
        </Section>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Section title="Payments by method">
          <BarList
            items={f.by_method.map((m) => ({
              label: METHOD_NAMES[m.method] || titleCase(m.method),
              value: m.total,
              display: kes(m.total),
              color: METHOD_COLORS[m.method] || RC.blue,
              sub:
                [
                  `${m.lines} payment${m.lines === 1 ? '' : 's'}`,
                  m.verified ? `${kes(m.verified)} verified` : null,
                  m.pending ? `${kes(m.pending)} pending` : null,
                  m.problem ? `${kes(m.problem)} failed/disputed` : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
            }))}
            empty="No payments in this period"
          />
        </Section>

        {isGroupLevel ? (
          <Section title="Sales by property">
            <BarList
              items={f.by_property.map((p) => ({
                label: p.name,
                value: p.net,
                display: kes(p.net),
                color: RC.navy,
                sub: `${p.bills} bills${p.discounts ? ` · ${kes(p.discounts)} discounts` : ''}`,
              }))}
            />
          </Section>
        ) : (
          <Section title="Sales by outlet">
            <BarList
              items={f.by_outlet.map((o) => ({
                label: titleCase(o.outlet),
                value: o.net,
                display: kes(o.net),
                color: RC.navy,
                sub: `${o.bills} bills`,
              }))}
            />
          </Section>
        )}
      </SimpleGrid>

      <Section title="Sales and collections by waiter" subtitle="Cash dropped versus cash confirmed by the cashier" flush>
        <DataTable
          rows={f.by_waiter}
          minWidth={720}
          empty="No waiter sales in this period"
          cols={[
            { key: 'w', title: 'Waiter', render: (r) => <Text size="sm" fw={500}>{r.waiter}</Text> },
            { key: 'b', title: 'Bills', align: 'right', render: (r) => num(r.bills), total: (rs) => num(rs.reduce((a, x) => a + x.bills, 0)) },
            { key: 'n', title: 'Net sales', align: 'right', render: (r) => kes(r.net), total: (rs) => kes(rs.reduce((a, x) => a + x.net, 0)) },
            { key: 'd', title: 'Discounts', align: 'right', render: (r) => (r.discounts ? kes(r.discounts) : '—') },
            { key: 'c', title: 'Collected', align: 'right', render: (r) => kes(r.collected), total: (rs) => kes(rs.reduce((a, x) => a + x.collected, 0)) },
            { key: 'cd', title: 'Cash dropped', align: 'right', render: (r) => kes(r.cash_dropped), total: (rs) => kes(rs.reduce((a, x) => a + x.cash_dropped, 0)) },
            {
              key: 'cv',
              title: 'Cash confirmed',
              align: 'right',
              render: (r) => (
                <Text size="sm" style={{ color: r.cash_verified < r.cash_dropped ? RC.orange : undefined }}>
                  {kes(r.cash_verified)}
                </Text>
              ),
              total: (rs) => kes(rs.reduce((a, x) => a + x.cash_verified, 0)),
            },
          ]}
        />
      </Section>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Section title="Best-selling items" subtitle="By revenue">
          <BarList
            items={f.top_items.slice(0, 10).map((t) => ({
              label: t.item,
              value: t.revenue,
              display: kes(t.revenue),
              color: RC.teal,
              sub: `${num(t.qty, 2)} sold`,
            }))}
          />
        </Section>
        <Section title="Cash">
          <Stack gap={6}>
            <Row label="Cash drops" value={num(f.cash.drops)} />
            <Row label="Cash dropped" value={kes(f.cash.dropped)} />
            <Row label="Confirmed by cashier" value={kes(f.cash.verified)} color={RC.green} />
            <Row label="Not yet confirmed" value={kes(f.cash.pending)} color={f.cash.pending ? RC.orange : undefined} />
            <Row label="Disputed" value={kes(f.cash.disputed)} color={f.cash.disputed ? RC.red : undefined} />
          </Stack>
        </Section>
      </SimpleGrid>
    </Stack>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={600} style={{ color }}>
        {value}
      </Text>
    </Group>
  );
}

// ═══ Stock ══════════════════════════════════════════════════════════

const STATUS: Record<StockOnHandRow['status'], { label: string; color: string }> = {
  ok: { label: 'OK', color: RC.green },
  low: { label: 'Low', color: RC.orange },
  out: { label: 'Out', color: RC.red },
};

const qtyText = (r: StockOnHandRow) => {
  const packs = formatPacks(r.qty, r.pack_size, r.pack_label);
  const base = `${num(r.qty, 3)} ${r.unit || ''}`.trim();
  return packs ? `${base} (${packs})` : base;
};

function StockTab({ data }: { data: ReportOverview }) {
  const st = data.stock;
  const s = st.summary;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const onHand = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return st.on_hand.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!needle || r.name.toLowerCase().includes(needle) || r.code.toLowerCase().includes(needle))
    );
  }, [st.on_hand, q, status]);

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} spacing="sm">
        <Kpi label="Stock value now" value={kes(s.value_on_hand)} hint={`${num(s.items)} items`} icon={<Boxes size={18} />} color={RC.navy} />
        <Kpi
          label="Low / out"
          value={`${s.low} / ${s.out}`}
          hint="At or below reorder level"
          icon={<AlertTriangle size={18} />}
          color={s.out ? RC.red : s.low ? RC.orange : RC.muted}
        />
        <Kpi label="Received" value={kes(s.received_value)} hint={`${num(s.receipts)} batches`} icon={<PackagePlus size={18} />} color={RC.green} />
        <Kpi label="Waste" value={kes(s.waste_value)} hint={`${num(s.waste_records)} records`} icon={<PackageMinus size={18} />} color={s.waste_value ? RC.red : RC.muted} />
        <Kpi label="Staff meals" value={kes(s.staff_meal_value)} hint={`${num(s.staff_meals)} meals`} icon={<UtensilsCrossed size={18} />} color={RC.teal} />
        <Kpi
          label="Production variance"
          value={kes(s.variance_cost)}
          hint={`${num(s.variances)} variances`}
          icon={<TrendingUp size={18} />}
          color={s.variances ? RC.orange : RC.muted}
        />
      </SimpleGrid>

      <Section
        title="Stock on hand"
        subtitle="Current balance, valued at the latest batch cost"
        flush
        right={
          <Group gap="xs" wrap="wrap">
            <TextInput
              size="xs"
              placeholder="Search item"
              leftSection={<Search size={14} />}
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              w={170}
            />
            <SegmentedControl
              size="xs"
              value={status}
              onChange={setStatus}
              data={[
                { value: 'all', label: 'All' },
                { value: 'low', label: `Low (${s.low})` },
                { value: 'out', label: `Out (${s.out})` },
              ]}
            />
          </Group>
        }
      >
        <DataTable
          rows={onHand}
          minWidth={760}
          maxHeight={520}
          empty="No items match"
          rowKey={(r) => r.id}
          cols={[
            {
              key: 'i',
              title: 'Item',
              render: (r) => (
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    {r.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.code}
                  </Text>
                </Stack>
              ),
            },
            { key: 'p', title: 'Property', render: (r) => r.property },
            { key: 's', title: 'Store', render: (r) => titleCase(r.store_type) },
            { key: 'q', title: 'Quantity', align: 'right', render: qtyText },
            { key: 'po', title: 'Portions ready', align: 'right', render: (r) => (r.portions ? num(r.portions) : '—') },
            { key: 'v', title: 'Value', align: 'right', render: (r) => kes(r.value), total: (rs) => kes(rs.reduce((a, x) => a + x.value, 0)) },
            {
              key: 'st',
              title: 'Status',
              align: 'center',
              render: (r) => (
                <Badge variant="light" style={{ color: STATUS[r.status].color, backgroundColor: `${STATUS[r.status].color}1A` }}>
                  {STATUS[r.status].label}
                </Badge>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Stock received" subtitle="Batches received in the period" flush>
        <DataTable
          rows={st.receipts}
          minWidth={760}
          maxHeight={420}
          cols={[
            { key: 'd', title: 'Received', render: (r) => dayjs(r.received_at).format('D MMM, HH:mm') },
            { key: 'b', title: 'Batch', render: (r) => <Text size="xs" ff="monospace">{r.batch_ref}</Text> },
            { key: 'i', title: 'Item', render: (r) => r.item },
            { key: 'p', title: 'Property', render: (r) => r.property },
            {
              key: 'q',
              title: 'Quantity',
              align: 'right',
              render: (r) =>
                `${num(r.qty, 3)} ${r.unit || ''}${r.packs_received && r.pack_size ? ` (${r.packs_received} × ${r.pack_size})` : ''}`,
            },
            { key: 'c', title: 'Cost', align: 'right', render: (r) => kes(r.total_cost), total: (rs) => kes(rs.reduce((a, x) => a + x.total_cost, 0)) },
            { key: 'by', title: 'Received by', render: (r) => r.received_by || '—' },
          ]}
        />
      </Section>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Section title="Waste" flush>
          <DataTable
            rows={st.waste}
            minWidth={520}
            cols={[
              { key: 'd', title: 'Date', render: (r) => dayjs(r.recorded_at).format('D MMM, HH:mm') },
              { key: 'i', title: 'Item', render: (r) => r.item },
              { key: 'q', title: 'Qty', align: 'right', render: (r) => `${num(r.qty, 3)} ${r.unit || ''}` },
              { key: 'c', title: 'Cost', align: 'right', render: (r) => kes(r.cost), total: (rs) => kes(rs.reduce((a, x) => a + x.cost, 0)) },
              { key: 'r', title: 'Reason', render: (r) => r.reason || '—' },
            ]}
          />
        </Section>
        <Section title="Staff meals" flush>
          <DataTable
            rows={st.staff_meals}
            minWidth={480}
            cols={[
              { key: 'd', title: 'Date', render: (r) => dayjs(r.created_at).format('D MMM, HH:mm') },
              { key: 's', title: 'Staff', render: (r) => r.staff_name },
              { key: 'm', title: 'Meal', render: (r) => titleCase(r.meal_type) },
              { key: 'c', title: 'Cost', align: 'right', render: (r) => kes(r.cost), total: (rs) => kes(rs.reduce((a, x) => a + x.cost, 0)) },
            ]}
          />
        </Section>
      </SimpleGrid>

      <Section title="Stock movements" subtitle="Ledger entries in the period, by type">
        <BarList
          items={st.movements.map((m) => ({ label: titleCase(m.event_type), value: m.entries, color: RC.navy }))}
          empty="No stock movements in this period"
        />
      </Section>
    </Stack>
  );
}

// ═══ Activity ═══════════════════════════════════════════════════════

const AREA_COLORS: Record<string, string> = {
  Orders: RC.blue,
  Bills: RC.teal,
  Payments: RC.green,
  Cash: RC.grape,
  Stock: RC.navy,
  Store: RC.navy,
  Bar: '#E8590C',
  Production: RC.orange,
  Transfers: '#1098AD',
  Control: RC.red,
  Users: RC.muted,
  Settings: RC.muted,
};
const areaColor = (a: string) => AREA_COLORS[a] || RC.muted;

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function ActivityTab({ params, isMobile }: { params: ReportParams; isMobile: boolean }) {
  const [actor, setActor] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const activity = useReportActivity({
    ...params,
    actor_id: actor || undefined,
    area: area || undefined,
    page,
    limit: isMobile ? 25 : 50,
  });
  const d = activity.data;

  const pick = (id: string | null) => {
    setActor((cur) => (cur === id ? null : id));
    setPage(1);
  };

  if (!d) return <Group justify="center" py="xl"><Loader /></Group>;

  return (
    <Stack gap="md">
      <Section title="Who was active" subtitle="Tap a person to see only their actions">
        {d.people.length ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="sm">
            {d.people.map((p) => {
              const on = actor === p.id;
              return (
                <UnstyledButton key={p.id} onClick={() => pick(p.id)}>
                  <Card
                    withBorder
                    radius="md"
                    p="sm"
                    style={{
                      borderColor: on ? RC.blue : undefined,
                      background: on ? '#E7F5FF' : undefined,
                    }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Avatar radius="xl" size={34} style={{ background: RC.navy, color: '#FFFFFF' }}>
                        {initials(p.actor)}
                      </Avatar>
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate>
                          {p.actor}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {p.role} · {p.actions} action{p.actions === 1 ? '' : 's'}
                        </Text>
                        <Text size="10px" c="dimmed">
                          Last {dayjs(p.last_seen).format('D MMM HH:mm')}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        ) : (
          <Empty text="Nobody did anything in this period" />
        )}
      </Section>

      <Section
        title="Activity log"
        subtitle={`${num(d.meta.total)} action${d.meta.total === 1 ? '' : 's'}${activity.isFetching ? ' · updating…' : ''}`}
        flush
        right={
          <Group gap="xs" wrap="wrap">
            <Select
              size="xs"
              placeholder="Everyone"
              clearable
              value={actor}
              onChange={(v) => {
                setActor(v);
                setPage(1);
              }}
              data={d.people.map((p) => ({ value: p.id, label: p.actor }))}
              w={160}
            />
            <Select
              size="xs"
              placeholder="All areas"
              clearable
              value={area}
              onChange={(v) => {
                setArea(v);
                setPage(1);
              }}
              data={d.areas}
              w={140}
            />
          </Group>
        }
      >
        {!d.rows.length ? (
          <Empty text="No actions match" />
        ) : isMobile ? (
          <Stack gap={0}>
            {d.rows.map((r) => (
              <Box key={r.id} px="md" py="sm" style={{ borderBottom: `1px solid ${RC.track}` }}>
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="sm" fw={600} truncate>
                    {r.action}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {dayjs(r.at).format('D MMM HH:mm')}
                  </Text>
                </Group>
                {r.detail && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {r.detail}
                  </Text>
                )}
                <Group gap={6} mt={4}>
                  <AreaBadge area={r.area} />
                  <Text size="xs">
                    {r.actor}
                    {r.role ? ` · ${r.role}` : ''}
                    {r.property ? ` · ${r.property}` : ''}
                  </Text>
                </Group>
              </Box>
            ))}
          </Stack>
        ) : (
          <DataTable
            rows={d.rows}
            minWidth={820}
            rowKey={(r) => r.id}
            cols={[
              { key: 't', title: 'When', render: (r) => <Text size="sm" style={{ whiteSpace: 'nowrap' }}>{dayjs(r.at).format('D MMM, HH:mm')}</Text> },
              {
                key: 'a',
                title: 'Person',
                render: (r) => (
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {r.actor}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {r.role}
                    </Text>
                  </Stack>
                ),
              },
              { key: 'p', title: 'Property', render: (r) => r.property || '—' },
              { key: 'ar', title: 'Area', render: (r) => <AreaBadge area={r.area} /> },
              { key: 'ac', title: 'Action', render: (r) => <Text size="sm" fw={500}>{r.action}</Text> },
              { key: 'd', title: 'Details', render: (r) => <Text size="sm" c="dimmed">{r.detail || '—'}</Text> },
            ]}
          />
        )}
        {d.meta.pages > 1 && (
          <Group justify="center" py="sm">
            <Pagination total={d.meta.pages} value={page} onChange={setPage} size="sm" siblings={isMobile ? 0 : 1} />
          </Group>
        )}
      </Section>
    </Stack>
  );
}

function AreaBadge({ area }: { area: string }) {
  const c = areaColor(area);
  return (
    <Badge size="sm" variant="light" style={{ color: c, backgroundColor: `${c}1A` }}>
      {area}
    </Badge>
  );
}
