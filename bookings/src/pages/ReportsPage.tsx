import { useState } from 'react'
import { Title, Text, Table, Stack, Group, Paper } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useReports } from '../features/reports/hooks'

function firstOfMonthStr() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function lastOfMonthStr() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function formatNumber(n: number) {
  return n.toLocaleString('en-KE')
}

export default function ReportsPage() {
  const [from, setFrom] = useState<string | null>(firstOfMonthStr())
  const [to, setTo] = useState<string | null>(lastOfMonthStr())
  const { occupancy, revenue } = useReports(from ?? '', to ?? '')

  const revenueTotals = revenue.data?.reduce(
    (acc, r) => ({
      booked: acc.booked + r.bookedRevenue,
      collected: acc.collected + r.collectedRevenue,
      outstanding: acc.outstanding + r.outstandingRevenue
    }),
    { booked: 0, collected: 0, outstanding: 0 }
  )

  return (
    <Stack gap="lg">
      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
          Analytics
        </span>
        <Title order={2} className="font-serif text-primary-700 mt-1">Reports</Title>
        <Text size="sm" c="dimmed" mt={2}>
          Occupancy and revenue for this property, by date range.
        </Text>
      </div>

      <Paper withBorder p="md" radius="md">
        <Group align="flex-end">
          <DateInput label="From" value={from} onChange={setFrom} radius="sm" />
          <DateInput label="To" value={to} onChange={setTo} radius="sm" />
        </Group>
      </Paper>

      <Paper withBorder radius="md" p={0}>
        <div className="px-5 py-4 border-b border-surface-100">
          <Text fw={600} className="text-primary-700">Occupancy</Text>
        </div>

        {occupancy.isLoading ? (
          <Text c="dimmed" size="sm" p="md">Loading...</Text>
        ) : !occupancy.data || occupancy.data.length === 0 ? (
          <Text c="dimmed" size="sm" p="md">No data for this range.</Text>
        ) : (
          <Table verticalSpacing="md" horizontalSpacing="md" className="table-responsive">
            <Table.Thead className="bg-surface-50">
              <Table.Tr>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Room type</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Booked nights</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Available nights</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Occupancy</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {occupancy.data.map((r) => (
                <Table.Tr key={r.roomTypeId}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{r.roomTypeName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatNumber(r.bookedRoomNights)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{formatNumber(r.availableRoomNights)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Text size="sm" fw={500} w={40}>{r.occupancyPct}%</Text>
                      <div className="h-1.5 w-28 rounded-full bg-surface-200 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(r.occupancyPct, 100)}%`,
                            backgroundColor: r.occupancyPct >= 75 ? '#2F6B4F' : r.occupancyPct >= 40 ? '#B8860B' : '#8A93A3'
                          }}
                        />
                      </div>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Paper withBorder radius="md" p={0}>
        <div className="px-5 py-4 border-b border-surface-100">
          <Text fw={600} className="text-primary-700">Revenue</Text>
        </div>

        {revenue.isLoading ? (
          <Text c="dimmed" size="sm" p="md">Loading...</Text>
        ) : !revenue.data || revenue.data.length === 0 ? (
          <Text c="dimmed" size="sm" p="md">No data for this range.</Text>
        ) : (
          <Table verticalSpacing="md" horizontalSpacing="md" className="table-responsive">
            <Table.Thead className="bg-surface-50">
              <Table.Tr>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Room type</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Booked</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Collected</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Outstanding</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {revenue.data.map((r) => (
                <Table.Tr key={r.roomTypeId}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{r.roomTypeName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatNumber(r.bookedRevenue)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ color: '#2F6B4F' }}>{formatNumber(r.collectedRevenue)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ color: r.outstandingRevenue > 0 ? '#B8860B' : undefined }} c={r.outstandingRevenue > 0 ? undefined : 'dimmed'}>
                      {formatNumber(r.outstandingRevenue)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            {revenueTotals && (
              <Table.Tfoot>
                <Table.Tr className="border-t-2 border-surface-200">
                  <Table.Td>
                    <Text size="sm" fw={700}>Total</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700}>{formatNumber(revenueTotals.booked)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700} style={{ color: '#2F6B4F' }}>{formatNumber(revenueTotals.collected)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700} style={{ color: revenueTotals.outstanding > 0 ? '#B8860B' : undefined }}>
                      {formatNumber(revenueTotals.outstanding)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            )}
          </Table>
        )}
      </Paper>
    </Stack>
  )
}