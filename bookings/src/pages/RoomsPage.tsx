// import { useState } from 'react'
// import { Title, Text, Table, Badge, Button, Group, Select, Stack, ActionIcon } from '@mantine/core'
// import { Plus, Trash2 } from 'lucide-react'
// import { notifications } from '@mantine/notifications'
// import { useRooms, useUpdateRoomStatus, useDeleteRoom } from '../features/rooms/hooks'
// import { useRoomTypes } from '../features/roomTypes/hooks'
// import { ROOM_STATUSES, type RoomStatus } from '../types/room'
// import RoomFormModal from '../features/rooms/RoomFormModal'

// const STATUS_COLORS: Record<RoomStatus, string> = { active: 'green', maintenance: 'yellow', out_of_service: 'red' }

// export default function RoomsPage() {
//   const [roomTypeFilter, setRoomTypeFilter] = useState('')
//   const [statusFilter, setStatusFilter] = useState('')
//   const { data: roomTypes } = useRoomTypes()
//   const { data: rooms, isLoading } = useRooms(roomTypeFilter || undefined, statusFilter || undefined)
//   const updateStatus = useUpdateRoomStatus()
//   const deleteRoom = useDeleteRoom()
//   const [formOpen, setFormOpen] = useState(false)

//   const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.name ?? '-'

//   function handleStatusChange(id: string, status: RoomStatus) {
//     updateStatus.mutate({ id, status }, {
//       onSuccess: () => notifications.show({ message: 'Room status updated.', color: 'green' }),
//       onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//     })
//   }

//   function handleDelete(id: string) {
//     if (!confirm('Delete this room?')) return
//     deleteRoom.mutate(id, { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) })
//   }

//   return (
//     <Stack gap="lg">
//       <Group justify="space-between" align="flex-end">
//         <div>
//           <Title order={2} className="text-primary-700">Physical Rooms</Title>
//           <Text size="sm" c="dimmed">The actual rooms front desk assigns guests to at check-in.</Text>
//         </div>
//         <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setFormOpen(true)}>
//           New Room
//         </Button>
//       </Group>

//       <Group>
//         <Select
//           placeholder="Filter by room type"
//           data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: rt.name }))}
//           value={roomTypeFilter}
//           onChange={(v) => setRoomTypeFilter(v ?? '')}
//           clearable
//           w={220}
//         />
//         <Select
//           placeholder="Filter by status"
//           data={ROOM_STATUSES}
//           value={statusFilter}
//           onChange={(v) => setStatusFilter(v ?? '')}
//           clearable
//           w={180}
//         />
//       </Group>

