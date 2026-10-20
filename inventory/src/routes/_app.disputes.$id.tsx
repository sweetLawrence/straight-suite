import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Grid, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowLeft, Check } from 'lucide-react';
import { useDispute } from '@/hooks/useOperations';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { ResolveDisputeModal } from '@/components/disputes/ResolveDisputeModal';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/disputes/$id')({
  component: DisputeDetailPage,
});

function DisputeDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const query = useDispute(id);
  const [open, { open: openModal, close }] = useDisclosure(false);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Dispute not found" />;

  const d = query.data;
  const canResolve =
    d.status === 'open' && auth.hasPermission('dispute.resolve');

  return (
    <>
      <Link to="/disputes" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to disputes
        </Button>
      </Link>

      <PageHeader
        title={d.dispute_ref}
        subtitle={`Raised by ${d.raised_by_user?.full_name || '-'}`}
        actions={
          <>
            <StatBadge value={d.status} />
            {canResolve && (
              <Button leftSection={<Check size={16} />} onClick={openModal}>
                Resolve
              </Button>
            )}
          </>
        }
      />

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Amount Disputed</Text>
            <Text fw={600} size="lg">
              {formatCurrency(d.amount_disputed)}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Created</Text>
            <Text fw={500}>{formatDateTime(d.created_at)}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder mt="lg">
        <Stack>
          <div>
            <Text size="sm" fw={500} c="dimmed">Waiter Statement</Text>
            <Text size="sm">{d.waiter_statement || '-'}</Text>
          </div>
          <div>
            <Text size="sm" fw={500} c="dimmed">Cashier Statement</Text>
            <Text size="sm">{d.cashier_statement || '-'}</Text>
          </div>
          {d.status === 'resolved' && (
            <div>
              <Text size="sm" fw={500} c="dimmed">Resolution</Text>
              <Text size="sm">{d.resolution}</Text>
              <Text size="xs" c="dimmed" mt={4}>
                By {d.resolved_by_user?.full_name} •{' '}
                {formatDateTime(d.resolved_at)}
              </Text>
            </div>
          )}
        </Stack>
      </Card>

      <ResolveDisputeModal opened={open} onClose={close} disputeId={id} />
    </>
  );
}