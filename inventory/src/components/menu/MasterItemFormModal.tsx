import { useEffect } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateItem, useUpdateItem } from '@/hooks/useItems'
import { useUnits } from '@/hooks/useCore'
import { getErrorMessage } from '@/lib/api/client'
import { MasterItem, ItemType } from '@/lib/api/item'

const itemTypes: { value: ItemType; label: string }[] = [
  { value: 'stock_portioned', label: 'Stock - Portioned' },
  { value: 'stock_bulk', label: 'Stock - Bulk' },
  { value: 'stock_packaged', label: 'Stock - Packaged' },
  { value: 'stock_produced', label: 'Stock - Produced' },
  { value: 'menu', label: 'Menu Item' },
  { value: 'service', label: 'Service' }
]

interface Props {
  opened: boolean
  onClose: () => void
  item: MasterItem | null
}

export function MasterItemFormModal ({ opened, onClose, item }: Props) {
  const units = useUnits()
  const create = useCreateItem()
  const update = useUpdateItem()
  const isEdit = !!item

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      item_type: 'stock_bulk' as ItemType,
      base_unit_id: '' as string | null,
      status: 'active' as 'active' | 'inactive' | 'discontinued'
    },
    validate: {
      code: v => (v ? null : 'Required'),
      name: v => (v ? null : 'Required'),
      item_type: v => (v ? null : 'Required')
    }
  })

  useEffect(() => {
    if (opened && item) {
      form.setValues({
        code: item.code,
        name: item.name,
        item_type: item.item_type,
        base_unit_id: item.base_unit_id,
        status: item.status
      })
    } else if (opened && !item) {
      form.reset()
    }
  }, [opened, item])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: item!.id,
          data: {
            code: values.code,
            name: values.name,
            item_type: values.item_type,
            base_unit_id: values.base_unit_id || null,
            status: values.status
          }
        })
        notifications.show({
          color: 'green',
          title: 'Item updated',
          message: ''
        })
      } else {
        await create.mutateAsync({
          code: values.code,
          name: values.name,
          item_type: values.item_type,
          base_unit_id: values.base_unit_id || null
        })
        notifications.show({
          color: 'green',
          title: 'Item created',
          message: ''
        })
      }
      form.reset()
      onClose()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const unitOptions =
    units.data?.data.map(u => ({
      value: u.id,
      label: `${u.name} (${u.code})`
    })) || []

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit Item' : 'Add Item'}
      size='md'
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label='Code'
            placeholder='e.g. PORK'
            required
            {...form.getInputProps('code')}
          />
          <TextInput
            label='Name'
            placeholder='e.g. Pork (Fresh)'
            required
            {...form.getInputProps('name')}
          />
          <Select
            label='Type'
            data={itemTypes}
            required
            {...form.getInputProps('item_type')}
          />
          <Select
            label='Base Unit'
            placeholder='Pick a unit'
            searchable
            clearable
            data={unitOptions}
            {...form.getInputProps('base_unit_id')}
          />
          {isEdit && (
            <Select
              label='Status'
              data={['active', 'inactive', 'discontinued']}
              {...form.getInputProps('status')}
            />
          )}
          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              loading={create.isPending || update.isPending}
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
