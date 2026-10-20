// import { createFileRoute, Link } from '@tanstack/react-router';
// import { Button, Card, Grid, Table, Text, Title } from '@mantine/core';
// import { ArrowLeft } from 'lucide-react';
// import { useCashDrop } from '@/hooks/usePayments';
// import { PageHeader } from '@/components/PageHeader';
// import { LoadingState } from '@/components/LoadingState';
// import { EmptyState } from '@/components/EmptyState';
// import { StatBadge } from '@/components/StatBadge';
// import { formatCurrency, formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/cash-drops/$id')({
//   component: CashDropDetailPage,
// });

// function CashDropDetailPage() {
//   const { id } = Route.useParams();
//   const query = useCashDrop(id);

//   if (query.isLoading) return <LoadingState />;
//   if (query.error || !query.data)
//     return <EmptyState title="Cash drop not found" />;

//   const d = query.data;

//   return (
//     <>
//       <Button
//         variant="subtle"
//         leftSection={<ArrowLeft size={16} />}
//         component={Link}
//         to="/cash-drops"
//         mb="sm"
//       >
//         Back to cash drops
//       </Button>

//       <PageHeader
//         title={d.drop_ref}
//         subtitle={`Waiter: ${d.waiter?.full_name || '-'} → ${d.receiver?.full_name || '-'} (${d.receiver_role})`}
//         actions={<StatBadge value={d.status} />}
//       />

//       <Grid mb="lg">
//         <Grid.Col span={{ base: 12, sm: 4 }}>
//           <Card withBorder>
//             <Text size="sm" c="dimmed">
//               Total
//             </Text>
//             <Text fw={600} size="lg">
//               {formatCurrency(d.total_amount)}
//             </Text>
//           </Card>
//         </Grid.Col>
//         <Grid.Col span={{ base: 12, sm: 4 }}>
//           <Card withBorder>
//             <Text size="sm" c="dimmed">
//               Dropped At
//             </Text>
//             <Text fw={500}>{formatDateTime(d.dropped_at)}</Text>
//           </Card>
//         </Grid.Col>
//         <Grid.Col span={{ base: 12, sm: 4 }}>
//           <Card withBorder>
//             <Text size="sm" c="dimmed">
//               Verified At
//             </Text>
//             <Text fw={500}>{formatDateTime(d.verified_at)}</Text>
//           </Card>
//         </Grid.Col>
//       </Grid>

//       <Card withBorder>
//         <Title order={4} mb="sm">
//           Lines
//         </Title>
//         <Table striped>
//           <Table.Thead>
//             <Table.Tr>
//               <Table.Th>Bill</Table.Th>
//               <Table.Th>Payment Line</Table.Th>
//               <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             {d.cash_drop_lines?.map((l) => (
//               <Table.Tr key={l.id}>
//                 <Table.Td>{l.bill?.bill_ref || '-'}</Table.Td>
//                 <Table.Td>
//                   <Text size="sm" c="dimmed">
//                     {l.payment_line_id}
//                   </Text>
//                 </Table.Td>
//                 <Table.Td style={{ textAlign: 'right' }}>
//                   <Text fw={500}>{formatCurrency(l.amount)}</Text>
//                 </Table.Td>
//               </Table.Tr>
//             ))}
//           </Table.Tbody>
//         </Table>
//       </Card>
//     </>
//   );
// }














import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Button,
  Card,
  Grid,
  Table,
  Text,
  Title,
  Stack,
  Group,
  Box,
} from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useCashDrop } from '@/hooks/usePayments';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/cash-drops/$id')({
  component: CashDropDetailPage,
});

function CashDropDetailPage() {
  const { id } = Route.useParams();
  const query = useCashDrop(id);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Cash drop not found" />;

  const d = query.data;

  return (
    <>
      <Button
        variant="subtle"
        leftSection={<ArrowLeft size={16} />}
        component={Link}
        to="/cash-drops"
        mb="sm"
      >
        Back to cash drops
      </Button>

      <PageHeader
        title={d.drop_ref}
        subtitle={`Waiter: ${d.waiter?.full_name || '-'} → ${d.receiver?.full_name || '-'} (${d.receiver_role})`}
        actions={<StatBadge value={d.status} />}
      />

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Total
            </Text>
            <Text fw={600} size="lg">
              {formatCurrency(d.total_amount)}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Dropped At
            </Text>
            <Text fw={500}>{formatDateTime(d.dropped_at)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Verified At
            </Text>
            <Text fw={500}>{formatDateTime(d.verified_at)}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder>
        <Title order={4} mb="sm">
          Lines
        </Title>

        {/* Mobile view */}
        <Box hiddenFrom="sm">
          {d.cash_drop_lines?.length ? (
            <Stack gap={0}>
              {d.cash_drop_lines.map((l, i) => (
                <Group
                  key={l.id}
                  justify="space-between"
                  wrap="nowrap"
                  py={8}
                  style={{ borderTop: i ? '1px solid #F1F3F5' : undefined }}
                >
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {l.bill?.bill_ref || '-'}
                    </Text>
                    {l.bill?.customer_code && (
                      <Text size="xs" c="dimmed" truncate>
                        {l.bill.customer_code}
                      </Text>
                    )}
                  </Box>
                  <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
                    {formatCurrency(l.amount)}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              No lines
            </Text>
          )}
        </Box>

        {/* Desktop view */}
        <Box visibleFrom="sm">
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Bill</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {d.cash_drop_lines?.map((l) => (
                <Table.Tr key={l.id}>
                  <Table.Td>{l.bill?.bill_ref || '-'}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {l.bill?.customer_code || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={500}>{formatCurrency(l.amount)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Card>
    </>
  );
}