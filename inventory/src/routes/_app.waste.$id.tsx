import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Grid, Text } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useWaste } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/waste/$id')({
  component: WasteDetailPage,
});

function WasteDetailPage() {
  const { id } = Route.useParams();
  const query = useWaste(id);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Waste record not found" />;

  const w = query.data;

  return (
    <>
      <Link to="/waste" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to waste
        </Button>
      </Link>

      <PageHeader title={w.waste_ref} subtitle={w.reason} />

      <Grid>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Item</Text>
            <Text fw={500}>{w.stock_item?.item?.name || '-'}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Quantity</Text>
            <Text fw={500}>
              {formatNumber(w.quantity, 3)} {w.unit?.code}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Cost Impact</Text>
            <Text fw={500}>{formatCurrency(w.cost_amount)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Recorded By</Text>
            <Text fw={500}>{w.recorded_by_user?.full_name || '-'}</Text>
            <Text size="xs" c="dimmed" mt={4}>
              {formatDateTime(w.recorded_at)}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Authorized By</Text>
            <Text fw={500}>{w.authorized_by_user?.full_name || '-'}</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
}