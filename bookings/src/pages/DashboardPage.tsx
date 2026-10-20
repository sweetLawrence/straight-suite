import { Title, Text, SimpleGrid, Card, Stack, Table, Badge, Loader, Group, Button } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useAdminScope } from '../lib/useAdminScope'
import { listBookings } from '../features/bookings/api'
import { usePendingApplicants } from '../features/staff/hooks'
import { STATUS_COLORS } from '../types/booking'
import { useOverdueArrivals, useUpdateBookingStatus } from '../features/bookings/hooks'
import { AlertTriangle } from 'lucide-react'
import { notifications } from '@mantine/notifications'


function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function nightsBetween(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(Math.round(diff / (1000 * 60 * 60 * 24)), 0)
}

function daysOverdue(checkInDate: string) {
  return Math.max(Math.round((Date.now() - new Date(checkInDate).getTime()) / 86400000), 1)
}

const ACCENT_COLORS: Record<string, string> = {
  yellow: '#B8860B',
  green: '#2F6B4F',
  secondary: '#2F5C8A',
  blue: '#2F5C8A',
  accent: '#C9A227'
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role)
  const { propertyId } = useAdminScope()
  const today = todayStr()

  const recentQuery = useQuery({
    queryKey: ['dashboardRecent', propertyId],
    queryFn: () => listBookings({ page: 1, pageSize: 5 }, propertyId)
  })
  const pendingQuery = useQuery({
    queryKey: ['dashboardPending', propertyId],
    queryFn: () => listBookings({ status: 'pending_payment', page: 1, pageSize: 1 }, propertyId)
  })
  const confirmedQuery = useQuery({
    queryKey: ['dashboardConfirmed', propertyId],
    queryFn: () => listBookings({ status: 'confirmed', page: 1, pageSize: 1 }, propertyId)
  })

  const checkingInQuery = useQuery({
    queryKey: ['dashboardCheckingIn', propertyId, today],
    queryFn: () => listBookings({ status: 'confirmed', from: today, to: today, page: 1, pageSize: 1 }, propertyId)
  })

  const checkedInListQuery = useQuery({
    queryKey: ['dashboardCheckedInList', propertyId],
    queryFn: () => listBookings({ status: 'checked_in', page: 1, pageSize: 100 }, propertyId)
  })
  const pendingApplicantsQuery = usePendingApplicants()

  const { data: overdueArrivals, isLoading: overdueLoading } = useOverdueArrivals()
  const updateStatus = useUpdateBookingStatus()

  function handleQuickStatus(id: string, status: 'checked_in' | 'no_show') {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => notifications.show({ message: status === 'checked_in' ? 'Checked in.' : 'Marked as no-show - room released.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  const checkingOutToday = checkedInListQuery.data?.data.filter((b) => b.checkOutDate === today).length ?? 0

  const isLoading = recentQuery.isLoading || pendingQuery.isLoading || confirmedQuery.isLoading

  return (
    <Stack gap="xl">
      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
          Overview
        </span>
        <Title order={2} className="font-serif text-primary-700 mt-1">Dashboard</Title>
        <Text size="sm" c="dimmed" mt={2}>Signed in as {role}.</Text>
      </div>

      {!overdueLoading && overdueArrivals && overdueArrivals.data.length > 0 && (
        <Card withBorder radius="md" p="md" className="border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-orange-600" />
            <Text fw={700} className="text-orange-800 dark:text-orange-300">
              Needs Attention - {overdueArrivals.data.length} overdue arrival(s)
            </Text>
          </div>
          <Stack gap="xs">
            {overdueArrivals.data.map((b) => (
              <Group key={b.id} justify="space-between" className="border-b border-orange-200 dark:border-orange-900 pb-2 last:border-0">
                <div>
                  <Text size="sm" fw={500}>{b.guestFirstName} {b.guestLastName}</Text>
                  <Text size="xs" c="dimmed">
                    Was due {formatDate(b.checkInDate)} · <Badge size="xs" color="orange" variant="light">{daysOverdue(b.checkInDate)} day(s) overdue</Badge>
                  </Text>
                </div>
                <Group gap="xs">
                  <Button size="xs" color="green" onClick={() => handleQuickStatus(b.id, 'checked_in')} loading={updateStatus.isPending}>
                    They arrived : Check In
                  </Button>
                  <Button size="xs" color="red" variant="outline" onClick={() => handleQuickStatus(b.id, 'no_show')} loading={updateStatus.isPending}>
                    Mark No-Show
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      {isLoading ? (
        <Loader />
      ) : (
        <SimpleGrid cols={role === 'superadmin' ? 6 : 5} spacing="md">
          <StatCard label="Total bookings" value={recentQuery.data?.meta.total ?? 0} />
          <StatCard label="Pending payment" value={pendingQuery.data?.meta.total ?? 0} color="" />
          <StatCard label="Confirmed" value={confirmedQuery.data?.meta.total ?? 0} color="green" />
          <StatCard label="Checking in today" value={checkingInQuery.data?.meta.total ?? 0} color="secondary" />
          <StatCard label="Checking out today" value={checkingOutToday} color="blue" />
          {role === 'superadmin' && (
            <StatCard label="Pending applicants" value={pendingApplicantsQuery.data?.length ?? 0} color="accent" />
          )}
        </SimpleGrid>
      )}

      <Card withBorder radius="md" p={0}>
        <div className="px-5 py-4 border-b border-surface-100">
          <Text fw={600} className="text-primary-700">Most recent bookings</Text>
        </div>

        {recentQuery.isLoading ? (
          <Text c="dimmed" size="sm" p="md">Loading...</Text>
        ) : !recentQuery.data || recentQuery.data.data.length === 0 ? (
          <Text c="dimmed" size="sm" p="md">No bookings yet.</Text>
        ) : (
          <Table verticalSpacing="sm" horizontalSpacing="md" className="table-responsive">
            <Table.Thead className="bg-surface-50">
              <Table.Tr>
                <Table.Th>Guest</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Check-in</Table.Th>
                <Table.Th>Check-out</Table.Th>
                <Table.Th>Nights</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentQuery.data.data.map((b) => (
                <Table.Tr key={b.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{b.guestFirstName} {b.guestLastName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">{b.bookingCode}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(b.checkInDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(b.checkOutDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{nightsBetween(b.checkInDate, b.checkOutDate)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[b.status]} variant="light" radius="sm">
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const accent = color ? ACCENT_COLORS[color] ?? '#2F5C8A' : '#5B6472'

  return (
    <Card withBorder radius="sm" p="md" className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-[px]"
        style={{ backgroundColor: accent }}
      />
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="font-mono tracking-wider">
            {label}
          </Text>
          <Text className="font-serif" size="28px" fw={600} c="var(--mantine-color-primary-7)">
            {value}
          </Text>
        </Stack>
      </Group>
    </Card>
  )
}