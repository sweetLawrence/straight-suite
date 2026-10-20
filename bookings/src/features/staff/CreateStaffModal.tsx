// import { Modal, TextInput, Select, Button, Group, Stack, Text, Code } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useState } from 'react'
// import { useCreateStaff } from './hooks'
// // import { PROPERTIES } from './PROPERTIES'
// import { PROPERTIES } from '../../constants/properties'

// interface Props {
//   opened: boolean
//   onClose: () => void
// }

// export default function CreateStaffModal({ opened, onClose }: Props) {
//   const createStaff = useCreateStaff()
//   const [tempPassword, setTempPassword] = useState<string | null>(null)

//   const form = useForm({
//     initialValues: { email: '', firstName: '', lastName: '', role: 'staff' as 'staff' | 'admin', propertyId: '' }
//   })

//   function handleSubmit(values: typeof form.values) {
//     createStaff.mutate(values, {
//       onSuccess: (result) => setTempPassword(result.tempPassword),
//       onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//     })
//   }

//   function handleClose() {
//     setTempPassword(null)
//     form.reset()
//     onClose()
//   }

//   if (tempPassword) {
//     return (
//       <Modal opened={opened} onClose={handleClose} title="Account Created">
//         <Stack>
//           <Text size="sm">Temporary password (shown once - relay this to the new staff member):</Text>
//           <Code block>{tempPassword}</Code>
//           <Group justify="flex-end">
//             <Button onClick={handleClose}>Done</Button>
//           </Group>
//         </Stack>
//       </Modal>
//     )
//   }

//   return (
//     <Modal opened={opened} onClose={handleClose} title="New Staff/Admin Account">
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <TextInput label="Email" {...form.getInputProps('email')} required />
//           <Group grow>
//             <TextInput label="First name" {...form.getInputProps('firstName')} required />
//             <TextInput label="Last name" {...form.getInputProps('lastName')} required />
//           </Group>
//           <Select label="Role" data={['staff', 'admin']} {...form.getInputProps('role')} />
//           <Select label="Property" data={PROPERTIES} {...form.getInputProps('propertyId')} required />
//           <Group justify="flex-end" mt="sm">
//             <Button variant="default" onClick={handleClose}>Cancel</Button>
//             <Button type="submit" color="primary" loading={createStaff.isPending}>Create</Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }














import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateStaff } from './hooks'
import { PROPERTIES } from '../../constants/properties'

interface Props {
  opened: boolean
  onClose: () => void
}

export default function CreateStaffModal({ opened, onClose }: Props) {
  const createStaff = useCreateStaff()

  const form = useForm({
    initialValues: { email: '', firstName: '', lastName: '', role: 'staff' as 'staff' | 'admin', propertyId: '' }
  })

  function handleSubmit(values: typeof form.values) {
    createStaff.mutate(values, {
      onSuccess: () => {
        notifications.show({ message: 'Account created - an invite email has been sent.', color: 'green' })
        form.reset()
        onClose()
      },
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Staff/Admin Account">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Email" {...form.getInputProps('email')} required />
          <Group grow>
            <TextInput label="First name" {...form.getInputProps('firstName')} required />
            <TextInput label="Last name" {...form.getInputProps('lastName')} required />
          </Group>
          <Select label="Role" data={['staff', 'admin']} {...form.getInputProps('role')} />
          <Select label="Property" data={PROPERTIES} {...form.getInputProps('propertyId')} required />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createStaff.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
} 