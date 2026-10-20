// import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
// import { DatePickerInput } from '@mantine/dates'
// import { notifications } from '@mantine/notifications'
// import { Info } from 'lucide-react'
// import { useNavigate } from '@tanstack/react-router'
// import { useState } from 'react'
// import dayjs from 'dayjs'
// import isoWeek from 'dayjs/plugin/isoWeek'
// dayjs.extend(isoWeek)

// interface Props {
//   opened: boolean
//   onClose: () => void
// }

// export function NewWeekModal ({ opened, onClose }: Props) {
//   const navigate = useNavigate()
//   const [date, setDate] = useState<string | null>(null)

//   const handleContinue = () => {
//     if (!date) {
//       notifications.show({
//         color: 'red',
//         title: 'Pick a date',
//         message: 'Select any day inside the week you want to plan.'
//       })
//       return
//     }
//     // Compute the Monday of the week containing the picked date
//     const picked = dayjs(date)
//     const monday = picked.startOf('isoWeek').format('YYYY-MM-DD')
//     onClose()
//     navigate({
//       to: '/staff-menu/$weekStart',
//       params: { weekStart: monday }
//     })
//   }

//   return (
//     <Modal opened={opened} onClose={onClose} title='Plan a new week' size='md'>
//       <Stack gap='md'>
//         <Alert icon={<Info size={16} />} color='blue' variant='light'>
//           <Text size='sm'>
//             Pick any day in the week you want to plan. The system will use the
//             Monday of that week.
//           </Text>
//         </Alert>

//         <DatePickerInput
//           label='Any day in the target week'
//           placeholder='Pick a date'
//           value={date}
//           onChange={setDate}
//           valueFormat='ddd, DD MMM YYYY'
//           size='md'
//         popoverProps={{
//   withinPortal: true,
//   zIndex: 2000,
//   position: 'right',   // or 'left-start'
//   shadow: 'md',
//   offset: 8,
// }}
//         />

//         <Group justify='flex-end' mt='sm'>
//           <Button variant='default' onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={handleContinue} disabled={!date}>
//             Continue
//           </Button>
//         </Group>
//       </Stack>
//     </Modal>
//   )
// }







import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { Info } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

interface Props {
  opened: boolean
  onClose: () => void
}

export function NewWeekModal ({ opened, onClose }: Props) {
  const navigate = useNavigate()
  const [date, setDate] = useState<string | null>(null)

  // md = 768px in Mantine. Below that → mobile auto-position.
  // At/above that → open to the right side.
  const isMobile = useMediaQuery('(max-width: 767px)')

  const handleContinue = () => {
    if (!date) {
      notifications.show({
        color: 'red',
        title: 'Pick a date',
        message: 'Select any day inside the week you want to plan.'
      })
      return
    }
    const picked = dayjs(date)
    const monday = picked.startOf('isoWeek').format('YYYY-MM-DD')
    onClose()
    navigate({
      to: '/staff-menu/$weekStart',
      params: { weekStart: monday }
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title='Plan a new week' size='md'>
      <Stack gap='md'>
        <Alert icon={<Info size={16} />} color='blue' variant='light'>
          <Text size='sm'>
            Pick any day in the week you want to plan. The system will use the
            Monday of that week.
          </Text>
        </Alert>

        <DatePickerInput
          label='Any day in the target week'
          placeholder='Pick a date'
          value={date}
          onChange={setDate}
          valueFormat='ddd, DD MMM YYYY'
          size='md'
          popoverProps={{
            withinPortal: true,
            zIndex: 2000,
            shadow: 'md',
            offset: 8,
            // Mobile: omit `position` → Floating UI auto-flips
            // Tablet & desktop: force it to the right side
            ...(isMobile ? {} : { position: 'right' })
          }}
        />

        <Group justify='flex-end' mt='sm'>
          <Button
            variant='default'
            onClick={onClose}
            radius='md'
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!date}
            radius='md'
          >
            Continue
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}