import { Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useDecideAdjustment } from '@/hooks/useAdmin'
import { getErrorMessage } from '@/lib/api/client'

interface Props {
  opened: boolean
  onClose: () => void
  adjustmentId: string
}

export function DecideAdjustmentModal ({
  opened,
  onClose,
  adjustmentId
}: Props) {
  const decide = useDecideAdjustment(adjustmentId)

  const form = useForm({
    initialValues: {
      decision: 'approved' as 'approved' | 'rejected',
      notes: ''
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await decide.mutateAsync({
        decision: values.decision,
        notes: values.notes || undefined
      })
      notifications.show({
        color: values.decision === 'approved' ? 'green' : 'orange',
        title: `Adjustment ${values.decision}`,
        message: `The adjustment has been ${values.decision}.`
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
    <Modal opened={opened} onClose={onClose} title='Decide Adjustment'>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label='Decision'
            data={[
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' }
            ]}
            {...form.getInputProps('decision')}
          />
          <Textarea
            label='Notes (optional)'
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              color={form.values.decision === 'approved' ? 'green' : 'red'}
              loading={decide.isPending}
            >
              {form.values.decision === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
