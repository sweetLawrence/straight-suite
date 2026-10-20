// import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from '@mantine/core'
// import { DateInput } from '@mantine/dates'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useRoomTypes } from '../roomTypes/hooks'
// import { usePolicies } from '../policies/hooks'
// import { useCreateRatePlan } from './hooks'

// interface Props {
//   opened: boolean
//   onClose: () => void
// }

// export default function RatePlanFormModal({ opened, onClose }: Props) {
//   const { data: roomTypes } = useRoomTypes()
//   const { data: policies } = usePolicies()
//   const createRatePlan = useCreateRatePlan()

//   const form = useForm({
//     initialValues: {
//       roomTypeId: '',
//       name: '',
//       priceOverride: 0,
//       cancellationPolicyId: '',
//       validFrom: null as Date | null,
//       validTo: null as Date | null
//     }
//   })

//   function handleSubmit(values: typeof form.values) {
//     if (!values.validFrom || !values.validTo) return
//     createRatePlan.mutate(
//       {
//         roomTypeId: values.roomTypeId,
//         name: values.name,
//         priceOverride: values.priceOverride,
//         cancellationPolicyId: values.cancellationPolicyId || null,
//         validFrom: values.validFrom.toISOString().slice(0, 10),
//         validTo: values.validTo.toISOString().slice(0, 10)
//       },
//       {
//         onSuccess: () => {
//           notifications.show({ message: 'Rate plan created.', color: 'green' })
//           form.reset()
//           onClose()
//         },
//         onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//       }
//     )
//   }

//   return (
//     <Modal opened={opened} onClose={onClose} title="New Rate Plan" size="md">
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <Select
//             label="Room Type"
//             data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: rt.name }))}
//             {...form.getInputProps('roomTypeId')}
//             required
//           />
//           <TextInput label="Name" placeholder="August Discount" {...form.getInputProps('name')} required />
//           <NumberInput label="Price override" min={0} decimalScale={2} {...form.getInputProps('priceOverride')} required />
//           <Select
//             label="Cancellation policy (optional)"
//             placeholder="Fall back to property default"
//             data={(policies ?? []).map((p) => ({ value: p.id, label: p.name }))}
//             clearable
//             {...form.getInputProps('cancellationPolicyId')}
//           />
//           <Group grow>
//             <DateInput label="Valid from" {...form.getInputProps('validFrom')} required />
//             <DateInput label="Valid to" {...form.getInputProps('validTo')} required />
//           </Group>
//           <Group justify="flex-end" mt="sm">
//             <Button variant="default" onClick={onClose}>Cancel</Button>
//             <Button type="submit" color="primary" loading={createRatePlan.isPending}>Create Rate Plan</Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }









import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useRoomTypes } from '../roomTypes/hooks'
import { usePolicies } from '../policies/hooks'
import { useCreateRatePlan } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
}

export default function RatePlanFormModal({ opened, onClose }: Props) {
  const { data: roomTypes } = useRoomTypes()
  const { data: policies } = usePolicies()
  const createRatePlan = useCreateRatePlan()

  const form = useForm({
    initialValues: {
      roomTypeId: '',
      name: '',
      priceOverride: 0,
      cancellationPolicyId: '',
      boardType: null as string | null,
      validFrom: null as Date | null,
      validTo: null as Date | null
    }
  })

  function handleSubmit(values: typeof form.values) {
    // Convert string values to Date objects if they're strings
    const validFrom = values.validFrom instanceof Date ? values.validFrom : new Date(values.validFrom as any)
    const validTo = values.validTo instanceof Date ? values.validTo : new Date(values.validTo as any)
    
    // Check if dates are valid
    if (!validFrom || !validTo || isNaN(validFrom.getTime()) || isNaN(validTo.getTime())) {
      notifications.show({ 
        message: 'Please select valid dates', 
        color: 'red' 
      })
      return
    }

    createRatePlan.mutate(
      {
        roomTypeId: values.roomTypeId,
        name: values.name,
        priceOverride: values.priceOverride,
        cancellationPolicyId: values.cancellationPolicyId || null,
        boardType: (values.boardType as 'bb' | 'hb' | 'fb' | null) || null,
        validFrom: validFrom.toISOString().slice(0, 10),
        validTo: validTo.toISOString().slice(0, 10)
      },
      {
        onSuccess: () => {
          notifications.show({ message: 'Rate plan created.', color: 'green' })
          form.reset()
          onClose()
        },
        onError: (err: any) => {
          notifications.show({ 
            message: err.message || 'Failed to create rate plan', 
            color: 'red' 
          })
        }
      }
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Rate Plan" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Room Type"
            data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: rt.name }))}
            {...form.getInputProps('roomTypeId')}
            required
          />
          <TextInput 
            label="Name" 
            placeholder="August Discount" 
            {...form.getInputProps('name')} 
            required 
          />
          <NumberInput 
            label="Price override" 
            min={0} 
            decimalScale={2} 
            {...form.getInputProps('priceOverride')} 
            required 
          />
          <Select
            label="Meals included"
            description="Sent to the inventory system so the restaurant knows which meals are covered"
            placeholder="Room only"
            data={[{ value: 'bb', label: 'Bed & Breakfast' }, { value: 'hb', label: 'Half Board' }, { value: 'fb', label: 'Full Board' }]}
            clearable
            {...form.getInputProps('boardType')}
          />
          <Select
            label="Cancellation policy (optional)"
            placeholder="Fall back to property default"
            data={(policies ?? []).map((p) => ({ value: p.id, label: p.name }))}
            clearable
            {...form.getInputProps('cancellationPolicyId')}
          />
          <Group grow>
            <DateInput 
              label="Valid from" 
              {...form.getInputProps('validFrom')} 
              required 
              valueFormat="YYYY-MM-DD"
            />
            <DateInput 
              label="Valid to" 
              {...form.getInputProps('validTo')} 
              required 
              valueFormat="YYYY-MM-DD"
            />
          </Group>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="primary" 
              loading={createRatePlan.isPending}
            >
              Create Rate Plan
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}