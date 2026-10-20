import { Box, Drawer, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { usePriceHistory } from '@/hooks/usePurchasing';
import { formatCurrency } from '@/lib/utils/format';

/** Every delivery of an item with its unit cost, newest first */
export function PriceHistoryDrawer({ stockItemId, onClose }: { stockItemId: string | null; onClose: () => void }) {
  const q = usePriceHistory(stockItemId);
  const h = q.data;
  const ch = h?.change;
  return (
    <Drawer opened={!!stockItemId} onClose={onClose} position="bottom" size="85%" title={h ? `Price history · ${h.name}` : 'Price history'}>
      {q.isLoading || !h ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Box>
              <Text size="xs" c="dimmed">Latest</Text>
              <Text fw={800} style={{ color: '#1F3A5F' }}>
                {h.latest != null ? formatCurrency(h.latest) : '-'}
                {ch != null && (
                  <Text span size="xs" fw={700} ml={6} style={{ color: ch > 0 ? '#C92A2A' : ch < 0 ? '#2B8A3E' : '#868E96' }}>
                    {ch > 0 ? '▲' : ch < 0 ? '▼' : ''} {Math.abs(ch)}%
                  </Text>
                )}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Average</Text>
              <Text fw={700}>{h.average != null ? formatCurrency(h.average) : '-'}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Lowest</Text>
              <Text fw={700} style={{ color: '#2B8A3E' }}>{h.lowest != null ? formatCurrency(h.lowest) : '-'}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Highest</Text>
              <Text fw={700} style={{ color: '#C92A2A' }}>{h.highest != null ? formatCurrency(h.highest) : '-'}</Text>
            </Box>
          </SimpleGrid>
          <Text size="xs" c="dimmed">Per {h.unit?.toLowerCase() || 'unit'}</Text>
          {h.deliveries.length === 0 ? (
            <Text size="sm" c="dimmed">No priced deliveries yet.</Text>
          ) : (
            h.deliveries.map((d) => (
              <Group key={d.id} justify="space-between" wrap="nowrap" py={6} style={{ borderBottom: '1px solid #F1F3F5' }}>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600}>{d.supplier || 'No supplier recorded'}</Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(d.received_at).format('D MMM YYYY')} · {d.quantity} · {d.purchase_ref || d.batch_ref}
                  </Text>
                </Box>
                <Text fw={700} style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>{formatCurrency(d.unit_cost)}</Text>
              </Group>
            ))
          )}
        </Stack>
      )}
    </Drawer>
  );
}
