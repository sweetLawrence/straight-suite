import { Card, Table, Text, Title } from '@mantine/core';
import { PaymentSummary } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  payments: PaymentSummary[];
}

export function SalesByMethodTable({ payments }: Props) {
  const totals: Record<
    string,
    { total: number; verified: number; pending: number }
  > = {
    cash: { total: 0, verified: 0, pending: 0 },
    mpesa: { total: 0, verified: 0, pending: 0 },
    card: { total: 0, verified: 0, pending: 0 },
    cheque: { total: 0, verified: 0, pending: 0 },
    house: { total: 0, verified: 0, pending: 0 },
    other: { total: 0, verified: 0, pending: 0 },
  };

  for (const p of payments) {
    for (const l of p.payment_lines || []) {
      const m = totals[l.method] ? l.method : 'other';
      const amt = parseFloat(l.amount);
      totals[m].total += amt;
      if (l.verification_status === 'verified') {
        totals[m].verified += amt;
      } else {
        totals[m].pending += amt;
      }
    }
  }

  return (
    <Card withBorder>
      <Title order={5} mb="sm">
        Sales by Payment Method
      </Title>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Method</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Verified</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Pending</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(['cash', 'mpesa', 'card', 'cheque', 'house', 'other'] as const).filter((m) => totals[m].total > 0 || ['cash', 'mpesa', 'card'].includes(m)).map((m) => (
            <Table.Tr key={m}>
              <Table.Td>
                <Text fw={500} tt="capitalize">
                  {m === "mpesa" ? "M-Pesa" : m === "house" ? "House (MD)" : m}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {formatCurrency(totals[m].total)}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text c="green">{formatCurrency(totals[m].verified)}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text c={totals[m].pending > 0 ? 'orange' : 'dimmed'}>
                  {formatCurrency(totals[m].pending)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}