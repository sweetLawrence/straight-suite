import { Modal, TextInput, NumberInput, Button, Group, Stack, Select, ActionIcon, Text, Checkbox } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Trash2, Plus } from 'lucide-react'
import { useCreatePolicy } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
}

type TierType = 'days_before' | 'hours_before'

export default function PolicyFormModal({ opened, onClose }: Props) {
  const createPolicy = useCreatePolicy()

  const form = useForm({
    initialValues: {
      name: '',
      depositPct: 30,
      isDefault: false,
      tiers: [
        { type: 'days_before' as TierType, value: 15, refund_pct: 100 },
        { type: 'hours_before' as TierType, value: 48, refund_pct: 0 }
      ]
    }
  })

  function addTier() {
    form.insertListItem('tiers', { type: 'days_before', value: 1, refund_pct: 0 })
  }

  function handleSubmit(values: typeof form.values) {
    const tiers = values.tiers.map((t) => ({
      [t.type]: t.value,
      refund_pct: t.refund_pct
    }))

    createPolicy.mutate(
      { name: values.name, depositPct: values.depositPct, isDefault: values.isDefault, tiers },
      {
        onSuccess: () => {
          notifications.show({ message: 'Cancellation policy created.', color: 'green' })
          form.reset()
          onClose()
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Cancellation Policy" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" placeholder="Standard" {...form.getInputProps('name')} required />
          <NumberInput label="Deposit %" min={0} max={100} {...form.getInputProps('depositPct')} required />

          <Text size="sm" fw={600} mt="xs">Refund tiers</Text>
          {form.values.tiers.map((_, index) => (
            <Group key={index} gap="xs" align="flex-end">
              <Select
                label={index === 0 ? 'Cutoff type' : undefined}
                data={[{ value: 'days_before', label: 'Days before' }, { value: 'hours_before', label: 'Hours before' }]}
                {...form.getInputProps(`tiers.${index}.type`)}
                w={140}
              />
              <NumberInput
                label={index === 0 ? 'Cutoff value' : undefined}
                min={0}
                {...form.getInputProps(`tiers.${index}.value`)}
                w={100}
              />
              <NumberInput
                label={index === 0 ? 'Refund %' : undefined}
                min={0} max={100}
                {...form.getInputProps(`tiers.${index}.refund_pct`)}
                w={100}
              />
              <ActionIcon color="red" variant="light" onClick={() => form.removeListItem('tiers', index)}>
                <Trash2 size={15} />
              </ActionIcon>
            </Group>
          ))}
          <Button variant="light" leftSection={<Plus size={15} />} onClick={addTier} size="xs">Add Tier</Button>

          <Checkbox label="Set as default policy" mt="sm" {...form.getInputProps('isDefault', { type: 'checkbox' })} />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createPolicy.isPending}>Create Policy</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}