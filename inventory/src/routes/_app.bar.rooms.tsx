import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Card, Group, Loader, Pagination, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { BedDouble, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { DayGroupedList } from '@/components/DayGroupedList';
import { RoomIssueModal } from '@/components/bar/RoomIssueModal';
import { useMarkRoomBilled, useRoomIssues } from '@/hooks/useRoomIssues';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/bar/rooms')({
  component: RoomIssuesPage,
});

type Show = 'all' | 'to_bill';

function RoomIssuesPage() {
  const auth = useAuth();
  const canSend = auth.hasPermission('bar.issue');
  const canBill = auth.hasPermission('bill.pay_later') || auth.hasPermission('report.view.property');
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const query = useRoomIssues({ page, limit: 30, to_bill: show === 'to_bill' ? 'true' : undefined });
  const mark = useMarkRoomBilled();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  const billed = async (id: string, ref: string) => {
    try {
      await mark.mutateAsync(id);
      notifications.show({ color: 'green', title: 'On the room bill', message: ref });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader
        title="Bar to rooms"
        subtitle="Drinks sent from the bar to guest rooms"
        actions={canSend ? <Button leftSection={<Plus size={16} />} onClick={() => setOpen(true)}>Send to a room</Button> : undefined}
      />

      <Card withBorder radius="md" p="md" mb="md">
        <Text size="xs" c="dimmed">Still to put on room bills</Text>
        <Text fw={800} fz={24} style={{ color: '#1F3A5F' }}>{formatCurrency(query.data?.to_bill_amount ?? 0)}</Text>
      </Card>

      <Group mb="md" gap="sm">
        <SegmentedControl
          value={show}
          onChange={(v) => { setShow(v as Show); setPage(1); }}
          data={[{ value: 'all', label: 'All' }, { value: 'to_bill', label: 'To bill' }]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing sent to rooms yet" description="Drinks sent from the bar to a room show here." />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(r) => r.created_at}
          keyOf={(r) => r.id}
          gap="xs"
          render={(r) => (
            <Paper withBorder radius="md" p="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                  <BedDouble size={18} color="#1971C2" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600}>Room {r.room}{r.guest_name ? ` · ${r.guest_name}` : ''}</Text>
                    <Text size="xs" c="dimmed">{r.quantity} × {r.item}{r.note ? ` · ${r.note}` : ''}</Text>
                    <Text size="xs" c="dimmed">
                      {r.issue_ref} · {dayjs(r.created_at).format('HH:mm')}{r.issued_by ? ` · ${r.issued_by.full_name}` : ''}
                    </Text>
                    <Group gap={6} mt={2}>
                      {!r.charge_to_room && <Badge size="xs" color="gray" variant="light">Not charged</Badge>}
                      {r.charge_to_room && !r.billed && <Badge size="xs" color="orange" variant="light">To bill</Badge>}
                      {r.billed && <Badge size="xs" color="teal" variant="light">On room bill{r.billed_by ? ` · ${r.billed_by.full_name}` : ''}</Badge>}
                      {r.charge_to_room && !r.billed && canBill && (
                        <Button size="compact-xs" variant="light" loading={mark.isPending} onClick={() => billed(r.id, r.issue_ref)}>
                          Mark billed
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Group>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>
                  {r.sell_amount != null ? formatCurrency(r.sell_amount) : '-'}
                </Text>
              </Group>
            </Paper>
          )}
        />
      )}

      {meta && meta.pages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination value={page} onChange={setPage} total={meta.pages} size="sm" siblings={0} />
        </Group>
      )}

      <RoomIssueModal opened={open} onClose={() => setOpen(false)} />
    </>
  );
}
