import { useMemo, useState } from 'react'
import { Title, Text, Table, Badge, TextInput, Group, Paper, Stack, Skeleton } from '@mantine/core'
import { Search, KeyRound } from 'lucide-react'
import { useBookings } from '../features/bookings/hooks'
import { useRoomTypes } from '../features/roomTypes/hooks'
import BookingDetailModal from '../features/bookings/BookingDetailModal'

function nightsUntil(checkOutDate: string) {
  const diff = new Date(checkOutDate).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function InHouseGuestsPage() {
  const [search, setSearch] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const { data, isLoading } = useBookings({
    status: 'checked_in',
    search: search || undefined,
    roomNumber: roomNumber || undefined,
    pageSize: 100
  })
  const { data: roomTypes } = useRoomTypes()

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.name ?? '-'

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data.data].sort((a, b) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime())
  }, [data])

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} className="text-primary-700 dark:text-primary-200">In-House Guests</Title>
        <Text size="sm" c="dimmed">Everyone currently checked in - sorted by soonest checkout first.</Text>
      </div>

      <Paper withBorder p="md" radius="md">
        <Group>
          <TextInput
            placeholder="Search guest name, email, phone, or booking code"
            leftSection={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="flex-1"
          />
          <TextInput
            placeholder="Room number"
            leftSection={<KeyRound size={15} />}
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.currentTarget.value)}
            w={160}
          />
        </Group>
      </Paper>

      <Paper withBorder radius="md" className="overflow-hidden">
        {isLoading ? (
          <Stack p="md">{[...Array(4)].map((_, i) => <Skeleton key={i} height={40} radius="sm" />)}</Stack>
        ) : sorted.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No one currently checked in matches these filters.</Text>
        ) : (
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover className="table-responsive">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Guest</Table.Th>
                <Table.Th>Room</Table.Th>
                <Table.Th>Room Type</Table.Th>
                <Table.Th>Check-in</Table.Th>
                <Table.Th>Check-out</Table.Th>
                <Table.Th>Nights Left</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((b) => {
                const nightsLeft = nightsUntil(b.checkOutDate)
                return (
                  <Table.Tr key={b.id} onClick={() => setSelectedBookingId(b.id)} className="cursor-pointer">
                    <Table.Td>
                      <Text size="sm" fw={500}>{b.guestFirstName} {b.guestLastName}</Text>
                      <Text size="xs" c="dimmed">{b.guestPhone}</Text>
                    </Table.Td>
                    <Table.Td>
                      {b.roomNumbers.length > 0 ? (
                        b.roomNumbers.map((rn) => <Badge key={rn} variant="light" color="primary" mr={4}>{rn}</Badge>)
                      ) : (
                        <Badge variant="light" color="gray">Unassigned</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{roomTypeName(b.roomTypeId)}</Table.Td>
                    <Table.Td>{b.checkInDate}</Table.Td>
                    <Table.Td>{b.checkOutDate}</Table.Td>
                    <Table.Td>
                      <Badge color={nightsLeft <= 0 ? 'red' : nightsLeft === 1 ? 'yellow' : 'green'} variant="light">
                        {nightsLeft <= 0 ? 'Due out today' : `${nightsLeft} night(s)`}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <BookingDetailModal bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
    </Stack>
  )
}