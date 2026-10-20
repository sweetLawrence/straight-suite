import { Badge, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useInHouse } from '@/hooks/usePayments';
import { PLAN_LABEL } from '@/lib/api/roomTypes';

const MEALS = ['breakfast', 'lunch', 'dinner'];

export function InHousePanel() {
  const q = useInHouse(true);
  const rows = q.data ?? [];
  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Group gap="xs" mb="sm">
        <Text fw={700}>Guests in house</Text>
        <Badge color="blue" variant="light">{rows.length}</Badge>
      </Group>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">No guests in house right now.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {rows.map((g) => (
            <Card key={g.id} withBorder radius="md" p="sm">
              <Stack gap={2}>
                <Group gap={6} wrap="nowrap">
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#2F9E44', flexShrink: 0 }} />
                  <Text fw={600} size="sm" truncate>{g.guest_name || 'Guest'}</Text>
                  {g.room && <Badge size="xs" variant="light" color="gray">{g.room}</Badge>}
                </Group>
                <Text size="xs" c="dimmed">{g.room_type} · {PLAN_LABEL[g.plan]}</Text>
                <Text size="xs" c="dimmed">
                  {dayjs(g.start).format('D MMM')} to {dayjs(g.start).add(g.nights, 'day').format('D MMM')} · {g.nights} night{g.nights > 1 ? 's' : ''} · {g.guests} guest{g.guests > 1 ? 's' : ''}
                </Text>
                <Text size="xs" c="dimmed">
                  Meals left today:{' '}
                  {MEALS.filter((m) => g.meals_allowed.includes(m))
                    .map((m) => `${m} ${g.guests - (g.used_today[m] ?? 0)}`)
                    .join(', ')}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Card>
  );
}
