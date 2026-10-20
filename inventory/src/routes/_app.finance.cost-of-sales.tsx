import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Box, Card, Group, Loader, SegmentedControl, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCostOfSales } from '@/hooks/useFinance';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/finance/cost-of-sales')({ component: CostOfSalesPage });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AREAS = {
  kitchen: { label: 'Kitchen', color: '#E8590C', bg: '#FFF4E6' },
  bar: { label: 'Bar', color: '#862E9C', bg: '#F8F0FC' },
  events: { label: 'Events', color: '#1971C2', bg: '#E7F5FF' },
} as const;

/** What stock went out for sales in a month, at what it cost, item by item */
function CostOfSalesPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [area, setArea] = useState<'all' | keyof typeof AREAS>('all');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const properties = useProperties(1, 20);
  const q = useCostOfSales({ year, month, property_id: propertyId || undefined });
  const items = (q.data?.items ?? []).filter((i) => area === 'all' || i.area === area);

  return (
    <>
      <PageHeader title="Cost of sales" subtitle="Stock that went out for sales, at what it cost us" />
      <Group gap="sm" mb="md" wrap="wrap">
        <Select w={100} data={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} value={String(month)} onChange={(v) => setMonth(Number(v) || 1)} allowDeselect={false} />
        <Select w={100} data={[0, 1, 2, 3].map((i) => String(now.getFullYear() - i))} value={String(year)} onChange={(v) => setYear(Number(v))} allowDeselect={false} />
        {groupLevel && (
          <Select w={200} placeholder="Both properties" clearable data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />
        )}
        {q.isFetching && <Loader size="xs" />}
      </Group>

      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !q.data ? (
        <EmptyState title="Couldn't load cost of sales" description={getErrorMessage(q.error)} />
      ) : (
        <Box maw={720}>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs" mb="md">
            {(['kitchen', 'bar', 'events'] as const).map((a) => (
              <Card key={a} withBorder radius="md" p="sm" style={{ background: AREAS[a].bg, borderColor: AREAS[a].bg }}>
                <Text size="xs" fw={600} style={{ color: AREAS[a].color }}>{AREAS[a].label}</Text>
                <Text fw={800} style={{ color: AREAS[a].color }}>{formatCurrency(q.data.totals[a])}</Text>
              </Card>
            ))}
            <Card withBorder radius="md" p="sm" style={{ background: '#1F3A5F', borderColor: '#1F3A5F' }}>
              <Text size="xs" fw={600} style={{ color: '#D0EBFF' }}>All</Text>
              <Text fw={800} style={{ color: '#FFFFFF' }}>{formatCurrency(q.data.totals.all)}</Text>
            </Card>
          </SimpleGrid>

          <SegmentedControl
            mb="sm"
            value={area}
            onChange={(v) => setArea(v as typeof area)}
            data={[{ value: 'all', label: 'All' }, { value: 'kitchen', label: 'Kitchen' }, { value: 'bar', label: 'Bar' }, { value: 'events', label: 'Events' }]}
          />

          {items.length === 0 ? (
            <EmptyState title="Nothing went out" description={`No stock used for sales in ${MONTHS[month - 1]} ${year}.`} />
          ) : (
            <Card withBorder radius="md" p={0}>
              <Stack gap={0}>
                {items.map((i, k) => (
                  <Group key={`${i.stock_item_id}-${i.area}`} justify="space-between" wrap="nowrap" px="md" py="xs" style={{ borderTop: k ? '1px solid #F1F3F5' : undefined }}>
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate>{i.name}</Text>
                      <Text size="xs" style={{ color: AREAS[i.area].color }}>
                        {AREAS[i.area].label} · {i.quantity.toLocaleString('en-KE', { maximumFractionDigits: 3 })} out
                      </Text>
                    </Box>
                    <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: i.cost < 0 ? '#2B8A3E' : '#212529' }}>{formatCurrency(i.cost)}</Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}
          <Text size="xs" c="dimmed" mt="sm">
            Cost is what each batch was bought for. Kitchen leftovers returned and event stock brought back are taken off.
          </Text>
        </Box>
      )}
    </>
  );
}
