import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Divider, Group, Loader, ScrollArea, Select, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { Calculator, Landmark, RefreshCw, Tags } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { VatSwitch } from '@/components/settings/VatSwitch';
import { SignedBillSwitch } from '@/components/settings/SignedBillSwitch';
import { EmptyState } from '@/components/EmptyState';
import { useOverview } from '@/hooks/useFinance';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { MoneyOverview } from '@/lib/api/finance';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/finance/overview')({ component: MoneyPage });

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Pick dates' },
];

const NAVY = '#1F3A5F';
const GREEN = '#2B8A3E';
const RED = '#C92A2A';
const AREA = {
  food: { color: '#E8590C', bg: '#FFF4E6' },
  bar: { color: '#862E9C', bg: '#F8F0FC' },
  events: { color: '#1971C2', bg: '#E7F5FF' },
} as const;
const KIND = {
  loss: '#E03131',
  cost: '#E8590C',
  cash: '#1F3A5F',
  income: '#2B8A3E',
  info: '#868E96',
} as const;

const tradingToday = () => dayjs().subtract(6, 'hour');
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
const rangeOf = (p: Preset): [string, string] => {
  const t = tradingToday();
  if (p === 'yesterday') return [fmt(t.subtract(1, 'day')), fmt(t.subtract(1, 'day'))];
  if (p === 'week') return [fmt(t.subtract((t.day() + 6) % 7, 'day')), fmt(t)];
  if (p === 'month') return [fmt(t.startOf('month')), fmt(t)];
  if (p === 'year') return [fmt(t.startOf('year')), fmt(t)];
  return [fmt(t), fmt(t)];
};
const pct = (v: number | null) => (v == null ? '' : `${v}%`);
const signed = (v: number) => (v < 0 ? `−${formatCurrency(-v)}` : formatCurrency(v));

