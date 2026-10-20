import { createFileRoute } from '@tanstack/react-router';
import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { useBatches } from '@/hooks/useStock';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Batch } from '@/lib/api/stock';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/stock/portion-inventory')({
  component: PortionInventoryPage,
});

function PortionInventoryPage() {
  const query = useBatches({ limit: 200 });

  const portionedBatches = (query.data?.data ?? []).filter(
    (b) => b.total_portions && b.total_portions > 0
  );

  if (query.isLoading) return <LoadingState />;
  if (portionedBatches.length === 0) {
    return (
      <>
        <PageHeader
          title="Portion Inventory"
          subtitle="Portioned batches and their remaining counts"
        />
        <EmptyState
          title="No portioned batches"
          description="Portion a batch to see it here."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Portion Inventory"
        subtitle="Portioned batches and their remaining counts"
      />

      <Stack gap="md">
        {portionedBatches.map((b) => {
          const total = b.total_portions ?? 0;
          const available = b.available_portions ?? 0;
          const consumed = total - available;
          const pct = total > 0 ? (consumed / total) * 100 : 0;

          return (
            <Card key={b.id} withBorder padding="md" radius="md">
              <Group justify="space-between" align="flex-start" mb="sm">
                <Stack gap={2}>
                  <Text fw={600}>{b.batch_ref}</Text>
                  <Text size="xs" c="dimmed">
                    {b.stock_item?.item?.name || 'Item'}
                  </Text>
                </Stack>
                <Stack gap={2} align="flex-end">
                  <Badge variant="light" color="blue">
                    {available} / {total} available
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {consumed} consumed
                  </Text>
                </Stack>
              </Group>

              <Progress
                value={pct}
                color={pct > 80 ? 'red' : pct > 50 ? 'orange' : 'blue'}
                mb="xs"
              />

              <Group gap="lg" mt="xs">
                <Text size="xs" c="dimmed">
                  Cost/portion:{' '}
                  <strong>{formatCurrency(b.cost_per_portion)}</strong>
                </Text>
                <Text size="xs" c="dimmed">
                  Received:{' '}
                  <strong>
                    {formatNumber(b.received_qty)} {b.received_unit?.code}
                  </strong>
                </Text>
              </Group>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}