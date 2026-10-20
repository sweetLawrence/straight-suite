import { Card, Table, Text, Title } from '@mantine/core';
import { BillSummary } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  bills: BillSummary[];
}

export function SalesByPropertyTable({ bills }: Props) {
  const map: Record<
    string,
    { code: string; name: string; count: number; total: number }
  > = {};

  for (const b of bills) {
    if (!b.property) continue;
    if (!map[b.property_id]) {
      map[b.property_id] = {
        code: b.property.code,
        name: b.property.name,
        count: 0,
        total: 0,
      };
    }
    map[b.property_id].count += 1;
    map[b.property_id].total += parseFloat(b.net_total);
  }

  const rows = Object.entries(map)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  if (rows.length === 0) {
    return (
      <Card withBorder>
        <Title order={5} mb="sm">
          Sales by Property
        </Title>
        <Text c="dimmed" size="sm" ta="center" py="md">
          No sales in this period.
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Title order={5} mb="sm">
        Sales by Property
      </Title>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Property</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Bills</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Total Sales</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Avg Bill</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>
                <Text fw={500}>
                  {r.code} - {r.name}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>{r.count}</Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {formatCurrency(r.total)}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {formatCurrency(r.total / r.count)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}