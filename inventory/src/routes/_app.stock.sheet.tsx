import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Group, Loader, ScrollArea, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { Download, Printer, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useStockSheet } from '@/hooks/useStockSheet';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { SheetItem } from '@/lib/api/stockSheet';
import { downloadStockSheet } from '@/components/stock/stockSheetCsv';
import { formatCurrency } from '@/lib/utils/format';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/stock/sheet')({ component: StockSheetPage });

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Pick dates' },
];
const STORE_LABEL: Record<string, string> = { bar_store: 'Bar', food_store: 'Food store', kitchen: 'Kitchen' };
const NAVY = '#1F3A5F';
const GREEN = '#2B8A3E';
const RED = '#C92A2A';

const tradingToday = () => dayjs().subtract(6, 'hour');
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
const rangeOf = (p: Preset): [string, string] => {
  const t = tradingToday();
  if (p === 'yesterday') return [fmt(t.subtract(1, 'day')), fmt(t.subtract(1, 'day'))];
  if (p === 'week') return [fmt(t.subtract((t.day() + 6) % 7, 'day')), fmt(t)];
  if (p === 'month') return [fmt(t.startOf('month')), fmt(t)];
  return [fmt(t), fmt(t)];
};
const qty = (v: number) => (v ? v.toLocaleString('en-KE', { maximumFractionDigits: 3 }) : '0');
const money = (v: number | null) => (v == null ? '-' : formatCurrency(v));

/**
 * The daily stock sheet the bar and store used to write by hand: opening,
 * what came in, what was sold or used, closing, and the profit on each unit.
 */
function StockSheetPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const barOnly = auth.hasRole('bar_attendant') && !auth.hasRole('manager', 'md', 'admin', 'auditor', 'supervisor', 'store_manager');
  const [preset, setPreset] = useState<Preset>('today');
  const [custom, setCustom] = useState<[string | null, string | null]>([null, null]);
  const [store, setStore] = useState<string>(barOnly ? 'bar_store' : auth.hasRole('store_manager') ? 'food_store' : 'bar_store');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [movedOnly, setMovedOnly] = useState(false);
  const properties = useProperties(1, 20);
  const pid = groupLevel ? propertyId || properties.data?.data?.[0]?.id || undefined : undefined;
  const [from, to] = preset === 'custom' ? [custom[0] || undefined, custom[1] || custom[0] || undefined] : rangeOf(preset);
  const q = useStockSheet({ from, to, store: store === 'all' ? undefined : store, property_id: pid }, (preset !== 'custom' || !!custom[0]) && (!groupLevel || !!pid));
  const d = q.data;

  const items = useMemo(
    () =>
      (d?.items ?? []).filter(
        (i) =>
          (!search.trim() || i.name.toLowerCase().includes(search.trim().toLowerCase())) &&
          (!movedOnly || i.received || i.sold || i.issued || i.waste || i.staff_house || i.transferred || i.corrected)
      ),
    [d, search, movedOnly]
  );
  const propertyName = (properties.data?.data ?? []).find((p) => p.id === (pid || d?.property_id))?.name ?? '';
  const printUrl = `/stock-sheet?from=${from ?? ''}&to=${to ?? ''}&store=${store}${pid ? `&property_id=${pid}` : ''}`;

  return (
    <>
      <PageHeader
        title="Stock sheet"
        subtitle="Opening, received, sold, closing and profit per unit, worked out from what was recorded. Nothing to write by hand."
        actions={
          d ? (
            <Group gap="xs">
              <Button size="sm" variant="light" leftSection={<Download size={15} />} onClick={() => downloadStockSheet(d, propertyName)}>Excel</Button>
              <Button size="sm" variant="default" leftSection={<Printer size={15} />} onClick={() => openPrint(printUrl, 'Stock sheet')}>Print</Button>
            </Group>
          ) : undefined
        }
      />

      <ScrollArea type="never" mb="sm">
        <Group gap={6} wrap="nowrap" pb={4}>
          {PRESETS.map((p) => (
            <UnstyledButton
              key={p.value}
              onClick={() => setPreset(p.value)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
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

      <Group gap="sm" mb="md" wrap="wrap" align="flex-end">
        {preset === 'custom' && (
          <DatePickerInput
            type="range" allowSingleDateInRange placeholder="From - to" valueFormat="D MMM YYYY" maxDate={new Date()}
            value={custom}
            onChange={(v) => setCustom([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
            w={{ base: '100%', xs: 260 }}
          />
        )}
        {!barOnly && (
          <SegmentedControl
            value={store}
            onChange={setStore}
            data={[{ value: 'bar_store', label: 'Bar' }, { value: 'food_store', label: 'Food store' }, { value: 'kitchen', label: 'Kitchen' }, { value: 'all', label: 'All' }]}
          />
        )}
        {groupLevel && (
          <Select w={{ base: '100%', xs: 200 }} allowDeselect={false}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={pid ?? null} onChange={setPropertyId} />
        )}
        <TextInput placeholder="Find an item" leftSection={<Search size={14} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} w={{ base: '100%', xs: 200 }} />
        <SegmentedControl size="xs" value={movedOnly ? 'moved' : 'all'} onChange={(v) => setMovedOnly(v === 'moved')}
          data={[{ value: 'all', label: 'All items' }, { value: 'moved', label: 'Moved only' }]} />
        {q.isFetching && <Loader size="xs" mb={6} />}
      </Group>

      {preset === 'custom' && !custom[0] ? (
        <EmptyState title="Pick the days" description="Choose a start and end date." />
      ) : q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !d ? (
        <EmptyState title="Couldn't load the stock sheet" description={getErrorMessage(q.error)} />
      ) : (
        <>
          <Text size="xs" fw={700} tt="uppercase" mb="xs" style={{ color: '#495057', letterSpacing: 0.4 }}>
            {d.from === d.to ? dayjs(d.from).format('dddd D MMM YYYY') : `${dayjs(d.from).format('D MMM')} to ${dayjs(d.to).format('D MMM YYYY')}`}
            {' · '}{d.store === 'all' ? 'All stores' : STORE_LABEL[d.store]}
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="md">
            <Tile label="Sold for" v={d.totals.sold_value} color={NAVY} bg="#EDF2F7" />
            <Tile label="Bought at" v={d.totals.sold_cost} color="#495057" bg="#F1F3F5" />
            <Tile label="Profit" v={d.totals.profit} color={d.totals.profit < 0 ? RED : GREEN} bg={d.totals.profit < 0 ? '#FFF5F5' : '#EBFBEE'} />
            <Tile label="Stock value at close" v={d.totals.closing_value} color="#1971C2" bg="#E7F5FF" />
          </SimpleGrid>

          {items.length === 0 ? (
            <EmptyState title="Nothing here" description="No stock for this store in this period." />
          ) : (
            <>
              <Stack gap="xs" hiddenFrom="md">
                {items.map((i) => <ItemCard key={i.stock_item_id} i={i} />)}
              </Stack>
              <Box visibleFrom="md">
                <SheetTable items={items} />
              </Box>
            </>
          )}
          <Text size="xs" c="dimmed" mt="sm">
            Sold = poured or sent for sales. Used = given to the kitchen, events or production. Corrections are stock take
            differences. Profit counts items that have both a buying and a selling price; bottles sold by the tot use the tot price × tots per bottle.
          </Text>
        </>
      )}
    </>
  );
}

function Tile({ label, v, color, bg }: { label: string; v: number; color: string; bg: string }) {
  return (
    <Card radius="md" p="sm" style={{ background: bg }}>
      <Text size="xs" fw={600} style={{ color }}>{label}</Text>
      <Text fw={800} fz={{ base: 15, sm: 18 }} style={{ color, whiteSpace: 'nowrap' }}>{formatCurrency(v)}</Text>
    </Card>
  );
}

/** Phone: one card per item, the sheet's columns as a sum */
function ItemCard({ i }: { i: SheetItem }) {
  const out = i.issued + i.waste + i.staff_house + i.transferred;
  const low = i.reorder_level != null && i.closing <= i.reorder_level;
  const step = (label: string, v: number, sign = '', color = '#212529') => (
    <Box ta="center" style={{ minWidth: 0 }}>
      <Text size="10px" c="dimmed" tt="uppercase" style={{ letterSpacing: 0.3 }}>{label}</Text>
      <Text size="sm" fw={700} style={{ color }}>{sign}{qty(v)}</Text>
    </Box>
  );
  return (
    <Card withBorder radius="md" p="sm">
      <Group justify="space-between" wrap="nowrap" mb={6}>
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <Text size="sm" fw={700} truncate>{i.name}</Text>
          {i.unit && <Text size="xs" c="dimmed">({i.unit})</Text>}
        </Group>
        {i.pack_size ? <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>≈ {Math.round((i.closing / i.pack_size) * 10) / 10} {i.pack_label}</Text> : null}
        {low && <Badge size="xs" color="orange" variant="light">Low</Badge>}
      </Group>
      <SimpleGrid cols={5} spacing={4}>
        {step('Open', i.opening)}
        {step('In', i.received, '+', GREEN)}
        {step('Sold', i.sold, '−', NAVY)}
        {step('Other', out + (i.corrected < 0 ? -i.corrected : 0), '−', '#E8590C')}
        {step('Close', i.closing, '', '#1971C2')}
      </SimpleGrid>
      {i.corrected > 0 && <Text size="xs" c="dimmed" mt={4}>+{qty(i.corrected)} found at stock take</Text>}
      {(i.buy_price != null || i.sell_price != null) && (
        <Group gap={6} mt={6} wrap="wrap" pt={6} style={{ borderTop: '1px solid #F1F3F5' }}>
          <Text size="xs">Buy <b>{money(i.buy_price)}</b></Text>
          {i.sell_price != null && <Text size="xs">· Sell <b>{money(i.sell_price)}</b></Text>}
          {i.profit_each != null && (
            <Text size="xs" style={{ color: i.profit_each < 0 ? RED : GREEN }}>
              · keep <b>{money(i.profit_each)}</b>{i.margin != null ? ` (${i.margin}%)` : ''}
            </Text>
          )}
          {i.profit != null && i.sold > 0 && (
            <Text size="xs" fw={700} ml="auto" style={{ color: i.profit < 0 ? RED : GREEN }}>Profit {money(i.profit)}</Text>
          )}
        </Group>
      )}
    </Card>
  );
}

/** Desktop: the full sheet */
function SheetTable({ items }: { items: SheetItem[] }) {
  const th = (t: string) => <Table.Th key={t} style={{ whiteSpace: 'nowrap', textAlign: t === 'Item' ? 'left' : 'right', fontSize: 12 }}>{t}</Table.Th>;
  const td = (v: string | number, color?: string, strong?: boolean) => (
    <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap', color, fontWeight: strong ? 700 : 400, fontSize: 13 }}>{v}</Table.Td>
  );
  return (
    <Card withBorder radius="md" p={0}>
      <Table.ScrollContainer minWidth={1100}>
        <Table striped highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              {['Item', 'Opening', 'In', 'Sold', 'Used', 'Waste', 'Staff/house', 'Transfer', 'Correction', 'Closing', 'Buy', 'Sell', 'Keep each', 'Sold for', 'Profit'].map(th)}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((i) => (
              <Table.Tr key={i.stock_item_id}>
                <Table.Td style={{ fontSize: 13 }}>
                  <Text size="sm" fw={600}>{i.name}</Text>
                  <Text size="xs" c="dimmed">{STORE_LABEL[i.store]}{i.unit ? ` · ${i.unit}` : ''}{i.pack_size ? ` · closing ≈ ${Math.round((i.closing / i.pack_size) * 10) / 10} ${i.pack_label}` : ''}</Text>
                </Table.Td>
                {td(qty(i.opening))}
                {td(i.received ? `+${qty(i.received)}` : '0', i.received ? GREEN : undefined)}
                {td(qty(i.sold), NAVY, !!i.sold)}
                {td(qty(i.issued))}
                {td(qty(i.waste), i.waste ? '#E8590C' : undefined)}
                {td(qty(i.staff_house))}
                {td(qty(i.transferred))}
                {td(i.corrected ? `${i.corrected > 0 ? '+' : ''}${qty(i.corrected)}` : '0', i.corrected < 0 ? RED : undefined)}
                {td(qty(i.closing), '#1971C2', true)}
                {td(money(i.buy_price))}
                {td(money(i.sell_price))}
                {td(money(i.profit_each), i.profit_each != null && i.profit_each < 0 ? RED : GREEN)}
                {td(money(i.sold_value))}
                {td(money(i.profit), i.profit != null && i.profit < 0 ? RED : GREEN, true)}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
