import { useState } from 'react'
import {
  Table,
  Badge,
  Button,
  Group,
  TextInput,
  Select,
  Pagination,
  Title,
  Text,
  Paper,
  Stack,
  Skeleton,
  Avatar
} from '@mantine/core'
import { Search, Plus, Users } from 'lucide-react'
import { useBookings } from '../features/bookings/hooks'
import { STATUS_COLORS, type BookingStatus } from '../types/booking'
import BookingDetailModal from '../features/bookings/BookingDetailModal'
import ManualBookingModal from '../features/bookings/ManualBookingModal'

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
  { value: 'expired', label: 'Expired' }
]

function nightsBetween(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(Math.round(diff / (1000 * 60 * 60 * 24)), 0)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

function paymentRatio(paid: number, subtotal: number) {
  if (!subtotal) return 0
  return Math.min(paid / subtotal, 1)
}

export default function BookingsPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)

  const { data, isLoading } = useBookings({
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 20
  })

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
            Reservations
          </span>
          <Title order={2} className="font-serif text-primary-700 mt-1">
            Bookings
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            Search, filter, and manage every reservation for this property.
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          color="accent"
          onClick={() => setManualOpen(true)}
        >
          Walk-in booking
        </Button>
      </Group>

      <Paper withBorder p="md" radius="md">
        <Group>
          <TextInput
            placeholder="Search name, email, phone, or booking code"
            leftSection={<Search size={15} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            className="flex-1"
          />
          <Select
            data={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setStatus(v ?? '')
              setPage(1)
            }}
            placeholder="Status"
            clearable={false}
            w={190}
          />
        </Group>
      </Paper>

      <Paper withBorder radius="md" className="overflow-hidden">
        {isLoading ? (
          <Stack p="md">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={40} radius="sm" />
            ))}
          </Stack>
        ) : !data || data.data.length === 0 ? (
          <Stack align="center" py="xl" gap="xs">
            <Users size={32} className="text-surface-400" />
            <Text c="dimmed">No bookings match these filters.</Text>
          </Stack>
        ) : (
          <>
            <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover className="table-responsive">
              <Table.Thead className="bg-surface-50">
                <Table.Tr>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Guest</Table.Th>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Code</Table.Th>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Check-in</Table.Th>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Check-out</Table.Th>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Status</Table.Th>
                  <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Payment</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.data.map((b) => {
                  const ratio = paymentRatio(b.amountPaid, b.subtotal)
                  const fullyPaid = ratio >= 1

                  return (
                    <Table.Tr key={b.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar color="primary" radius="xl" size="sm">
                            {initials(b.guestFirstName, b.guestLastName)}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {b.guestFirstName} {b.guestLastName}
                            </Text>
                            <Text size="xs" c="dimmed">{b.guestEmail}</Text>
                          </div>
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">{b.bookingCode}</Text>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm">{formatDate(b.checkInDate)}</Text>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm">{formatDate(b.checkOutDate)}</Text>
                        <Text size="xs" c="dimmed">
                          {nightsBetween(b.checkInDate, b.checkOutDate)} night(s)
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Badge color={STATUS_COLORS[b.status]} variant="light" radius="sm">
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {b.amountPaid} / {b.subtotal} {b.currency}
                        </Text>
                        <div className="h-1 w-24 rounded-full bg-surface-200 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${ratio * 100}%`,
                              backgroundColor: fullyPaid ? '#2F6B4F' : '#B8860B'
                            }}
                          />
                        </div>
                      </Table.Td>

                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          color="primary"
                          onClick={() => setSelectedBookingId(b.id)}
                        >
                          View
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>

            <Group justify="space-between" p="md" className="border-t border-surface-100">
              <Text size="sm" c="dimmed">{data.meta.total} booking(s) total</Text>
              <Pagination
                total={Math.max(Math.ceil(data.meta.total / data.meta.pageSize), 1)}
                value={page}
                onChange={setPage}
                size="sm"
              />
            </Group>
          </>
        )}
      </Paper>

      <BookingDetailModal
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
      />
      <ManualBookingModal
        opened={manualOpen}
        onClose={() => setManualOpen(false)}
      />
    </Stack>
  )
}