import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  ArrowLeft,
  CheckCircle,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  useProductionBatch,
  useProductionVariances,
} from '@/hooks/useProduction';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { AddInputModal } from '@/components/production/AddInputModal';
import { CompleteProductionModal } from '@/components/production/CompleteProductionModal';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/production/$id')({
  component: ProductionDetailPage,
});

function ProductionDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const batch = useProductionBatch(id);
  const variances = useProductionVariances({ production_batch_id: id });

  const [inputOpen, { open: openInput, close: closeInput }] =
    useDisclosure(false);
  const [completeOpen, { open: openComplete, close: closeComplete }] =
    useDisclosure(false);

  if (batch.isLoading) return <LoadingState />;
  if (batch.error || !batch.data)
    return <EmptyState title="Production batch not found" />;

  const b = batch.data;
  const isInProgress = b.status === 'in_progress';
  const canAddInput =
    isInProgress && auth.hasPermission('production.create');
  const canComplete =
    isInProgress &&
    (b.inputs?.length ?? 0) > 0 &&
    auth.hasPermission('production.complete');

  return (
    <>
      <Link to="/production" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to production
        </Button>
      </Link>

      <PageHeader
        title={b.production_ref}
        subtitle={`Producing: ${b.output_stock_item?.item?.name || '-'}`}
        actions={
          <Group>
            <StatBadge value={b.status} />
            {canAddInput && (
              <Button leftSection={<Plus size={16} />} onClick={openInput}>
                Add Input
              </Button>
            )}
            {canComplete && (
              <Button
                leftSection={<CheckCircle size={16} />}
                onClick={openComplete}
              >
                Complete Production
              </Button>
            )}
          </Group>
        }
      />

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Expected Output</Text>
            <Text fw={600} size="lg">{formatNumber(b.expected_output_qty)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Actual Output</Text>
            <Text fw={600} size="lg">{formatNumber(b.actual_output_qty)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">Variance</Text>
            <Text
              fw={600}
              size="lg"
              c={
                b.status === 'completed' && Math.abs(parseFloat(b.variance_pct)) > 5
                  ? 'red'
                  : undefined
              }
            >
              {b.status === 'completed' ? `${b.variance_pct}%` : '-'}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder mb="lg">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Inputs</Title>
        </Group>
        {!b.inputs || b.inputs.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No inputs yet. Add the first ingredient.
          </Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Batch</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Qty</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Cost</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {b.inputs.map((i) => (
                <Table.Tr key={i.id}>
                  <Table.Td>{i.stock_item?.item?.name || '-'}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{i.batch?.batch_ref || '-'}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {formatNumber(i.quantity, 3)} {i.unit?.code}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {formatCurrency(i.cost_amount)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {b.outputs && b.outputs.length > 0 && (
        <Card withBorder mb="lg">
          <Title order={4} mb="sm">Outputs</Title>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Qty</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Cost / Unit</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Total Cost</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {b.outputs.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.stock_item?.item?.name || '-'}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {formatNumber(o.quantity)} {o.unit?.code}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {formatCurrency(o.cost_per_unit)}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={500}>{formatCurrency(o.total_cost)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {variances.data?.data && variances.data.data.length > 0 && (
        <Card withBorder>
          <Title order={4} mb="sm">Variances</Title>
          <Stack gap="xs">
            {variances.data.data.map((v) => (
              <Alert
                key={v.id}
                icon={<AlertTriangle size={16} />}
                color={parseFloat(v.variance_pct) < -10 ? 'red' : 'orange'}
                variant="light"
              >
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {v.variance_type} - {v.variance_pct}%
                  </Text>
                  <Text size="xs">
                    Expected {v.expected_qty} • Actual {v.actual_qty} • Impact{' '}
                    {formatCurrency(v.cost_impact)}
                  </Text>
                  <StatBadge value={v.status} />
                </Stack>
              </Alert>
            ))}
          </Stack>
        </Card>
      )}

      <AddInputModal
        opened={inputOpen}
        onClose={closeInput}
        batchId={id}
        expectedOutputSoFar={parseFloat(b.expected_output_qty)}
      />
      <CompleteProductionModal
        opened={completeOpen}
        onClose={closeComplete}
        batchId={id}
        expectedOutput={parseFloat(b.expected_output_qty)}
      />
    </>
  );
}