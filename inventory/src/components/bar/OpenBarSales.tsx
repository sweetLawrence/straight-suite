import { Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Receipt } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth/useAuth';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

/**
 * Bar sales that are started (and maybe poured) but not billed yet, so the
 * attendant can always get back to them after leaving the order page.
 */
export function OpenBarSales() {
  const auth = useAuth();
  const mine = auth.hasRole('bar_attendant') && !auth.hasRole('manager', 'md', 'admin');
  const q = useOrders({ limit: 50, status: 'open,in_progress', ...(mine ? { waiter_id: auth.user?.id } : { outlet: 'bar' as const }) });
  const rows = (q.data?.data ?? []).filter((o) => !(o.bills?.length) && !o.bill);
  if (rows.length === 0) return null;

  return (
    <Box mb="lg">
      <Group gap={8} mb={8}>
        <Text fw={700}>Not billed yet</Text>
        <Badge size="sm" style={{ backgroundColor: '#FFF4E6', color: '#E8590C' }}>{rows.length}</Badge>
      </Group>
      <Stack gap="xs">
        {rows.map((o) => {
          const live = (o.order_lines ?? []).filter((l) => l.status !== 'cancelled');
          const total = live.reduce((a, l) => a + parseFloat(String(l.line_total || 0)), 0);
          const poured = live.filter((l) => l.status !== 'pending').length;
          return (
            <Card key={o.id} withBorder radius="md" p="sm" style={{ borderColor: '#FFD8A8' }}>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={700} truncate>
                    {o.table_number || o.order_ref}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {live.length} item{live.length === 1 ? '' : 's'} · {poured} poured · {formatDateTime(o.created_at)}
                  </Text>
                  <Text size="sm" fw={700} style={{ color: '#862E9C' }}>{formatCurrency(total)}</Text>
                </Box>
                <Button
                  component={Link}
                  to={`/orders/${o.id}`}
                  radius="md"
                  leftSection={<Receipt size={16} />}
                  style={{ backgroundColor: '#E8590C', flexShrink: 0 }}
                >
                  Bill
                </Button>
              </Group>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
