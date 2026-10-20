import { useMemo, useState } from 'react';
import { Badge, Box, Card, Group, Loader, ScrollArea, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { EmptyState } from '@/components/EmptyState';
import { useRemitReport } from '@/hooks/useCashier';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { C, METHODS, METHOD_OF } from './CashParts';

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';

// Trading day starts 06:00
const today = () => dayjs().subtract(6, 'hour');
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
const rangeOf = (p: Preset): [string, string] => {
  const t = today();
  switch (p) {
    case 'today': return [fmt(t), fmt(t)];
    case 'yesterday': return [fmt(t.subtract(1, 'day')), fmt(t.subtract(1, 'day'))];
    case 'week': return [fmt(t.subtract((t.day() + 6) % 7, 'day')), fmt(t)];
    case 'last_month': return [fmt(t.subtract(1, 'month').startOf('month')), fmt(t.subtract(1, 'month').endOf('month'))];
    case 'year': return [fmt(t.startOf('year')), fmt(t)];
    default: return [fmt(t.startOf('month')), fmt(t)];
  }
};

/**
 * Money handed to the MD over any range of days: by method, by day, by cashier,
 * next to what the property took over the same days.
 */
export function RemitTotals() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [preset, setPreset] = useState<Preset>('month');
  const [custom, setCustom] = useState<[string | null, string | null]>([null, null]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const properties = useProperties(1, 20);

  const [from, to] = preset === 'custom' ? [custom[0] || undefined, custom[1] || custom[0] || undefined] : rangeOf(preset);
  const q = useRemitReport({ from, to, property_id: propertyId || undefined }, preset !== 'custom' || !!custom[0]);
  const r = q.data;

  const methods = useMemo(
    () => METHODS.filter((m) => r && (r.by_method.find((x) => x.method === m.key)?.handed || r.takings.by_method.find((x) => x.method === m.key)?.total)),
    [r]
  );

  return (
    <Stack gap="md">
      <Group gap="sm" align="flex-end" wrap="wrap">
        <Select
          label="Period"
          w={{ base: '100%', xs: 180 }}
          allowDeselect={false}
          value={preset}
          onChange={(v) => setPreset((v as Preset) || 'month')}
          data={[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'week', label: 'This week' },
            { value: 'month', label: 'This month' },
            { value: 'last_month', label: 'Last month' },
            { value: 'year', label: 'This year so far' },
            { value: 'custom', label: 'Pick dates' },
          ]}
        />
        {preset === 'custom' && (
          <DatePickerInput
            type="range"
            label="From - to"
            allowSingleDateInRange
            valueFormat="D MMM YYYY"
            maxDate={new Date()}
            value={custom}
            onChange={(v) => setCustom([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
            w={{ base: '100%', xs: 260 }}
          />
        )}
        {groupLevel && (
          <Select
            label="Property"
            placeholder="Both"
            clearable
            w={{ base: '100%', xs: 200 }}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={propertyId}
            onChange={setPropertyId}
          />
        )}
        {q.isFetching && <Loader size="xs" mb={10} />}
      </Group>

      {preset === 'custom' && !custom[0] ? (
        <EmptyState title="Pick the days" description="Choose a start and end date." />
      ) : q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !r ? (
        <EmptyState title="Couldn't load totals" description={getErrorMessage(q.error)} />
      ) : (
        <>
          <Text size="xs" fw={700} tt="uppercase" style={{ color: '#495057', letterSpacing: 0.4 }}>
            {r.from === r.to ? dayjs(r.from).format('dddd D MMM YYYY') : `${dayjs(r.from).format('D MMM')} to ${dayjs(r.to).format('D MMM YYYY')}`}
          </Text>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            <Tile label="Handed to the MD" value={r.total.handed} color={C.navy} bg="#EDF2F7" />
            <Tile label="Confirmed" value={r.total.received} color={C.green} bg="#EBFBEE" />
            <Tile label="Waiting to confirm" value={r.total.pending} color="#E8590C" bg="#FFF4E6" />
            <Tile label="Short" value={r.total.short} color={r.total.short > 0 ? C.red : C.muted} bg={r.total.short > 0 ? '#FFF5F5' : '#F8F9FA'} />
          </SimpleGrid>

          {/* By method: taken vs handed */}
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Group justify="space-between" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Text fw={600} size="sm">By method</Text>
              <Text size="xs" c="dimmed">Taken at the property · handed to the MD</Text>
            </Group>
            {methods.length === 0 ? (
              <Text size="sm" c="dimmed" px="md" py="md">Nothing in this period</Text>
            ) : (
              methods.map((m) => {
                const h = r.by_method.find((x) => x.method === m.key)!;
                const t = r.takings.by_method.find((x) => x.method === m.key)!;
                return (
                  <Box key={m.key} px="md" py="xs" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap={8} wrap="nowrap">
                        <Box w={10} h={10} style={{ borderRadius: 999, background: m.color }} />
                        <Text size="sm" fw={700}>{m.label}</Text>
                      </Group>
                      <Text size="sm" fw={800} style={{ color: m.color, whiteSpace: 'nowrap' }}>{formatCurrency(h.handed)}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" pl={18}>
                      Taken {formatCurrency(t.total)}
                      {h.pending > 0 ? ` · ${formatCurrency(h.pending)} waiting` : ''}
                      {h.short > 0 ? ` · short ${formatCurrency(h.short)}` : ''}
                    </Text>
                  </Box>
                );
              })
            )}
            <Group justify="space-between" px="md" py="sm" style={{ background: '#F8F9FA' }}>
              <Text size="sm" fw={700}>All methods</Text>
              <Text size="xs" c="dimmed">Taken {formatCurrency(r.takings.total)} · handed {formatCurrency(r.total.handed)}</Text>
            </Group>
          </Card>

          {/* Day by day */}
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <Group justify="space-between" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Text fw={600} size="sm">Day by day</Text>
              <Text size="xs" c="dimmed">{r.by_day.length} day{r.by_day.length === 1 ? '' : 's'}</Text>
            </Group>
            {r.by_day.length === 0 ? (
              <Text size="sm" c="dimmed" px="md" py="md">Nothing handed over in this period</Text>
            ) : (
              <ScrollArea.Autosize mah={420}>
                {r.by_day.map((d) => (
                  <Group key={d.date} justify="space-between" wrap="nowrap" px="md" py="xs" align="flex-start" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600}>{dayjs(d.date).format('ddd D MMM')}</Text>
                      <Group gap={4} mt={2}>
                        {METHODS.filter((m) => d[m.key] > 0).map((m) => (
                          <Badge key={m.key} size="xs" style={{ color: m.color, backgroundColor: m.bg, textTransform: 'none' }}>
                            {m.label} {formatCurrency(d[m.key])}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                    <Text size="sm" fw={800} style={{ color: C.navy, whiteSpace: 'nowrap' }}>{formatCurrency(d.total)}</Text>
                  </Group>
                ))}
              </ScrollArea.Autosize>
            )}
          </Card>

          {/* By cashier */}
          {r.by_cashier.length > 0 && (
            <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
              <Text fw={600} size="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>By cashier</Text>
              {r.by_cashier.map((c) => (
                <Group key={c.id} justify="space-between" wrap="nowrap" px="md" py="xs" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>{c.full_name}{groupLevel ? ` · ${c.property}` : ''}</Text>
                    <Text size="xs" c="dimmed">
                      {METHODS.filter((m) => c[m.key] > 0).map((m) => `${METHOD_OF[m.key].label} ${formatCurrency(c[m.key])}`).join(' · ')}
                    </Text>
                  </Box>
                  <Text size="sm" fw={800} style={{ color: C.navy, whiteSpace: 'nowrap' }}>{formatCurrency(c.total)}</Text>
                </Group>
              ))}
            </Card>
          )}
        </>
      )}
    </Stack>
  );
}

function Tile({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <Card radius="md" p="sm" style={{ background: bg }}>
      <Text size="xs" fw={600} style={{ color }}>{label}</Text>
      <Text fw={800} fz={{ base: 16, sm: 19 }} style={{ color, whiteSpace: 'nowrap' }}>{formatCurrency(value)}</Text>
    </Card>
  );
}