/** The MD's live view of the money: revenue, costs, profit, and what happened */
function MoneyPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [preset, setPreset] = useState<Preset>('today');
  const [custom, setCustom] = useState<[string | null, string | null]>([null, null]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const properties = useProperties(1, 20);
  const [from, to] = preset === 'custom' ? [custom[0] || undefined, custom[1] || custom[0] || undefined] : rangeOf(preset);
  const q = useOverview({ from, to, property_id: propertyId || undefined });
  const o = q.data;

  return (
    <>
      <PageHeader
        title="Money"
        subtitle="Revenue, costs and profit as they happen. Updates every 30 seconds."
        actions={
          <Group gap="xs">
            <Button variant="light" size="sm" leftSection={<Tags size={15} />} component={Link} to="/finance/items">Per item</Button>
            <Button variant="light" size="sm" leftSection={<Landmark size={15} />} component={Link} to="/finance">Months</Button>
            <Button variant="light" size="sm" leftSection={<Calculator size={15} />} component={Link} to="/finance/cost-of-sales">Cost of sales</Button>
          </Group>
        }
      />
      <VatSwitch />
      <SignedBillSwitch />

      <ScrollArea type="never" mb="sm">
        <Group gap={6} wrap="nowrap" pb={4}>
          {PRESETS.map((p) => (
            <UnstyledButton
              key={p.value}
              onClick={() => setPreset(p.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: `1px solid ${preset === p.value ? NAVY : '#DEE2E6'}`,
                background: preset === p.value ? NAVY : '#FFFFFF',
                color: preset === p.value ? '#FFFFFF' : '#212529',
              }}
            >
              {p.label}
            </UnstyledButton>
          ))}
        </Group>
      </ScrollArea>
      <Group gap="sm" mb="md" align="flex-end" wrap="wrap">
        {preset === 'custom' && (
          <DatePickerInput
            type="range"
            allowSingleDateInRange
            placeholder="From - to"
            valueFormat="D MMM YYYY"
            maxDate={new Date()}
            value={custom}
            onChange={(v) => setCustom([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
            w={{ base: '100%', xs: 260 }}
          />
        )}
        {groupLevel && (
          <Select
            placeholder="Both properties"
            clearable
            w={{ base: '100%', xs: 200 }}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={propertyId}
            onChange={setPropertyId}
          />
        )}
        {o && (
          <Group gap={4}>
            {q.isFetching ? <Loader size={12} /> : <RefreshCw size={12} color="#868E96" />}
            <Text size="xs" c="dimmed">Updated {dayjs(o.as_of).format('HH:mm:ss')}</Text>
          </Group>
        )}
      </Group>

      {preset === 'custom' && !custom[0] ? (
        <EmptyState title="Pick the days" description="Choose a start and end date." />
      ) : q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !o ? (
        <EmptyState title="Couldn't load the figures" description={getErrorMessage(q.error)} />
      ) : (
        <Box maw={820}>
          <Stack gap="md">
            <Text size="xs" fw={700} tt="uppercase" style={{ color: '#495057', letterSpacing: 0.4 }}>
              {o.from === o.to ? dayjs(o.from).format('dddd D MMM YYYY') : `${dayjs(o.from).format('D MMM')} to ${dayjs(o.to).format('D MMM YYYY')}`}
            </Text>
            <Hero o={o} />
            <Areas o={o} />
            <Waterfall o={o} />
            {groupLevel && !propertyId && o.properties.length > 1 && <ByProperty o={o} />}
            <Activity o={o} />
            <Feed o={o} groupLevel={groupLevel} />
            <Text size="xs" c="dimmed">
              Sales count when a bill is paid; costs count when stock goes out, so a busy kitchen with unpaid tables can look
              short until they pay. Events count on the event date, before VAT. Menu prices include VAT at {o.vat_rate}%.
            </Text>
          </Stack>
        </Box>
      )}
    </>
  );
}

function Hero({ o }: { o: MoneyOverview }) {
  const up = o.net_profit >= 0;
  const cell = (label: string, v: number, sub?: string) => (
    <Box>
      <Text size="xs" style={{ color: '#D0DCEB' }}>{label}</Text>
      <Text fw={800} fz={{ base: 15, sm: 18 }} style={{ whiteSpace: 'nowrap' }}>{signed(v)}</Text>
      {sub && <Text size="xs" style={{ color: '#D0DCEB' }}>{sub}</Text>}
    </Box>
  );
  return (
    <Card radius="lg" p="lg" style={{ background: NAVY, color: '#FFFFFF' }}>
      <Text size="sm" style={{ color: '#D0DCEB' }}>Net profit</Text>
      <Group gap="sm" align="baseline">
        <Text fw={800} fz={{ base: 30, sm: 38 }} lh={1.1} style={{ color: up ? '#FFFFFF' : '#FFC9C9', letterSpacing: '-0.02em' }}>
          {signed(o.net_profit)}
        </Text>
        {o.net_margin != null && (
          <Badge style={{ background: up ? '#2B8A3E' : '#E03131', color: '#FFFFFF' }}>{pct(o.net_margin)}</Badge>
        )}
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mt="md">
        {cell('Gross revenue', o.gross_revenue)}
        {cell('Net revenue', o.net_revenue, 'after house and VAT')}
        {cell('Gross profit', o.gross_profit, pct(o.gross_margin))}
        {cell('Expenses', -o.expenses)}
      </SimpleGrid>
    </Card>
  );
}

/** Food, bar and events: what each sold, what it cost, what it made */
function Areas({ o }: { o: MoneyOverview }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
      {o.areas.map((a) => {
        const c = AREA[a.key];
        const m = a.margin ?? 0;
        return (
          <Card key={a.key} withBorder radius="md" p="md" style={{ borderColor: c.bg }}>
            <Group justify="space-between" mb={6}>
              <Text fw={700} style={{ color: c.color }}>{a.label}</Text>
              {a.margin != null && <Badge style={{ color: c.color, backgroundColor: c.bg }}>{pct(a.margin)}</Badge>}
            </Group>
            <Row label="Sales" v={a.sales} />
            {a.net !== a.sales && <Row label="After house and VAT" v={a.net} muted />}
            <Row label="Stock cost" v={-a.cost} />
            {a.estimated > 0 && <Text size="xs" c="dimmed">{formatCurrency(a.estimated)} of it estimated from recipes</Text>}
            {a.key === 'events' && (o.activity.events_no_stock?.count ?? 0) > 0 && (
              <Text size="xs" style={{ color: '#E8590C' }}>
                {o.activity.events_no_stock.count} event{o.activity.events_no_stock.count === 1 ? '' : 's'} ({formatCurrency(o.activity.events_no_stock.amount)}) had no
                stock issued, so their food cost is not counted yet
              </Text>
            )}
            <Divider my={4} />
            <Row label="Profit" v={a.profit} strong color={a.profit < 0 ? RED : GREEN} />
            <Box mt={6} style={{ height: 6, background: '#F1F3F5', borderRadius: 4, overflow: 'hidden' }}>
              <Box style={{ width: `${Math.max(0, Math.min(100, m))}%`, height: '100%', background: c.color }} />
            </Box>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}

function Row({ label, v, strong, muted, color }: { label: string; v: number; strong?: boolean; muted?: boolean; color?: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" py={3} gap="sm">
      <Text size="sm" c={muted ? 'dimmed' : undefined} fw={strong ? 700 : 400}>{label}</Text>
      <Text size="sm" fw={strong ? 800 : 500} style={{ whiteSpace: 'nowrap', color: color || (v < 0 ? RED : '#212529') }}>{signed(v)}</Text>
    </Group>
  );
}

/** From gross revenue down to net profit, every deduction on its own line */
function Waterfall({ o }: { o: MoneyOverview }) {
  const total = (label: string, v: number, bg: string, color: string) => (
    <Box px="sm" py={6} my={4} style={{ background: bg, borderRadius: 8 }}>
      <Row label={label} v={v} strong color={color} />
    </Box>
  );
  return (
    <Card withBorder radius="md" p="md">
      <Text fw={700} mb="xs">How the profit is made</Text>
      <Row label="Gross revenue (paid bills and events)" v={o.gross_revenue} />
      {o.house !== 0 && <Row label="Less house (complimentary) bills" v={o.house} muted />}
      {o.vat !== 0 && <Row label="Less VAT in bill prices" v={o.vat} muted />}
      {total('Net revenue', o.net_revenue, '#F1F3F5', NAVY)}
      {o.areas.map((a) => a.cost - a.estimated !== 0 && <Row key={a.key} label={`Less ${a.label.toLowerCase()} stock`} v={-(a.cost - a.estimated)} />)}
      {o.areas.map((a) => a.estimated !== 0 && (
        <Row key={`${a.key}-est`} label={`Less ${a.key === 'bar' ? 'drinks' : 'food'} sold with no stock out (recipe estimate)`} v={-a.estimated} muted />
      ))}
      {total('Gross profit', o.gross_profit, '#E7F5FF', '#1864AB')}
      {o.expense_lines.length === 0 ? (
        <Text size="sm" c="dimmed" py={3}>No expenses</Text>
      ) : (
        o.expense_lines.map((x) => <Row key={x.key} label={`Less ${x.label.charAt(0).toLowerCase()}${x.label.slice(1)}`} v={-x.amount} />)
      )}
      {total('Net profit', o.net_profit, o.net_profit < 0 ? '#FFF5F5' : '#EBFBEE', o.net_profit < 0 ? RED : GREEN)}
      {o.unpaid_bills > 0 && <Text size="xs" c="dimmed">Unpaid bills of {formatCurrency(o.unpaid_bills)} are not in revenue yet.</Text>}
    </Card>
  );
}

function ByProperty({ o }: { o: MoneyOverview }) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Text fw={700} px="md" py="sm" style={{ borderBottom: '1px solid #F1F3F5' }}>By property</Text>
      {o.properties.map((p) => (
        <Group key={p.id} justify="space-between" wrap="nowrap" px="md" py="xs" style={{ borderBottom: '1px solid #F1F3F5' }}>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={700}>{p.name}</Text>
            <Text size="xs" c="dimmed">
              Net revenue {formatCurrency(p.net_revenue)} · gross profit {formatCurrency(p.gross_profit)}
            </Text>
          </Box>
          <Text size="sm" fw={800} style={{ whiteSpace: 'nowrap', color: p.net_profit < 0 ? RED : GREEN }}>{signed(p.net_profit)}</Text>
        </Group>
      ))}
    </Card>
  );
}

/** Other money things that happened in the period */
function Activity({ o }: { o: MoneyOverview }) {
  const a = o.activity;
  const tiles: { label: string; v: number; hint: string; color: string; bg: string; to: string }[] = [
    { label: 'With cashiers, not yet with you', v: a.not_with_md, hint: 'all time', color: NAVY, bg: '#EDF2F7', to: '/cash-handovers' },
    { label: 'Unpaid bills', v: o.unpaid_bills, hint: 'open bills in the period', color: '#E8590C', bg: '#FFF4E6', to: '/bills' },
    { label: 'Guests paying later', v: a.pay_later?.amount ?? 0, hint: `${a.pay_later?.count ?? 0} bills, any date`, color: '#D9480F', bg: '#FFF4E6', to: '/pay-later' },
    { label: 'Event balances owed', v: a.events_owed.amount, hint: `${a.events_owed.count} events`, color: '#1971C2', bg: '#E7F5FF', to: '/events' },
    { label: 'Event money in', v: a.event_payments.amount, hint: `${a.event_payments.count} payments`, color: GREEN, bg: '#EBFBEE', to: '/events' },
    { label: 'Stock bought', v: a.stock_bought.amount, hint: `${a.stock_bought.count} deliveries`, color: '#495057', bg: '#F1F3F5', to: '/purchase-orders' },
    { label: 'Petty cash', v: a.petty_expenses.amount + a.petty_stock.amount, hint: `${formatCurrency(a.petty_stock.amount)} of it stock`, color: '#495057', bg: '#F1F3F5', to: '/petty-cash' },
    { label: 'Discounts given', v: a.discounts.amount, hint: `${a.discounts.count} bills`, color: '#E03131', bg: '#FFF5F5', to: '/bills' },
    { label: 'Bills voided', v: a.voided_bills.amount, hint: `${a.voided_bills.count} bills`, color: '#E03131', bg: '#FFF5F5', to: '/bills' },
    { label: 'Short on handovers', v: a.handover_short.amount, hint: `${a.handover_short.count} disputed`, color: '#E03131', bg: '#FFF5F5', to: '/cash-handovers' },
  ];
  return (
    <Box>
      <Text fw={700} mb="xs">Other money</Text>
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
        {tiles.map((t) => (
          <Card key={t.label} radius="md" p="sm" component={Link} to={t.to} style={{ background: t.bg, color: 'inherit', textDecoration: 'none' }}>
            <Text size="xs" fw={600} style={{ color: t.color }} lineClamp={2}>{t.label}</Text>
            <Text fw={800} fz={{ base: 15, sm: 17 }} style={{ color: t.color, whiteSpace: 'nowrap' }}>{formatCurrency(t.v)}</Text>
            <Text size="xs" c="dimmed" truncate>{t.hint}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}

/** What happened, newest first */
function Feed({ o, groupLevel }: { o: MoneyOverview; groupLevel: boolean }) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid #F1F3F5' }}>
        <Text fw={700}>What happened</Text>
        <Text size="xs" c="dimmed">{o.feed.length >= 80 ? 'latest 80' : o.feed.length}</Text>
      </Group>
      {o.feed.length === 0 ? (
        <Text size="sm" c="dimmed" px="md" py="md">Nothing yet in this period</Text>
      ) : (
        <ScrollArea.Autosize mah={520}>
          {o.feed.map((f) => (
            <Group key={f.id} justify="space-between" wrap="nowrap" align="flex-start" px="md" py="xs" gap="sm" style={{ borderBottom: '1px solid #F1F3F5' }}>
              <Group gap={8} wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                <Box mt={6} w={8} h={8} style={{ borderRadius: 999, background: KIND[f.kind], flexShrink: 0 }} />
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>{f.label}</Text>
                  {f.detail && <Text size="xs" lineClamp={1}>{f.detail}</Text>}
                  <Text size="xs" c="dimmed">
                    {dayjs(f.at).format('D MMM HH:mm')}
                    {f.by ? ` · ${f.by}` : ''}
                    {groupLevel && f.property ? ` · ${f.property}` : ''}
                  </Text>
                  {f.note && <Text size="xs" c="dimmed" lineClamp={1}>"{f.note}"</Text>}
                </Box>
              </Group>
              {f.amount != null && (
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: KIND[f.kind] }}>{formatCurrency(f.amount)}</Text>
              )}
            </Group>
          ))}
        </ScrollArea.Autosize>
      )}
    </Card>
  );
}
