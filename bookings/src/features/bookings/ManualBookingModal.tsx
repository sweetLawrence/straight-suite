// import { Modal, Select, TextInput, Button, Group, Stack } from '@mantine/core'
// import { DateInput } from '@mantine/dates'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useRoomTypeOptions } from '../roomTypes/hooks'
// import { useCreateManualBooking } from './hooks'

// interface Props {
//   opened: boolean
//   onClose: () => void
// }

// export default function ManualBookingModal({ opened, onClose }: Props) {
//   const { data: roomTypes } = useRoomTypeOptions()
//   const createBooking = useCreateManualBooking()

//   const form = useForm({
//     initialValues: {
//       roomTypeId: '',
//       checkInDate: null as Date | null,
//       checkOutDate: null as Date | null,
//       guestFirstName: '',
//       guestLastName: '',
//       guestEmail: '',
//       guestPhone: '',
//       paymentCollected: 'none' as 'none' | 'cash' | 'mpesa'
//     }
//   })

//   function handleSubmit(values: typeof form.values) {
//     // Convert string values to Date objects if they're strings
//     const checkInDate = values.checkInDate instanceof Date 
//       ? values.checkInDate 
//       : new Date(values.checkInDate as any)
    
//     const checkOutDate = values.checkOutDate instanceof Date 
//       ? values.checkOutDate 
//       : new Date(values.checkOutDate as any)
    
//     // Check if dates are valid
//     if (!checkInDate || !checkOutDate || isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
//       notifications.show({ 
//         message: 'Please select valid dates', 
//         color: 'red' 
//       })
//       return
//     }

//     createBooking.mutate(
//       {
//         roomTypeId: values.roomTypeId,
//         checkInDate: checkInDate.toISOString().slice(0, 10),
//         checkOutDate: checkOutDate.toISOString().slice(0, 10),
//         guestFirstName: values.guestFirstName,
//         guestLastName: values.guestLastName,
//         guestEmail: values.guestEmail,
//         guestPhone: values.guestPhone,
//         paymentCollected: values.paymentCollected
//       },
//       {
//         onSuccess: () => {
//           notifications.show({ message: 'Booking created.', color: 'green' })
//           form.reset()
//           onClose()
//         },
//         onError: (err: any) => {
//           notifications.show({ 
//             message: err.message || 'Failed to create booking', 
//             color: 'red' 
//           })
//         }
//       }
//     )
//   }

//   return (
//     <Modal opened={opened} onClose={onClose} title="New Walk-in / Manual Booking" size="md">
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <Select
//             label="Room Type"
//             data={(roomTypes ?? []).map((rt: any) => ({ value: rt.id, label: `${rt.name} (${rt.basePrice})` }))}
//             {...form.getInputProps('roomTypeId')}
//             required
//           />
//           <Group grow>
//             <DateInput 
//               label="Check-in" 
//               {...form.getInputProps('checkInDate')} 
//               required 
//               valueFormat="YYYY-MM-DD"
//             />
//             <DateInput 
//               label="Check-out" 
//               {...form.getInputProps('checkOutDate')} 
//               required 
//               valueFormat="YYYY-MM-DD"
//             />
//           </Group>
//           <Group grow>
//             <TextInput label="First name" {...form.getInputProps('guestFirstName')} required />
//             <TextInput label="Last name" {...form.getInputProps('guestLastName')} required />
//           </Group>
//           <TextInput label="Email" {...form.getInputProps('guestEmail')} required />
//           <TextInput label="Phone" {...form.getInputProps('guestPhone')} />
//           <Select
//             label="Payment collected"
//             data={[
//               { value: 'none', label: 'None yet' },
//               { value: 'cash', label: 'Cash' },
//               { value: 'mpesa', label: 'M-Pesa' }
//             ]}
//             {...form.getInputProps('paymentCollected')}
//           />
//           <Group justify="flex-end" mt="sm">
//             <Button variant="default" onClick={onClose}>Cancel</Button>
//             <Button type="submit" color="primary" loading={createBooking.isPending}>Create Booking</Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }




























