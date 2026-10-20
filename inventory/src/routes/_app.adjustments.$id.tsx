import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAdjustment } from '@/hooks/useAdmin';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { DecideAdjustmentModal } from '@/components/adjustments/DecideAdjustmentModal';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/adjustments/$id')({
  component: AdjustmentDetailPage,
});

function AdjustmentDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const query = useAdjustment(id);
  const [open, { open: openModal, close }] = useDisclosure(false);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Adjustment not found" />;

  const a = query.data;
  const canDecide =
    a.status === 'pending' && auth.hasPermission('adjustment.approve');

  return (
    <>
      <Link to="/adjustments" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to adjustments
        </Button>
      </Link>

      <PageHeader
        title={a.adjustment_ref}
        subtitle={a.adjustment_type.replace(/_/g, ' ')}
        actions={
          <Group>
            <StatBadge value={a.status} />
            {canDecide && (
              <Button leftSection={<CheckCircle size={16} />} onClick={openModal}>
                Decide
              </Button>
            )}
          </Group>
        }
      />

      <Card withBorder>
        <Stack>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Reason</Text>
            <Text size="sm" style={{ maxWidth: 500, textAlign: 'right' }}>
              {a.reason}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Original Entity</Text>
            <Text size="sm">
              {a.original_entity_type} ({a.original_entity_id.slice(0, 8)}…)
            </Text>
          </Group>
          {a.amount && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Amount</Text>
              <Text size="sm">{formatCurrency(a.amount)}</Text>
            </Group>
          )}
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Requested By</Text>
            <Text size="sm">{a.requested_by_user?.full_name || '-'}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Created</Text>
            <Text size="sm">{formatDateTime(a.created_at)}</Text>
          </Group>
          {a.approved_at && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {a.status === 'rejected' ? 'Rejected' : 'Approved'} By
              </Text>
              <Text size="sm">
                {a.approved_by_user?.full_name} •{' '}
                {formatDateTime(a.approved_at)}
              </Text>
            </Group>
          )}
        </Stack>
      </Card>

      <DecideAdjustmentModal opened={open} onClose={close} adjustmentId={id} />
    </>
  );
}