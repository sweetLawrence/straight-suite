import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, Button, Card, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { ArrowLeft, Check, Send, X } from 'lucide-react';
import { useCancelStaffMeal, useStaffMeal, useStaffMealStep } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/staff-meals/$id')({
  component: StaffMealDetailPage,
});

const C = { navy: '#1F3A5F', green: '#2B8A3E', blue: '#1971C2', grey: '#ADB5BD', line: '#F1F3F5' };

/**
 * Staff meal: the branch manager asks, the store sends (stock comes out then),
 * the branch manager confirms the staff got it.
 */
function StaffMealDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const query = useStaffMeal(id);
  const step = useStaffMealStep(id);
  const cancel = useCancelStaffMeal();
  const [notes, setNotes] = useState('');

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data) return <EmptyState title="Staff meal not found" />;
  const m = query.data;

  const canSend = m.status === 'requested' && auth.hasPermission('store.dispatch.create') && m.authorized_by !== auth.user?.id;
  const canConfirm = m.status === 'dispatched' && auth.hasPermission('staff_meal.authorize');
  const canCancel = m.status === 'requested' && auth.hasPermission('staff_meal.authorize');

  const run = async (kind: 'dispatch' | 'receive') => {
    try {
      await step.mutateAsync({ step: kind, notes: notes.trim() || undefined });
      notifications.show({ color: 'green', title: kind === 'dispatch' ? 'Sent, stock taken out' : 'Received', message: m.staff_meal_ref });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  const steps = [
    { label: 'Requested', by: m.authorized_by_user?.full_name, at: m.authorized_at, done: true },
    { label: 'Sent', by: m.issued_by_user?.full_name, at: m.dispatched_at, done: ['dispatched', 'issued'].includes(m.status) },
    { label: 'Received', by: null, at: m.received_at, done: m.status === 'issued' },
  ];

  return (
    <>
      <Button component={Link} to="/staff-meals" variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">
        Staff meals
      </Button>
      <PageHeader title={`${m.staff_name}`} subtitle={`${m.staff_meal_ref} · ${m.meal_type} · ${formatCurrency(m.total_cost)}`} actions={<StatBadge value={m.status} />} />

      {m.status === 'cancelled' ? (
        <Text size="sm" mb="md" c="dimmed">Cancelled before the store sent it. No stock moved.</Text>
      ) : (
        <SimpleGrid cols={3} spacing="xs" mb="md">
          {steps.map((s, i) => (
            <Card key={s.label} withBorder radius="md" p="xs" style={{ borderColor: s.done ? C.green : undefined, background: s.done ? '#F4FCF5' : '#FFFFFF' }}>
              <Group gap={4} wrap="nowrap">
                <Box w={18} h={18} style={{ borderRadius: 9, background: s.done ? C.green : C.grey, color: '#FFFFFF', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {s.done ? <Check size={12} /> : i + 1}
                </Box>
                <Text size="xs" fw={700} lineClamp={1}>{s.label}</Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2} lineClamp={2}>
                {s.done && s.at ? dayjs(s.at).format('D MMM HH:mm') : 'Waiting'}
                {s.done && s.by ? ` · ${s.by}` : ''}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
        {m.staff_meal_lines?.map((l) => (
          <Group key={l.id} justify="space-between" wrap="nowrap" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} lineClamp={1}>{l.stock_item?.item?.name || '-'}</Text>
              <Text size="xs" c="dimmed">{formatNumber(l.quantity, 3)} {l.unit?.code}</Text>
            </Box>
            <Text size="sm" fw={700} style={{ color: C.navy, whiteSpace: 'nowrap' }}>{formatCurrency(l.cost_amount)}</Text>
          </Group>
        ))}
        <Group justify="space-between" px="md" py="sm" style={{ background: '#E7F5FF' }}>
          <Text fw={700} style={{ color: '#1864AB' }}>Total</Text>
          <Text fw={800} style={{ color: '#1864AB' }}>{formatCurrency(m.total_cost)}</Text>
        </Group>
      </Card>

      {m.receive_notes && <Text size="sm" mb="md">"{m.receive_notes}"</Text>}

      <Stack gap="sm">
        {canSend && (
          <Button size="md" leftSection={<Send size={16} />} loading={step.isPending} onClick={() => run('dispatch')}>
            Send to the kitchen (takes stock out)
          </Button>
        )}
        {m.status === 'requested' && !canSend && (
          <Text size="sm" c="dimmed" ta="center">Waiting for the store to send it.</Text>
        )}
        {canConfirm && (
          <>
            <TextInput placeholder="Note (optional), e.g. one plate short" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
            <Button size="md" color="green" leftSection={<Check size={16} />} loading={step.isPending} onClick={() => run('receive')}>
              Staff received it
            </Button>
          </>
        )}
        {canCancel && (
          <Button variant="light" color="red" leftSection={<X size={16} />} loading={cancel.isPending}
            onClick={async () => {
              try {
                await cancel.mutateAsync(m.id);
                notifications.show({ color: 'orange', title: 'Cancelled', message: m.staff_meal_ref });
              } catch (err) {
                notifications.show({ color: 'red', title: 'Could not cancel', message: getErrorMessage(err) });
              }
            }}>
            Cancel request
          </Button>
        )}
      </Stack>
    </>
  );
}