// import { useState } from 'react'
// import { Modal, Select, TextInput, Button, Group, Stack, Text, Badge, Loader, Alert } from '@mantine/core'
// import { DateInput } from '@mantine/dates'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { CheckCircle2, XCircle } from 'lucide-react'
// import { useRoomTypeOptions } from '../roomTypes/hooks'
// import { useCreateManualBooking } from './hooks'
// import { useInitiateStkPush, usePaymentStatusPoll } from '../payments/hooks'

// interface Props {
//   opened: boolean
//   onClose: () => void
// }

// type Stage = 'form' | 'payment'

// export default function ManualBookingModal({ opened, onClose }: Props) {
//   const { data: roomTypes } = useRoomTypeOptions()
//   const createBooking = useCreateManualBooking()
//   const initiateStkPush = useInitiateStkPush()

//   const [stage, setStage] = useState<Stage>('form')
//   const [bookingCode, setBookingCode] = useState<string | null>(null)
//   const [phoneNumber, setPhoneNumber] = useState('')
//   const [amountType, setAmountType] = useState<'deposit' | 'balance' | 'full'>('deposit')
//   const [pushSent, setPushSent] = useState(false)
//   const [pushError, setPushError] = useState<string | null>(null)

//   const { data: paymentStatus } = usePaymentStatusPoll(bookingCode, pushSent)

//   const form = useForm({
//     initialValues: {
//       roomTypeId: '',
//       checkInDate: null as Date | null,
//       checkOutDate: null as Date | null,
//       guestFirstName: '',
//       guestLastName: '',
//       guestEmail: '',
//       guestPhone: '',
//       paymentCollected: 'none' as 'none' | 'cash' | 'mpesa' | 'mpesa_now'
//     }
//   })

//   function resetAndClose() {
//     form.reset()
//     setStage('form')
//     setBookingCode(null)
//     setPhoneNumber('')
//     setPushSent(false)
//     setPushError(null)
//     onClose()
//   }

//   function handleSubmit(values: typeof form.values) {
//     if (!values.checkInDate || !values.checkOutDate) return

//     const wantsMpesaNow = values.paymentCollected === 'mpesa_now'

//     createBooking.mutate(
//       {
//         roomTypeId: values.roomTypeId,
//         checkInDate: values.checkInDate.toISOString().slice(0, 10),
//         checkOutDate: values.checkOutDate.toISOString().slice(0, 10),
//         guestFirstName: values.guestFirstName,
//         guestLastName: values.guestLastName,
//         guestEmail: values.guestEmail,
//         guestPhone: values.guestPhone,
//         // 'mpesa_now' isn't a real backend value -- it means "don't mark as paid, we're about to push"
//         paymentCollected: wantsMpesaNow ? 'none' : values.paymentCollected
//       },
//       {
//         onSuccess: (booking) => {
//           if (wantsMpesaNow) {
//             setBookingCode(booking.bookingCode)
//             setPhoneNumber(values.guestPhone)
//             setStage('payment')
//           } else {
//             notifications.show({ message: 'Booking created.', color: 'green' })
//             resetAndClose()
//           }
//         },
//         onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//       }
//     )
//   }

//   function handleSendPush() {
//     if (!bookingCode || !phoneNumber) return
//     setPushError(null)
//     initiateStkPush.mutate(
//       { bookingCode, phoneNumber, amountType },
//       {
//         onSuccess: () => setPushSent(true),
//         onError: (err: any) => setPushError(err.message)
//       }
//     )
//   }

