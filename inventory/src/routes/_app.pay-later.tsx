import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Box, Card, Group, Loader, Pagination, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { BedDouble, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { usePayLater } from '@/hooks/usePayLater';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/pay-later')({ component: PayLaterPage });

type Show = 'outstanding' | 'settled' | 'all';

/** Bills guests will pay later (e.g. sleeping in the hotel): who, which room, by when */
function PayLaterPage() {
  const auth = useAuth();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [show, setShow] = useState<Show>('outstanding');
  const [page, setPage] = useState(1);
  // Managers see food and bar together and can narrow it; bar staff are held to bar by the server
  const sees = auth.hasRole('manager', 'md', 'admin', 'supervisor', 'cashier');
  const [outlet, setOutlet] = useState<'all' | 'restaurant' | 'bar'>('all');
  const q = usePayLater({ page, limit: 30, status: show, ...(sees && outlet !== 'all' ? { outlet } : {}) });
  const rows = q.data?.data ?? [];
  const s = q.data?.summary;

  return (
    <>
      <PageHeader title="Guests paying later" subtitle="Bills left open for a guest to pay later, e.g. staying the night. Open a bill to take the payment." />
      <Box maw={760}>
        <SimpleGrid cols={3} spacing="xs" mb="md">
          <Card radius="md" p="sm" style={{ background: '#FFF4E6' }}>
            <Text size="xs" fw={600} style={{ color: '#D9480F' }}>Still owed</Text>
            <Text fw={800} fz={{ base: 16, sm: 19 }} style={{ color: '#D9480F', whiteSpace: 'nowrap' }}>{formatCurrency(s?.outstanding ?? 0)}</Text>
          </Card>
          <Card radius="md" p="sm" style={{ background: '#F1F3F5' }}>
            <Text size="xs" fw={600} style={{ color: '#495057' }}>Bills</Text>
            <Text fw={800} fz={{ base: 16, sm: 19 }} style={{ color: '#495057' }}>{s?.count ?? 0}</Text>
          </Card>
          <Card radius="md" p="sm" style={{ background: s?.overdue ? '#FFF5F5' : '#F1F3F5' }}>
            <Text size="xs" fw={600} style={{ color: s?.overdue ? '#C92A2A' : '#495057' }}>Late</Text>
            <Text fw={800} fz={{ base: 16, sm: 19 }} style={{ color: s?.overdue ? '#C92A2A' : '#495057' }}>{s?.overdue ?? 0}</Text>
          </Card>
        </SimpleGrid>

        <Group mb="sm" gap="sm">
          <SegmentedControl
            value={show}
            onChange={(v) => { setShow(v as Show); setPage(1); }}
            data={[{ value: 'outstanding', label: 'Not paid' }, { value: 'settled', label: 'Paid' }, { value: 'all', label: 'All' }]}
          />
          {sees && (
            <SegmentedControl
              value={outlet}
              onChange={(v) => { setOutlet(v as 'all' | 'restaurant' | 'bar'); setPage(1); }}
              data={[{ value: 'all', label: 'Food + bar' }, { value: 'restaurant', label: 'Food' }, { value: 'bar', label: 'Bar' }]}
            />
          )}
          {q.isFetching && <Loader size="xs" />}
        </Group>

        {q.isLoading ? (
          <Group justify="center" py="xl"><Loader /></Group>
        ) : q.error ? (
          <EmptyState title="Couldn't load" description={getErrorMessage(q.error)} />
        ) : rows.length === 0 ? (
          <EmptyState title={show === 'outstanding' ? 'Nobody owes anything' : 'Nothing here'} description="On a bill, tap Pays later when a guest will pay later." />
        ) : (
          <Stack gap="xs">
            {rows.map((b) => {
              const open = b.status === 'open';
              const color = !open ? '#2B8A3E' : b.overdue ? '#C92A2A' : '#D9480F';
              return (
                <Card key={b.id} withBorder radius="md" p="sm" component={Link} to={`/bills/${b.id}`} style={{ color: 'inherit', textDecoration: 'none', borderColor: open && b.overdue ? '#FFC9C9' : undefined }}>
                  <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
                    <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                      <BedDouble size={18} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <Box style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <Text size="sm" fw={700} truncate>{b.guest}{b.room ? ` · room ${b.room}` : ''}</Text>
                          {groupLevel && b.property && <Badge size="xs" variant="outline" color="gray">{b.property.code}</Badge>}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {b.bill_ref}{b.waiter ? ` · ${b.waiter.full_name}` : ''}{b.phone ? ` · ${b.phone}` : ''}
                        </Text>
                        {open ? (
                          <Text size="xs" fw={600} style={{ color }}>
                            {b.overdue ? 'Late: was due ' : 'Pays by '}{b.due ? dayjs(b.due).format('ddd D MMM') : 'soon'}
                          </Text>
                        ) : (
                          <Text size="xs" style={{ color }}>Paid {b.paid_at ? formatDateTime(b.paid_at) : ''}</Text>
                        )}
                        {b.note && <Text size="xs" c="dimmed" lineClamp={1}>"{b.note}"</Text>}
                      </Box>
                    </Group>
                    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Text size="sm" fw={800} style={{ color, whiteSpace: 'nowrap' }}>{formatCurrency(b.amount)}</Text>
                      <ChevronRight size={16} color="#ADB5BD" />
                    </Group>
                  </Group>
                </Card>
              );
            })}
            {(q.data?.meta?.pages ?? 1) > 1 && <Pagination value={page} onChange={setPage} total={q.data?.meta?.pages ?? 1} size="sm" mt="xs" />}
          </Stack>
        )}
      </Box>
    </>
  );
}
