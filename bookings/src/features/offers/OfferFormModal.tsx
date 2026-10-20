import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Stack
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateOffer } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
}

export default function OfferFormModal ({ opened, onClose }: Props) {
  const createOffer = useCreateOffer()
  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      code: ''
    }
  })

  function handleSubmit (values: typeof form.values) {
    createOffer.mutate(values as any, {
      onSuccess: () => {
        notifications.show({ message: 'Offer created.', color: 'green' })
        form.reset()
        onClose()
      },
      onError: (err: any) =>
        notifications.show({ message: err.message, color: 'red' })
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title='New Offer'>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label='Title'
            placeholder='Midweek Escape'
            {...form.getInputProps('title')}
            required
          />
          <Textarea
            label='Description'
            {...form.getInputProps('description')}
            minRows={2}
          />
          <Group grow>
            <Select
              label='Discount type'
              data={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed_amount', label: 'Fixed amount' }
              ]}
              {...form.getInputProps('discountType')}
            />
            <NumberInput
              label='Discount value'
              min={0}
              {...form.getInputProps('discountValue')}
            />
          </Group>

          <TextInput
            label='Promo code (optional)'
            placeholder='MIDWEEK20'
            description='Leave blank for a marketing-only offer with no redeemable discount'
            {...form.getInputProps('code')}
          />

          <Group justify='flex-end' mt='sm'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              color='primary'
              loading={createOffer.isPending}
            >
              Create Offer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