//   return (
//     <Modal opened={opened} onClose={resetAndClose} title="New Walk-in / Manual Booking" size="md" closeOnClickOutside={false}>
//       {stage === 'form' ? (
//         <form onSubmit={form.onSubmit(handleSubmit)}>
//           <Stack>
//             <Select
//               label="Room Type"
//               data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: `${rt.name} (${rt.basePrice})` }))}
//               {...form.getInputProps('roomTypeId')}
//               required
//             />
//             <Group grow>
//               <DateInput label="Check-in" {...form.getInputProps('checkInDate')} required />
//               <DateInput label="Check-out" {...form.getInputProps('checkOutDate')} required />
//             </Group>
//             <Group grow>
//               <TextInput label="First name" {...form.getInputProps('guestFirstName')} required />
//               <TextInput label="Last name" {...form.getInputProps('guestLastName')} required />
//             </Group>
//             <TextInput label="Email" {...form.getInputProps('guestEmail')} required />
//             <TextInput label="Phone" placeholder="0712345678" {...form.getInputProps('guestPhone')} required />
//             <Select
//               label="Payment"
//               data={[
//                 { value: 'none', label: 'Pending - collect later' },
//                 { value: 'cash', label: 'Cash collected now' },
//                 { value: 'mpesa', label: 'M-Pesa already collected (till/manual)' },
//                 { value: 'mpesa_now', label: 'Send M-Pesa prompt now' }
//               ]}
//               {...form.getInputProps('paymentCollected')}
//             />
//             <Group justify="flex-end" mt="sm">
//               <Button variant="default" onClick={resetAndClose}>Cancel</Button>
//               <Button type="submit" color="primary" loading={createBooking.isPending}>
//                 {form.values.paymentCollected === 'mpesa_now' ? 'Create & Continue to Payment' : 'Create Booking'}
//               </Button>
//             </Group>
//           </Stack>
//         </form>
//       ) : (
//         <Stack>
//           <Text size="sm" c="dimmed">Booking <b>{bookingCode}</b> created. Send a payment prompt to the guest's phone.</Text>

//           {!pushSent ? (
//             <>
//               <Select
//                 label="Amount to request"
//                 data={[
//                   { value: 'deposit', label: 'Deposit' },
//                   { value: 'balance', label: 'Balance' },
//                   { value: 'full', label: 'Full amount' }
//                 ]}
//                 value={amountType}
//                 onChange={(v) => v && setAmountType(v as typeof amountType)}
//               />
//               <TextInput label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.currentTarget.value)} />
//               {pushError && <Alert color="red">{pushError}</Alert>}
//               <Group justify="flex-end" mt="sm">
//                 <Button variant="default" onClick={resetAndClose}>Skip for now</Button>
//                 <Button color="primary" loading={initiateStkPush.isPending} onClick={handleSendPush}>
//                   Send M-Pesa Prompt
//                 </Button>
//               </Group>
//             </>
//           ) : (
//             <Stack align="center" py="md">
//               {!paymentStatus || paymentStatus.status === 'initiated' || paymentStatus.status === 'pending' ? (
//                 <>
//                   <Loader />
//                   <Text size="sm" c="dimmed">Waiting for the guest to complete payment on their phone...</Text>
//                 </>
//               ) : paymentStatus.status === 'completed' ? (
//                 <>
//                   <CheckCircle2 size={40} className="text-green-600" />
//                   <Text fw={600}>Payment received</Text>
//                   <Badge color="green">Receipt: {paymentStatus.mpesaReceiptNumber}</Badge>
//                   <Button color="primary" onClick={resetAndClose} mt="sm">Done</Button>
//                 </>
//               ) : (
//                 <>
//                   <XCircle size={40} className="text-red-600" />
//                   <Text fw={600}>Payment failed or was cancelled</Text>
//                   <Group>
//                     <Button variant="default" onClick={resetAndClose}>Close</Button>
//                     <Button color="primary" onClick={() => { setPushSent(false); setPushError(null) }}>Try Again</Button>
//                   </Group>
//                 </>
//               )}
//             </Stack>
//           )}
//         </Stack>
//       )}
//     </Modal>
//   )
// }





















































