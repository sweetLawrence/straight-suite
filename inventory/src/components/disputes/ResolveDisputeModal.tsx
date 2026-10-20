import { Button, Group, Modal, Stack, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useResolveDispute } from '@/hooks/useOperations'
import { getErrorMessage } from '@/lib/api/client'

interface Props {
  opened: boolean
  onClose: () => void
  disputeId: string
}

export function ResolveDisputeModal ({ opened, onClose, disputeId }: Props) {
  const resolve = useResolveDispute(disputeId)

  const form = useForm({
    initialValues: {
      resolution: ''
    },
    validate: {
      resolution: v => (v.trim() ? null : 'Required')
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await resolve.mutateAsync(values)
      notifications.show({
        color: 'green',
        title: 'Dispute resolved',
        message: 'The dispute has been marked as resolved.'
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

  return (
    <Modal opened={opened} onClose={onClose} title='Resolve Dispute' size='md'>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea
            label='Resolution'
            placeholder='Explain what was decided'
            required
            autosize
            minRows={3}
            {...form.getInputProps('resolution')}
          />
          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' loading={resolve.isPending}>
              Resolve
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
