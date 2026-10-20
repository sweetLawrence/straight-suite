import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Accordion, Alert, Badge, Box, Card, Group, Loader, ScrollArea, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useItemProfit } from '@/hooks/useFinance';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/finance/items')({ component: ItemProfitPage });

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Pick dates' },
];
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

const NAVY = '#1F3A5F';
const GREEN = '#2B8A3E';
const RED = '#C92A2A';
const ORANGE = '#E8590C';
const AREA = { food: { label: 'Food', color: '#E8590C', bg: '#FFF4E6' }, bar: { label: 'Bar', color: '#862E9C', bg: '#F8F0FC' } } as const;
const marginColor = (m: number | null) => (m == null ? '#868E96' : m < 0 ? RED : m < 30 ? ORANGE : GREEN);

type Sort = 'profit' | 'margin_low' | 'sold';

/**
 * Profit per item: what each item sells for, what it costs to buy, and what we
 * keep, per piece and in total. "Sold" is real sales in a period; "Price list"
 * is every item on the menu at today's buying prices.
 */
function ItemProfitPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [tab, setTab] = useState<'sold' | 'prices'>('sold');
  const [preset, setPreset] = useState<Preset>('today');
  const [custom, setCustom] = useState<[string | null, string | null]>([null, null]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [area, setArea] = useState<'all' | 'food' | 'bar'>('all');
  const [sort, setSort] = useState<Sort>('profit');
  const [search, setSearch] = useState('');
  const properties = useProperties(1, 20);
  const [from, to] = preset === 'custom' ? [custom[0] || undefined, custom[1] || custom[0] || undefined] : rangeOf(preset);
  const q = useItemProfit({ from, to, property_id: propertyId || undefined });
  const d = q.data;

  const match = (name: string, a: string) =>
    (area === 'all' || a === area) && (!search.trim() || name.toLowerCase().includes(search.trim().toLowerCase()));
  const sold = useMemo(() => {
    const rows = (d?.items ?? []).filter((i) => match(i.name, i.area));
    if (sort === 'margin_low') return [...rows].sort((a, b) => (a.margin ?? 999) - (b.margin ?? 999));
    if (sort === 'sold') return [...rows].sort((a, b) => b.quantity - a.quantity);
    return [...rows].sort((a, b) => b.profit - a.profit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, area, sort, search]);
  const prices = useMemo(() => {
    const rows = (d?.price_list ?? []).filter((i) => match(i.name, i.area));
    if (sort === 'margin_low') return [...rows].sort((a, b) => (a.margin ?? 999) - (b.margin ?? 999));
    return [...rows].sort((a, b) => b.profit - a.profit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, area, sort, search]);

  return (
    <>
      <PageHeader title="Profit per item" subtitle="Selling price minus buying price, for every item: per piece and in total" />

      <SegmentedControl
        mb="sm"
        value={tab}
        onChange={(v) => setTab(v as 'sold' | 'prices')}
        data={[{ value: 'sold', label: 'What sold' }, { value: 'prices', label: 'Price list' }]}
      />

      {tab === 'sold' && (
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
      )}

      <Group gap="sm" mb="md" wrap="wrap" align="flex-end">
        {tab === 'sold' && preset === 'custom' && (
          <DatePickerInput
            type="range" allowSingleDateInRange placeholder="From - to" valueFormat="D MMM YYYY" maxDate={new Date()}
            value={custom}
            onChange={(v) => setCustom([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
            w={{ base: '100%', xs: 260 }}
          />
        )}
        {groupLevel && (
          <Select placeholder="Both properties" clearable w={{ base: '100%', xs: 200 }}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />
        )}
        <TextInput placeholder="Find an item" leftSection={<Search size={14} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} w={{ base: '100%', xs: 200 }} />
        <SegmentedControl size="xs" value={area} onChange={(v) => setArea(v as typeof area)} data={[{ value: 'all', label: 'All' }, { value: 'food', label: 'Food' }, { value: 'bar', label: 'Bar' }]} />
        <Select size="xs" w={170} allowDeselect={false} value={sort} onChange={(v) => setSort((v as Sort) || 'profit')}
          data={[
            { value: 'profit', label: 'Most profit first' },
            { value: 'margin_low', label: 'Lowest margin first' },
            ...(tab === 'sold' ? [{ value: 'sold', label: 'Most sold first' }] : []),
          ]} />
        {q.isFetching && <Loader size="xs" mb={6} />}
      </Group>

      {tab === 'sold' && preset === 'custom' && !custom[0] ? (
        <EmptyState title="Pick the days" description="Choose a start and end date." />
      ) : q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !d ? (
        <EmptyState title="Couldn't load" description={getErrorMessage(q.error)} />
      ) : (
        <Box maw={820}>
          <Accordion variant="contained" radius="md" mb="md">
            <Accordion.Item value="how">
              <Accordion.Control><Text size="sm" fw={600}>How is the price, cost and profit worked out?</Text></Accordion.Control>
              <Accordion.Panel>
                <Stack gap={6}>
                  <Text size="sm"><b>Price</b> is what guests were charged: total sold divided by the number sold, after any discount.</Text>
                  <Text size="sm"><b>Cost, in the Sold tab and the books:</b> every batch keeps its own buying price and the oldest batch goes out first. Say 10 kg of beef came in at KES 100 and 13 kg later at KES 120. The first 10 kg cost 100 each and the next ones cost 120 each. Nothing is averaged, so a day's cost depends on which batch was used. If a batch has no price, the average of the priced batches is used.</Text>
                  <Text size="sm"><b>Cost, in the Price list tab:</b> this uses the latest buying price (120 in that example), so it shows what you keep if you sell one today. It can differ from the Sold tab while older, cheaper stock is still on the shelf.</Text>
                  <Text size="sm"><b>Portions:</b> a portion costs the batch price divided by the portions in a kg or bird. At 2 portions to a kg, 100 a kg is 50 a portion. A tot is the bottle price divided by the tots in it. A dish with several ingredients adds them up.</Text>
                  <Text size="sm"><b>Profit</b> is price minus cost. <b>Margin</b> is profit as a percentage of the price. When VAT is on it is taken out of the price first, and "Profit (VAT taken out)" is what the business keeps.</Text>
                  <Text size="sm"><b>Not in the cost:</b> oil, flour, onions and other bulk ingredients issued to the kitchen are not counted per plate. They show in Kitchen Day, so dishes can look more profitable than they are.</Text>
                  <Text size="sm"><b>Estimated cost:</b> if an item was sold but stock never went out, its cost comes from the recipe at today's buying prices and is marked as estimated.</Text>
                  <Text size="sm"><b>Orange warnings</b> mean a cost is missing: stock received without a price, an item sold without stock going out, or a menu item with no recipe. Fix those first, then the profit is real.</Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
          {d.warnings.estimated > 0 && (
            <Alert color="blue" variant="light" mb="sm">
              <Text size="sm">
                {d.warnings.estimated} item{d.warnings.estimated === 1 ? ' was' : 's were'} sold without the stock being sent or poured. Their cost is
                worked out from the recipe at today's buying prices. Send or pour every item to track the real stock.
              </Text>
            </Alert>
          )}
          {(d.warnings.unpriced > 0 || d.warnings.no_stock > 0 || d.warnings.no_recipe > 0) && (
            <Alert color="orange" variant="light" mb="md" icon={<AlertTriangle size={16} />}>
              <Text size="sm">
                Some items show more profit than they really make:
                {d.warnings.unpriced > 0 && ` ${d.warnings.unpriced} have stock received without a buying price (fix the price when receiving);`}
                {d.warnings.no_stock > 0 && ` ${d.warnings.no_stock} were sold without stock going out (pour or send them, or link them to stock);`}
                {d.warnings.no_recipe > 0 && ` ${d.warnings.no_recipe} menu item${d.warnings.no_recipe === 1 ? " is" : "s are"} not linked to any stock.`}
              </Text>
            </Alert>
          )}

          {tab === 'sold' ? (
            <>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="md">
                <Tile label="Sold for" v={d.totals.sales} color={NAVY} bg="#EDF2F7" />
                <Tile label="Buying cost" v={-d.totals.cost} color="#495057" bg="#F1F3F5" />
                <Tile label={d.vat_rate > 0 ? 'Profit (VAT taken out)' : 'Profit'} v={d.totals.profit_after_vat} color={GREEN} bg="#EBFBEE" />
                <Tile label={d.vat_rate > 0 ? `VAT ${d.vat_rate}% in prices` : 'VAT'} v={d.totals.profit - d.totals.profit_after_vat} color="#495057" bg="#F1F3F5" />
              </SimpleGrid>
              {sold.length === 0 ? (
                <EmptyState title="Nothing sold" description="Paid bills in this period show here." />
              ) : (
                <Stack gap="xs">
                  {sold.map((i) => (
                    <Card key={i.menu_item_id} withBorder radius="md" p="sm">
                      <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                        <Box style={{ minWidth: 0 }}>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={700} truncate>{i.name}</Text>
                            <Badge size="xs" style={{ color: AREA[i.area].color, backgroundColor: AREA[i.area].bg }}>{AREA[i.area].label}</Badge>
                            {groupLevel && !propertyId && <Badge size="xs" variant="outline" color="gray">{i.property}</Badge>}
                          </Group>
                          <Text size="xs" c="dimmed">{i.quantity.toLocaleString('en-KE', { maximumFractionDigits: 2 })} sold for {formatCurrency(i.sales)}</Text>
                          <Each sell={i.price_each} cost={i.cost_each} profit={i.profit_each} margin={i.margin} />
                          <Flags unpriced={i.unpriced} noStock={i.no_stock && !i.estimated} estimated={i.estimated} />
                        </Box>
                        <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                          <Text size="xs" c="dimmed">Profit</Text>
                          <Text fw={800} style={{ color: i.profit_after_vat < 0 ? RED : GREEN, whiteSpace: 'nowrap' }}>{formatCurrency(i.profit_after_vat)}</Text>
                          {d.vat_rate > 0 && <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>before VAT {formatCurrency(i.profit)}</Text>}
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
              <Text size="xs" c="dimmed" mt="sm">
                Only paid bills count. Buying cost is what the stock that went out for these items cost. Kitchen raw food given out
                in bulk (not per plate) is in the Money page, not here.
              </Text>
            </>
          ) : (
            <>
              <Text size="sm" c="dimmed" mb="sm">
                Every item on the menu now: its price, what one portion costs at the latest buying price, and what you keep.
              </Text>
              <Stack gap="xs">
                {prices.map((p) => (
                  <Card key={p.menu_item_id} withBorder radius="md" p="sm">
                    <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                      <Box style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <Text size="sm" fw={700} truncate>{p.name}</Text>
                          <Badge size="xs" style={{ color: AREA[p.area].color, backgroundColor: AREA[p.area].bg }}>{AREA[p.area].label}</Badge>
                          {groupLevel && !propertyId && <Badge size="xs" variant="outline" color="gray">{p.property}</Badge>}
                        </Group>
                        <Each sell={p.price} cost={p.cost} profit={p.profit} margin={p.margin} />
                        {p.made_of && <Text size="xs" c="dimmed" lineClamp={2}>Made of {p.made_of}</Text>}
                        <Flags unpriced={p.unpriced && !p.no_recipe} noRecipe={p.no_recipe} />
                      </Box>
                      <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                        <Text size="xs" c="dimmed">Each</Text>
                        <Text fw={800} style={{ color: p.profit < 0 ? RED : GREEN, whiteSpace: 'nowrap' }}>{formatCurrency(p.profit)}</Text>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>after VAT {formatCurrency(p.profit_after_vat)}</Text>
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </Box>
      )}
    </>
  );
}

/** "Sells 100 · buys 50 · keeps 50 (50%)" */
function Each({ sell, cost, profit, margin }: { sell: number; cost: number; profit: number; margin: number | null }) {
  return (
    <Group gap={6} mt={4} wrap="wrap">
      <Text size="xs">Sells <b>{formatCurrency(sell)}</b></Text>
      <Text size="xs" c="dimmed">·</Text>
      <Text size="xs">buys <b>{formatCurrency(cost)}</b></Text>
      <Text size="xs" c="dimmed">·</Text>
      <Text size="xs" style={{ color: profit < 0 ? RED : GREEN }}>keeps <b>{formatCurrency(profit)}</b> each</Text>
      {margin != null && (
        <Badge size="xs" style={{ color: marginColor(margin), backgroundColor: '#F8F9FA', border: `1px solid ${marginColor(margin)}` }}>{margin}%</Badge>
      )}
    </Group>
  );
}

function Flags({ unpriced, noStock, noRecipe, estimated }: { unpriced?: boolean; noStock?: boolean; noRecipe?: boolean; estimated?: boolean }) {
  if (!unpriced && !noStock && !noRecipe && !estimated) return null;
  return (
    <Text size="xs" mt={2} style={{ color: ORANGE }}>
      {[
        estimated ? 'Some sold without stock going out: costed from the recipe' : null,
        unpriced ? 'Some stock has no buying price' : null,
        noStock ? 'Some sold without stock going out' : null,
        noRecipe ? 'Not linked to stock' : null,
      ].filter(Boolean).join(' · ')}
    </Text>
  );
}

function Tile({ label, v, color, bg }: { label: string; v: number; color: string; bg: string }) {
  return (
    <Card radius="md" p="sm" style={{ background: bg }}>
      <Text size="xs" fw={600} style={{ color }}>{label}</Text>
      <Text fw={800} fz={{ base: 15, sm: 18 }} style={{ color, whiteSpace: 'nowrap' }}>
        {v < 0 ? `−${formatCurrency(-v)}` : formatCurrency(v)}
      </Text>
    </Card>
  );
}
