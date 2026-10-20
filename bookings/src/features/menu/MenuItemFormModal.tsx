import { Modal, TextInput, Textarea, NumberInput, Button, Group, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateItem } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
  categoryId: string | null
  nextSortOrder: number
}

export default function MenuItemFormModal({ opened, onClose, categoryId, nextSortOrder }: Props) {
  const createItem = useCreateItem()
  const form = useForm({ initialValues: { name: '', description: '', price: 0 } })

  function handleSubmit(values: typeof form.values) {
    if (!categoryId) return
    createItem.mutate(
      { categoryId, input: { ...values, sortOrder: nextSortOrder } },
      {
        onSuccess: () => {
          notifications.show({ message: 'Menu item added.', color: 'green' })
          form.reset()
          onClose()
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Menu Item">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" placeholder="Nyama Choma Platter" {...form.getInputProps('name')} required />
          <Textarea label="Description" {...form.getInputProps('description')} minRows={2} />
          <NumberInput label="Price (KSh)" min={0} decimalScale={2} {...form.getInputProps('price')} required />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createItem.isPending}>Add Item</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}