//       {isLoading ? (
//         <Text c="dimmed">Loading...</Text>
//       ) : !rooms || rooms.length === 0 ? (
//         <Text c="dimmed">No rooms match these filters.</Text>
//       ) : (
//         <Table striped highlightOnHover className="table-responsive">
//           <Table.Thead>
//             <Table.Tr>
//               <Table.Th>Room #</Table.Th>
//               <Table.Th>Room Type</Table.Th>
//               <Table.Th>Floor</Table.Th>
//               <Table.Th>Status</Table.Th>
//               <Table.Th />
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             {rooms.map((r) => (
//               <Table.Tr key={r.id}>
//                 <Table.Td>
//                   <Text fw={500}>{r.roomNumber}</Text>
//                   <Text size="xs" c="dimmed" ff="monospace">{r.id}</Text>
//                 </Table.Td>
//                 <Table.Td>{roomTypeName(r.roomTypeId)}</Table.Td>
//                 <Table.Td>{r.floor ?? '-'}</Table.Td>
//                 <Table.Td>
//                   <Select
//                     data={ROOM_STATUSES}
//                     value={r.status}
//                     onChange={(v) => v && handleStatusChange(r.id, v as RoomStatus)}
//                     w={150}
//                     size="xs"
//                     leftSection={<Badge size="xs" color={STATUS_COLORS[r.status]} className="ml-1" />}
//                   />
//                 </Table.Td>
//                 <Table.Td>
//                   <ActionIcon color="red" variant="light" onClick={() => handleDelete(r.id)}>
//                     <Trash2 size={15} />
//                   </ActionIcon>
//                 </Table.Td>
//               </Table.Tr>
//             ))}
//           </Table.Tbody>
//         </Table>
//       )}

//       <RoomFormModal opened={formOpen} onClose={() => setFormOpen(false)} />
//     </Stack>
//   )
// }




























import { useState } from 'react'
import { Title, Text, Table, Badge, Button, Group, Select, Stack, ActionIcon } from '@mantine/core'
import { Plus, Trash2 } from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useRooms, useUpdateRoomStatus, useDeleteRoom } from '../features/rooms/hooks'
import { useRoomTypes } from '../features/roomTypes/hooks'
import { ROOM_STATUSES, type RoomStatus } from '../types/room'
import RoomFormModal from '../features/rooms/RoomFormModal'

const STATUS_COLORS: Record<RoomStatus, string> = { active: 'green', maintenance: 'yellow', out_of_service: 'red' }

export default function RoomsPage() {
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: roomTypes } = useRoomTypes()
  const { data: rooms, isLoading } = useRooms(roomTypeFilter || undefined, statusFilter || undefined)
  const updateStatus = useUpdateRoomStatus()
  const deleteRoom = useDeleteRoom()
  const [formOpen, setFormOpen] = useState(false)

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.name ?? '-'

  function handleStatusChange(id: string, status: RoomStatus) {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => notifications.show({
        message: 'Status updated.',
        color: 'green',
        position: 'top-right',
        autoClose: 2000
      }),
      onError: (err: any) => notifications.show({
        message: err.message,
        color: 'red',
        position: 'top-right',
        autoClose: 3000
      })
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this room?')) return
    deleteRoom.mutate(id, {
      onError: (err: any) => notifications.show({
        message: err.message,
        color: 'red',
        position: 'top-right',
        autoClose: 3000
      })
    })
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
            Inventory
          </span>
          <Title order={2} className="font-serif text-primary-700 mt-1">Physical rooms</Title>
          <Text size="sm" c="dimmed" mt={2}>
            The actual rooms front desk assigns guests to at check-in.
          </Text>
        </div>
        <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setFormOpen(true)}>
          New room
        </Button>
      </Group>

      <Group>
        <Select
          placeholder="Filter by room type"
          data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: rt.name }))}
          value={roomTypeFilter}
          onChange={(v) => setRoomTypeFilter(v ?? '')}
          clearable
          w={220}
        />
        <Select
          placeholder="Filter by status"
          data={ROOM_STATUSES}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v ?? '')}
          clearable
          w={180}
        />
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !rooms || rooms.length === 0 ? (
        <Text c="dimmed">No rooms match these filters.</Text>
      ) : (
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover className="table-responsive">
          <Table.Thead className="bg-surface-50">
            <Table.Tr>
              <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Room #</Table.Th>
              <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Room type</Table.Th>
              <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Floor</Table.Th>
              <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rooms.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Text fw={500} size="sm">{r.roomNumber}</Text>
                  <Text size="xs" c="dimmed" ff="monospace">{r.id}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{roomTypeName(r.roomTypeId)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{r.floor ?? '-'}</Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    data={ROOM_STATUSES}
                    value={r.status}
                    onChange={(v) => v && handleStatusChange(r.id, v as RoomStatus)}
                    w={150}
                    size="xs"
                    radius="sm"
                    leftSection={<Badge size="xs" color={STATUS_COLORS[r.status]} className="ml-1" />}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon color="red" variant="light" radius="sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={15} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <RoomFormModal opened={formOpen} onClose={() => setFormOpen(false)} />
    </Stack>
  )
}