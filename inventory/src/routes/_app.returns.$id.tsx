import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Grid, Text } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useReturn } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/returns/$id')({
  component: ReturnDetailPage,
});

function ReturnDetailPage() {
  const { id } = Route.useParams();
  const query = useReturn(id);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Return not found" />;

  const r = query.data;

  return (
    <>
      <Link to="/returns" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to returns
        </Button>
      </Link>

      <PageHeader
        title={r.return_ref}
        subtitle={r.stock_item?.item?.name || '-'}
        actions={<StatBadge value={r.return_type} />}
      />

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Quantity</Text>
            <Text fw={500}>
              {formatNumber(r.quantity, 3)} {r.unit?.code}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Reason</Text>
            <Text fw={500}>{r.reason || '-'}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Returned By</Text>
            <Text fw={500}>{r.returned_by_user?.full_name || '-'}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              {formatDateTime(r.returned_at)}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Received By</Text>
            <Text fw={500}>{r.received_by_user?.full_name || '-'}</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
}