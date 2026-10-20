import { Card, Table, Text, Title } from '@mantine/core';
import { BillSummary } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  bills: BillSummary[];
}

export function SalesByWaiterTable({ bills }: Props) {
  // Group bills by waiter
  const map: Record<
    string,
    { name: string; count: number; total: number }
  > = {};

  for (const b of bills) {
    if (!b.waiter) continue;
    if (!map[b.waiter_id]) {
      map[b.waiter_id] = {
        name: b.waiter.full_name,
        count: 0,
        total: 0,
      };
    }
    map[b.waiter_id].count += 1;
    map[b.waiter_id].total += parseFloat(b.net_total);
  }

  const rows = Object.entries(map)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card withBorder>
      <Title order={5} mb="sm">
        Sales by Waiter
      </Title>
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="md">
          No sales in this period.
        </Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Waiter</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Bills</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Total Sales</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>{r.count}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Text fw={500}>{formatCurrency(r.total)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}