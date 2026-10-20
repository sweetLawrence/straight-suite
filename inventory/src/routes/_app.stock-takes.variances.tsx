import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Button, Card, Group, Loader, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { STORE_OPTIONS, ST, TAKE_STATUS, varColor } from '@/components/stock-takes/parts';
import { useVariances } from '@/hooks/useStockTakes';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/stock-takes/variances')({
  component: VariancesPage,
});

type Period = 'week' | 'month' | 'last_month' | 'range';
const today = () => dayjs().subtract(6, 'hour');
const qty = (v: number) => v.toLocaleString('en-KE', { maximumFractionDigits: 3 });

function VariancesPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const properties = useProperties(1, 20);
  const [period, setPeriod] = useState<Period>('week');
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [store, setStore] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [from, to] =
    period === 'week'
      ? [today().subtract(6, 'day'), today()]
      : period === 'month'
      ? [today().startOf('month'), today()]
      : period === 'last_month'
      ? [today().subtract(1, 'month').startOf('month'), today().subtract(1, 'month').endOf('month')]
      : [range[0] ? dayjs(range[0]) : null, range[1] ? dayjs(range[1]) : null];

  const query = useVariances({
    from: from?.format('YYYY-MM-DD'),
    to: to?.format('YYYY-MM-DD'),
    store_type: store || undefined,
    property_id: groupLevel ? propertyId || undefined : undefined,
  });
  const v = query.data;

  return (
    <>
      <Button component={Link} to="/stock-takes" variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">
        Stock takes
      </Button>
      <PageHeader
        title="Variances"
        subtitle={
          <>
            What counts found missing or extra
            {query.isFetching && <Loader size={10} ml={8} />}
          </>
        }
      />

      <SimpleGrid cols={{ base: 2, sm: groupLevel ? 4 : 3 }} spacing="sm" mb="md">
        <Select
          label="Period"
          value={period}
          onChange={(x) => setPeriod((x as Period) || 'week')}
          allowDeselect={false}
          data={[
            { value: 'week', label: 'Last 7 days' },
            { value: 'month', label: 'This month' },
            { value: 'last_month', label: 'Last month' },
            { value: 'range', label: 'Pick dates' },
          ]}
        />
        <Select label="Store" placeholder="All stores" clearable value={store} onChange={setStore} data={STORE_OPTIONS} />
        {groupLevel && (
          <Select
            label="Property"
            placeholder="Both"
            clearable
            value={propertyId}
            onChange={setPropertyId}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.code }))}
          />
        )}
        {period === 'range' && (
          <DatePickerInput
            type="range"
            label="Dates"
            value={range}
            onChange={(x) => setRange([x[0] ? dayjs(x[0]).format('YYYY-MM-DD') : null, x[1] ? dayjs(x[1]).format('YYYY-MM-DD') : null])}
            maxDate={new Date()}
            valueFormat="D MMM"
          />
        )}
      </SimpleGrid>

      {query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error || !v ? (
        <EmptyState title="Couldn't load variances" description={query.error ? getErrorMessage(query.error) : ''} />
      ) : (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Tile label="Missing at cost" value={formatCurrency(v.totals.short_value)} color={v.totals.short_value ? ST.red : ST.navy} />
            <Tile label="Missing at selling price" value={formatCurrency(v.totals.short_sell_value)} color={v.totals.short_sell_value ? ST.red : ST.navy} hint="Bar drinks" />
            <Tile label="Extra found" value={formatCurrency(v.totals.over_value)} color={v.totals.over_value ? ST.green : ST.navy} />
            <Tile label="Net" value={formatCurrency(v.totals.net_value)} color={varColor(v.totals.net_value)} hint={`${v.totals.takes} counts`} />
          </SimpleGrid>

          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Text fw={600} size="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${ST.line}` }}>
              By item, most missing first
            </Text>
            {v.items.length === 0 ? (
              <Text size="sm" c="dimmed" p="md">
                No differences in this period.
              </Text>
            ) : (
              v.items.map((i) => (
                <Group key={i.stock_item_id} justify="space-between" align="flex-start" wrap="nowrap" gap="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${ST.line}` }}>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} lineClamp={2}>
                      {i.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {i.short_qty > 0 ? `${qty(i.short_qty)} missing` : ''}
                      {i.short_qty > 0 && i.over_qty > 0 ? ' · ' : ''}
                      {i.over_qty > 0 ? `${qty(i.over_qty)} extra` : ''} {i.unit || ''} · {i.counts} count{i.counts === 1 ? '' : 's'}
                    </Text>
                  </Box>
                  <Box ta="right" style={{ flexShrink: 0 }}>
                    {i.short_value > 0 && (
                      <Text size="sm" fw={800} style={{ color: ST.red }}>
                        −{formatCurrency(i.short_value)}
                      </Text>
                    )}
                    {i.over_value > 0 && (
                      <Text size="sm" fw={700} style={{ color: ST.green }}>
                        +{formatCurrency(i.over_value)}
                      </Text>
                    )}
                    {i.short_sell_value > 0 && (
                      <Text size="xs" c="dimmed">
                        {formatCurrency(i.short_sell_value)} to sell
                      </Text>
                    )}
                  </Box>
                </Group>
              ))
            )}
          </Card>

          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Text fw={600} size="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${ST.line}` }}>
              Counts in this period
            </Text>
            {v.takes.length === 0 ? (
              <Text size="sm" c="dimmed" p="md">
                No counts submitted.
              </Text>
            ) : (
              v.takes.map((t) => (
                <Box key={t.id} component={Link} to={`/stock-takes/${t.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <Group justify="space-between" wrap="nowrap" gap="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${ST.line}` }}>
                    <Box style={{ minWidth: 0 }}>
                      <Group gap={6} wrap="nowrap">
                        <StatusDot color={TAKE_STATUS[t.status].color} />
                        <Text size="sm" fw={600}>
                          {t.store}
                          {groupLevel && t.property ? ` · ${t.property}` : ''}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {t.take_ref} · {dayjs(t.submitted_at).format('D MMM HH:mm')} · {t.counted_by}
                      </Text>
                    </Box>
                    <Group gap={6} wrap="nowrap">
                      <Text size="sm" fw={700} style={{ color: t.shortage_value ? ST.red : ST.green, whiteSpace: 'nowrap' }}>
                        {t.shortage_value ? `−${formatCurrency(t.shortage_value)}` : 'OK'}
                      </Text>
                      <ChevronRight size={16} color="#ADB5BD" />
                    </Group>
                  </Group>
                </Box>
              ))
            )}
          </Card>
        </Stack>
      )}
    </>
  );
}

function Tile({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <Card withBorder radius="md" p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={800} fz={{ base: 16, sm: 20 }} style={{ color, whiteSpace: 'nowrap' }}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}
    </Card>
  );
}
