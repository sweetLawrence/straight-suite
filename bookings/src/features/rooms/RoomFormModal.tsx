import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useRoomTypes } from '../roomTypes/hooks'
import { useCreateRoom } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
}

export default function RoomFormModal({ opened, onClose }: Props) {
  const { data: roomTypes } = useRoomTypes()
  const createRoom = useCreateRoom()

  const form = useForm({
    initialValues: { roomTypeId: '', roomNumber: '', floor: '' }
  })

  function handleSubmit(values: typeof form.values) {
    createRoom.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: 'Room created.', color: 'green' })
        form.reset()
        onClose()
      },
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Room">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Room Type"
            data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: rt.name }))}
            {...form.getInputProps('roomTypeId')}
            required
          />
          <TextInput label="Room Number" placeholder="101" {...form.getInputProps('roomNumber')} required />
          <TextInput label="Floor" placeholder="1" {...form.getInputProps('floor')} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createRoom.isPending}>Create Room</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}