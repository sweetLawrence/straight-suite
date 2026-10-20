import { Button, Group, Modal, NumberInput, Select, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateVarianceThreshold } from '@/hooks/useProduction'
import { useStockItems } from '@/hooks/useStock'
import { getErrorMessage } from '@/lib/api/client'

interface Props {
  opened: boolean
  onClose: () => void
}

export function CreateThresholdModal ({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200, stock_model: 'produced' })
  const create = useCreateVarianceThreshold()

  const form = useForm({
    initialValues: {
      output_stock_item_id: '',
      warning_pct: 5,
      critical_pct: 15,
      auto_accept_pct: 3
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await create.mutateAsync({
        output_stock_item_id: values.output_stock_item_id || null,
        warning_pct: values.warning_pct,
        critical_pct: values.critical_pct,
        auto_accept_pct: values.auto_accept_pct
      })
      notifications.show({
        color: 'green',
        title: 'Threshold created',
        message:
          'The new threshold will apply to future production completions.'
      })
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

  const itemOptions = [
    { value: '', label: 'Default (all items)' },
    ...(stockItems.data?.data.map(s => ({
      value: s.id,
      label: s.item?.name || s.item?.code || 'Item'
    })) || [])
  ]

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='New Variance Threshold'
      size='md'
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label='Output Item'
            data={itemOptions}
            searchable
            {...form.getInputProps('output_stock_item_id')}
          />
          <NumberInput
            label='Auto-accept %'
            description='Variances at or below this are silently accepted'
            min={0}
            {...form.getInputProps('auto_accept_pct')}
          />
          <NumberInput
            label='Warning %'
            description='Variances above this are flagged'
            min={0}
            {...form.getInputProps('warning_pct')}
          />
          <NumberInput
            label='Critical %'
            description='Variances above this are escalated'
            min={0}
            {...form.getInputProps('critical_pct')}
          />
          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' loading={create.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