import { useState } from 'react'
import { Modal, NumberInput, Select, TextInput, Button, Group, Stack, Text, Badge, Loader, Alert } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useRoomTypeOptions } from '../roomTypes/hooks'
import { useRatePlans } from '../ratePlans/hooks'
import { useCreateManualBooking } from './hooks'
import { useInitiateStkPush, usePaymentStatusPoll } from '../payments/hooks'

interface Props {
  opened: boolean
  onClose: () => void
}

type Stage = 'form' | 'payment'
type PaymentChoice = 'none' | 'cash' | 'mpesa' | 'mpesa_now'

export default function ManualBookingModal({ opened, onClose }: Props) {
  const { data: roomTypes } = useRoomTypeOptions()
  const { data: ratePlans } = useRatePlans()
  const createBooking = useCreateManualBooking()
  const initiateStkPush = useInitiateStkPush()

  const [stage, setStage] = useState<Stage>('form')
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amountType, setAmountType] = useState<'deposit' | 'balance' | 'full'>('deposit')
  const [pushSent, setPushSent] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  const { data: paymentStatus } = usePaymentStatusPoll(bookingCode, pushSent)

  const form = useForm({
    initialValues: {
      roomTypeId: '',
      ratePlanId: '' as string | null,
      checkInDate: '' as string | null,
      checkOutDate: '' as string | null,
      guestFirstName: '',
      guestLastName: '',
      guestEmail: '',
      guestPhone: '',
      numAdults: 1,
      numChildren: 0,
      numChildrenUnder4: 0,
      paymentCollected: 'none' as PaymentChoice
    }
  })

  // Meal plans (rate plans) of the chosen room type that cover the chosen dates
  const day = (v: unknown) => String(v ?? '').slice(0, 10)
  const planOptions = (ratePlans ?? [])
    .filter(
      (p) =>
        p.roomTypeId === form.values.roomTypeId &&
        p.isActive &&
        (!form.values.checkInDate || day(p.validFrom) <= day(form.values.checkInDate)) &&
        (!form.values.checkOutDate || day(p.validTo) >= day(form.values.checkOutDate))
    )
    .map((p) => ({ value: p.id, label: `${p.name} (${p.priceOverride} per room per night)` }))

  function resetAndClose() {
    form.reset()
    setStage('form')
    setBookingCode(null)
    setPhoneNumber('')
    setPushSent(false)
    setPushError(null)
    onClose()
  }

  function handleSubmit(values: typeof form.values) {
    if (!values.checkInDate || !values.checkOutDate) return

    const wantsMpesaNow = values.paymentCollected === 'mpesa_now'
    const backendPaymentValue: 'none' | 'cash' | 'mpesa' = wantsMpesaNow
      ? 'none'
      : (values.paymentCollected as 'none' | 'cash' | 'mpesa')

    createBooking.mutate(
      {
        roomTypeId: values.roomTypeId,
        ratePlanId: values.ratePlanId || null,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        guestFirstName: values.guestFirstName,
        guestLastName: values.guestLastName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone,
        numAdults: Number(values.numAdults) || 1,
        numChildren: Number(values.numChildren) || 0,
        numChildrenUnder4: Number(values.numChildrenUnder4) || 0,
        paymentCollected: backendPaymentValue
      },
      {
        onSuccess: (booking) => {
          if (wantsMpesaNow) {
            setBookingCode(booking.bookingCode)
            setPhoneNumber(values.guestPhone)
            setStage('payment')
          } else {
            notifications.show({ message: 'Booking created.', color: 'green' })
            resetAndClose()
          }
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function handleSendPush() {
    if (!bookingCode || !phoneNumber) return
    setPushError(null)
    initiateStkPush.mutate(
      { bookingCode, phoneNumber, amountType },
      {
        onSuccess: () => setPushSent(true),
        onError: (err: any) => setPushError(err.message)
      }
    )
  }

  return (
    <Modal opened={opened} onClose={resetAndClose} title="New Walk-in / Manual Booking" size="md" closeOnClickOutside={false}>
      {stage === 'form' ? (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Room Type"
              data={(roomTypes ?? []).map((rt) => ({ value: rt.id, label: `${rt.name} (${rt.basePrice})` }))}
              {...form.getInputProps('roomTypeId')}
              required
            />
            <Select
              label="Meal plan"
              description="Leave empty for Bed & Breakfast"
              placeholder="Bed & Breakfast"
              data={planOptions}
              clearable
              {...form.getInputProps('ratePlanId')}
            />
            <Group grow>
              <DateInput label="Check-in" {...form.getInputProps('checkInDate')} required />
              <DateInput label="Check-out" {...form.getInputProps('checkOutDate')} required />
            </Group>
            <Group grow>
              <TextInput label="First name" {...form.getInputProps('guestFirstName')} required />
              <TextInput label="Last name" {...form.getInputProps('guestLastName')} required />
            </Group>
            <TextInput label="Email" {...form.getInputProps('guestEmail')} required />
            <TextInput label="Phone" placeholder="0712345678" {...form.getInputProps('guestPhone')} required />
            <Group grow>
              <NumberInput label="Adults" min={1} {...form.getInputProps('numAdults')} />
              <NumberInput label="Children 4 to 12" min={0} {...form.getInputProps('numChildren')} />
              <NumberInput label="Children 3 and under" min={0} {...form.getInputProps('numChildrenUnder4')} />
            </Group>
            <Select
              label="Payment"
              data={[
                { value: 'none', label: 'Pending - collect later' },
                { value: 'cash', label: 'Cash collected now' },
                { value: 'mpesa', label: 'M-Pesa already collected (till/manual)' },
                { value: 'mpesa_now', label: 'Send M-Pesa prompt now' }
              ]}
              {...form.getInputProps('paymentCollected')}
            />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={resetAndClose}>Cancel</Button>
              <Button type="submit" color="primary" loading={createBooking.isPending}>
                {form.values.paymentCollected === 'mpesa_now' ? 'Create & Continue to Payment' : 'Create Booking'}
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Stack>
          <Text size="sm" c="dimmed">Booking <b>{bookingCode}</b> created. Send a payment prompt to the guest's phone.</Text>

          {!pushSent ? (
            <>
              <Select
                label="Amount to request"
                data={[
                  { value: 'deposit', label: 'Deposit' },
                  { value: 'balance', label: 'Balance' },
                  { value: 'full', label: 'Full amount' }
                ]}
                value={amountType}
                onChange={(v) => v && setAmountType(v as typeof amountType)}
              />
              <TextInput label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.currentTarget.value)} />
              {pushError && <Alert color="red">{pushError}</Alert>}
              <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={resetAndClose}>Skip for now</Button>
                <Button color="primary" loading={initiateStkPush.isPending} onClick={handleSendPush}>
                  Send M-Pesa Prompt
                </Button>
              </Group>
            </>
          ) : (
            <Stack align="center" py="md">
              {!paymentStatus || paymentStatus.status === 'initiated' || paymentStatus.status === 'pending' ? (
                <>
                  <Loader />
                  <Text size="sm" c="dimmed">Waiting for the guest to complete payment on their phone...</Text>
                </>
              ) : paymentStatus.status === 'completed' ? (
                <>
                  <CheckCircle2 size={40} className="text-green-600" />
                  <Text fw={600}>Payment received</Text>
                  <Badge color="green">Receipt: {paymentStatus.mpesaReceiptNumber}</Badge>
                  <Button color="primary" onClick={resetAndClose} mt="sm">Done</Button>
                </>
              ) : (
                <>
                  <XCircle size={40} className="text-red-600" />
                  <Text fw={600}>Payment failed or was cancelled</Text>
                  <Group>
                    <Button variant="default" onClick={resetAndClose}>Close</Button>
                    <Button color="primary" onClick={() => { setPushSent(false); setPushError(null) }}>Try Again</Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  )
}