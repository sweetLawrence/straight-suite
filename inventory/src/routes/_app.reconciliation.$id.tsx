import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Group, Text } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useReconciliationCheck } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/reconciliation/$id')({
  component: CheckDetailPage,
});

function CheckDetailPage() {
  const { id } = Route.useParams();
  const query = useReconciliationCheck(id);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Check not found" />;

  const c = query.data;

  return (
    <>
      <Link to="/reconciliation" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to checks
        </Button>
      </Link>

      <PageHeader
        title={c.check_ref}
        subtitle={c.check_type.replace(/_/g, ' ')}
        actions={<StatBadge value={c.status} />}
      />

      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Expected</Text>
          <Text fw={600}>
            {c.expected_amount ? formatCurrency(c.expected_amount) : '-'}
          </Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Actual</Text>
          <Text fw={600}>
            {c.actual_amount ? formatCurrency(c.actual_amount) : '-'}
          </Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Variance</Text>
          <Text
            fw={600}
            c={
              c.variance && parseFloat(c.variance) !== 0 ? 'red' : 'green'
            }
          >
            {c.variance ? formatCurrency(c.variance) : '-'}
          </Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text size="sm" c="dimmed">Reference</Text>
          <Text size="sm">
            {c.reference_type} {c.reference_id?.slice(0, 12)}…
          </Text>
        </Group>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Checked By</Text>
          <Text size="sm">
            {c.checked_by_user?.full_name} • {formatDateTime(c.checked_at)}
          </Text>
        </Group>
      </Card>
    </>
  );
}