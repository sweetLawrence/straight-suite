import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Box, Button, Group, Loader, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { CalendarDays, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { EVENT_STATUS } from '@/components/events/eventStatus';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/events/')({ component: EventsPage });

type When = 'upcoming' | 'past' | 'all';

function EventsPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [when, setWhen] = useState<When>('upcoming');
  const q = useEvents({ limit: 50, when: when === 'all' ? undefined : when });
  const rows = q.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Functions & events"
        subtitle="Negotiated per person, invoiced, paid in parts, reminded the day before"
        actions={auth.hasPermission('event.manage') && !auth.hasRole('md', 'admin') ? <Button leftSection={<Plus size={16} />} component={Link} to="/events/new">New event</Button> : undefined}
      />
      <Group mb="md" gap="sm">
        <SegmentedControl value={when} onChange={(x) => setWhen(x as When)} data={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All' }]} />
        {q.isFetching && <Loader size="xs" />}
      </Group>
      {q.isLoading ? <Group justify="center" py="xl"><Loader /></Group>
        : q.error ? <EmptyState title="Couldn't load events" description={getErrorMessage(q.error)} />
        : rows.length === 0 ? <EmptyState title={when === 'upcoming' ? 'Nothing coming up' : 'No events'} description="Weddings, conferences and parties you book show here." />
        : (
          <Stack gap="xs">
            {rows.map((e) => {
              const st = EVENT_STATUS[e.status];
              return (
                <Paper key={e.id} withBorder radius="md" p="sm" component={Link} to={`/events/${e.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                    <Box style={{ minWidth: 0 }}>
                      <Group gap={6} wrap="nowrap">
                        <StatusDot color={st.color} />
                        <Text size="sm" fw={700} truncate>{e.title}</Text>
                        {groupLevel && e.property && <Badge size="xs" variant="outline" color="gray">{e.property.code}</Badge>}
                      </Group>
                      <Group gap="md" mt={2}>
                        <Group gap={4}><CalendarDays size={12} color="#868E96" /><Text size="xs" c="dimmed">{dayjs(e.start_at).format('ddd D MMM, HH:mm')}</Text></Group>
                        <Group gap={4}><Users size={12} color="#868E96" /><Text size="xs" c="dimmed">{e.guests}</Text></Group>
                      </Group>
                      <Text size="xs" c="dimmed">{e.client.name} · {st.label}</Text>
                    </Box>
                    <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                      <Text size="sm" fw={800} style={{ color: '#1F3A5F' }}>{formatCurrency(e.total)}</Text>
                      {e.status !== 'cancelled' && (
                        <Text size="xs" fw={600} style={{ color: e.balance > 0 ? '#E8590C' : '#2B8A3E' }}>
                          {e.balance > 0 ? `${formatCurrency(e.balance)} due` : 'Paid'}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
    </>
  );
}
