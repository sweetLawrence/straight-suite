

// import { Modal, TextInput, Textarea, Button, Group, Stack } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useCreateEventType } from './hooks'

// interface Props {
//   opened: boolean
//   onClose: () => void
//   nextSortOrder: number
// }

// export default function EventTypeFormModal({ opened, onClose, nextSortOrder }: Props) {
//   const createEventType = useCreateEventType()
//   const form = useForm({ initialValues: { title: '', description: '', icon: '', capacity: '', slug: '' } })

//   function handleSubmit(values: typeof form.values) {
//     createEventType.mutate(
//       { ...values, sortOrder: nextSortOrder },
//       {
//         onSuccess: () => {
//           notifications.show({ message: 'Event type created.', color: 'green' })
//           form.reset()
//           onClose()
//         },
//         onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//       }
//     )
//   }

//   return (
//     <Modal opened={opened} onClose={onClose} title="New Event Type">
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <TextInput label="Title" placeholder="Corporate Board Meetings" {...form.getInputProps('title')} required />
//           <Textarea label="Description" {...form.getInputProps('description')} minRows={2} />
//           <TextInput label="Capacity" placeholder="Up to 300 guests" {...form.getInputProps('capacity')} />
//           <TextInput
//             label="URL slug (optional)"
//             placeholder="auto-generated from title if left blank"
//             {...form.getInputProps('slug')}
//           />
//           <TextInput label="Icon keyword (optional)" placeholder="briefcase" {...form.getInputProps('icon')} />
//           <Group justify="flex-end" mt="sm">
//             <Button variant="default" onClick={onClose}>Cancel</Button>
//             <Button type="submit" color="primary" loading={createEventType.isPending}>Create</Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }



































import { useRef, useState } from 'react'
import { Modal, TextInput, Textarea, Button, Group, Stack, Image, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Upload } from 'lucide-react'
import { useCreateEventType, useUploadEventTypeImage } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
  nextSortOrder: number
}

export default function EventTypeFormModal({ opened, onClose, nextSortOrder }: Props) {
  const createEventType = useCreateEventType()
  const uploadImage = useUploadEventTypeImage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const form = useForm({
    initialValues: { title: '', description: '', icon: '', capacity: '', slug: '', imageUrl: '' }
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadImage.mutate(file, {
      onSuccess: (uploaded) => {
        form.setFieldValue('imageUrl', uploaded.url)
        setPreviewUrl(uploaded.url)
      },
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
    e.target.value = ''
  }

  function handleSubmit(values: typeof form.values) {
    createEventType.mutate(
      { ...values, sortOrder: nextSortOrder },
      {
        onSuccess: () => {
          notifications.show({ message: 'Event type created.', color: 'green' })
          form.reset()
          setPreviewUrl(null)
          onClose()
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New Event Type">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Title" placeholder="Corporate Board Meetings" {...form.getInputProps('title')} required />
          <Textarea label="Description" {...form.getInputProps('description')} minRows={2} />
          <TextInput label="Capacity" placeholder="Up to 300 guests" {...form.getInputProps('capacity')} />
          <TextInput label="URL slug (optional)" placeholder="auto-generated from title if left blank" {...form.getInputProps('slug')} />
          <TextInput label="Icon keyword (optional)" placeholder="briefcase" {...form.getInputProps('icon')} />

          <div>
            <Text size="sm" fw={500} mb={4}>Cover image</Text>
            {previewUrl && <Image src={previewUrl} h={120} radius="md" mb="xs" fit="cover" />}
            <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
            <Button
              variant="light" size="xs" leftSection={<Upload size={14} />}
              loading={uploadImage.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.values.imageUrl ? 'Replace Image' : 'Upload Image'}
            </Button>
          </div>

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createEventType.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}