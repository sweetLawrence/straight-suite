// // import {
// //   Modal,
// //   TextInput,
// //   Textarea,
// //   NumberInput,
// //   Select,
// //   Button,
// //   Group,
// //   Stack,
// //   SimpleGrid
// // } from '@mantine/core'
// // import { useForm } from '@mantine/form'
// // import { notifications } from '@mantine/notifications'
// // import { useEffect } from 'react'
// // import { BED_TYPES, type RoomType } from '../../types/roomType'
// // import { useCreateRoomType, useUpdateRoomType } from './hooks'

// // interface Props {
// //   opened: boolean
// //   onClose: () => void
// //   roomType: RoomType | null // null = create mode
// // }

// // export default function RoomTypeFormModal ({
// //   opened,
// //   onClose,
// //   roomType
// // }: Props) {
// //   const createRoomType = useCreateRoomType()
// //   const updateRoomType = useUpdateRoomType()
// //   const isEdit = !!roomType

// //   const form = useForm({
// //     initialValues: {
// //       slug: '',
// //       name: '',
// //       description: '',
// //       bedType: 'double',
// //       bedConfiguration: '',
// //       maxAdults: 2,
// //       maxChildren: 0,
// //       totalUnits: 1,
// //       basePrice: 0
// //     }
// //   })

// //   useEffect(() => {
// //     if (roomType) {
// //       form.setValues({
// //         slug: roomType.slug,
// //         name: roomType.name,
// //         description: roomType.description ?? '',
// //         bedType: roomType.bedType ?? 'double',
// //         bedConfiguration: roomType.bedConfiguration ?? '',
// //         maxAdults: roomType.maxAdults,
// //         maxChildren: roomType.maxChildren,
// //         totalUnits: roomType.totalUnits,
// //         basePrice: roomType.basePrice
// //       })
// //     } else {
// //       form.reset()
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [roomType, opened])

// //   function handleSubmit (values: typeof form.values) {
// //     const mutation = isEdit
// //       ? updateRoomType.mutateAsync({ id: roomType!.id, input: values })
// //       : createRoomType.mutateAsync(values)

// //     mutation
// //       .then(() => {
// //         notifications.show({
// //           message: `Room type ${isEdit ? 'updated' : 'created'}.`,
// //           color: 'green'
// //         })
// //         onClose()
// //       })
// //       .catch(err => notifications.show({ message: err.message, color: 'red' }))
// //   }

// //   return (
// //     <Modal
// //       opened={opened}
// //       onClose={onClose}
// //       title={isEdit ? 'Edit Room Type' : 'New Room Type'}
// //       size='md'
// //     >
// //       <form onSubmit={form.onSubmit(handleSubmit)}>
// //         <Stack>
// //           <SimpleGrid cols={2}>
// //             <TextInput
// //               label='Slug'
// //               placeholder='deluxe-room'
// //               {...form.getInputProps('slug')}
// //               required
// //             />
// //             <TextInput
// //               label='Name'
// //               placeholder='Deluxe Room'
// //               {...form.getInputProps('name')}
// //               required
// //             />
// //           </SimpleGrid>
// //           <Textarea
// //             label='Description'
// //             {...form.getInputProps('description')}
// //             minRows={2}
// //           />
// //           <SimpleGrid cols={3}>
// //             <Select
// //               label='Bed type'
// //               data={BED_TYPES}
// //               {...form.getInputProps('bedType')}
// //             />
// //             <TextInput
// //               label='Bed configuration (optional override)'
// //               placeholder='e.g. 1 Queen + 1 Single'
// //               description='Leave blank to just show the bed type above'
// //               {...form.getInputProps('bedConfiguration')}
// //             />

// //             <NumberInput
// //               label='Max adults'
// //               min={1}
// //               {...form.getInputProps('maxAdults')}
// //             />
// //             <NumberInput
// //               label='Max children'
// //               min={0}
// //               {...form.getInputProps('maxChildren')}
// //             />
// //           </SimpleGrid>
// //           <SimpleGrid cols={2}>
// //             <NumberInput
// //               label='Total units'
// //               min={1}
// //               {...form.getInputProps('totalUnits')}
// //             />
// //             <NumberInput
// //               label='Base price'
// //               min={0}
// //               decimalScale={2}
// //               {...form.getInputProps('basePrice')}
// //             />
// //           </SimpleGrid>
// //           <Group justify='flex-end' mt='sm'>
// //             <Button variant='default' onClick={onClose}>
// //               Cancel
// //             </Button>
// //             <Button
// //               type='submit'
// //               color='primary'
// //               loading={createRoomType.isPending || updateRoomType.isPending}
// //             >
// //               {isEdit ? 'Save Changes' : 'Create Room Type'}
// //             </Button>
// //           </Group>
// //         </Stack>
// //       </form>
// //     </Modal>
// //   )
// // }




















// import { Modal, TextInput, Textarea, NumberInput, Select, Button, Group, Stack, SimpleGrid, TagsInput } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useEffect } from 'react'
// import { BED_TYPES, type RoomType } from '../../types/roomType'
// import { useCreateRoomType, useUpdateRoomType } from './hooks'

// interface Props {
//   opened: boolean
//   onClose: () => void
//   roomType: RoomType | null
// }

// export default function RoomTypeFormModal({ opened, onClose, roomType }: Props) {
//   const createRoomType = useCreateRoomType()
//   const updateRoomType = useUpdateRoomType()
//   const isEdit = !!roomType

//   const form = useForm({
//     initialValues: {
//       slug: '', name: '', description: '', bedType: 'double', bedConfiguration: '',
//       maxAdults: 2, maxChildren: 0, totalUnits: 1, basePrice: 0,
//       tagline: '', amenities: [] as string[]
//     }
//   })

//   useEffect(() => {
//     if (roomType) {
//       const attributes = (roomType.attributes ?? {}) as { tagline?: string; amenities?: string[] }
//       form.setValues({
//         slug: roomType.slug,
//         name: roomType.name,
//         description: roomType.description ?? '',
//         bedType: roomType.bedType ?? 'double',
//         bedConfiguration: roomType.bedConfiguration ?? '',
//         maxAdults: roomType.maxAdults,
//         maxChildren: roomType.maxChildren,
//         totalUnits: roomType.totalUnits,
//         basePrice: roomType.basePrice,
//         tagline: attributes.tagline ?? '',
//         amenities: attributes.amenities ?? []
//       })
//     } else {
//       form.reset()
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [roomType, opened])

//   function handleSubmit(values: typeof form.values) {
//     const payload = {
//       slug: values.slug,
//       name: values.name,
//       description: values.description,
//       bedType: values.bedType,
//       bedConfiguration: values.bedConfiguration,
//       maxAdults: values.maxAdults,
//       maxChildren: values.maxChildren,
//       totalUnits: values.totalUnits,
//       basePrice: values.basePrice,
//       attributes: { tagline: values.tagline, amenities: values.amenities }
//     }

//     const mutation = isEdit
//       ? updateRoomType.mutateAsync({ id: roomType!.id, input: payload })
//       : createRoomType.mutateAsync(payload)

//     mutation
//       .then(() => {
//         notifications.show({ message: `Room type ${isEdit ? 'updated' : 'created'}.`, color: 'green' })
//         onClose()
//       })
//       .catch((err) => notifications.show({ message: err.message, color: 'red' }))
//   }

//   return (
//     <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit Room Type' : 'New Room Type'} size="md">
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <SimpleGrid cols={2}>
//             <TextInput label="Slug" placeholder="deluxe-room" {...form.getInputProps('slug')} required />
//             <TextInput label="Name" placeholder="Deluxe Room" {...form.getInputProps('name')} required />
//           </SimpleGrid>

//           <TextInput
//             label="Tagline"
//             placeholder="A quiet room opening straight onto the flower beds."
//             description="Short one-liner shown on the room card and detail page"
//             {...form.getInputProps('tagline')}
//           />

//           <Textarea label="Description" {...form.getInputProps('description')} minRows={3} />

//           <TagsInput
//             label="Amenities"
//             placeholder="Type an amenity and press Enter"
//             description="e.g. Garden View, Free Wi-Fi, Breakfast Included"
//             {...form.getInputProps('amenities')}
//           />

//           <SimpleGrid cols={3}>
//             <Select label="Bed type" data={BED_TYPES} {...form.getInputProps('bedType')} />
//             <NumberInput label="Max adults" min={1} {...form.getInputProps('maxAdults')} />
//             <NumberInput label="Max children" min={0} {...form.getInputProps('maxChildren')} />
//           </SimpleGrid>

//           <TextInput
//             label="Bed configuration (optional override)"
//             placeholder="e.g. 1 Queen + 1 Single"
//             description="Leave blank to just show the bed type above"
//             {...form.getInputProps('bedConfiguration')}
//           />

//           <SimpleGrid cols={2}>
//             <NumberInput label="Total units" min={1} {...form.getInputProps('totalUnits')} />
//             <NumberInput label="Base price" min={0} decimalScale={2} {...form.getInputProps('basePrice')} />
//           </SimpleGrid>

//           <Group justify="flex-end" mt="sm">
//             <Button variant="default" onClick={onClose}>Cancel</Button>
//             <Button type="submit" color="primary" loading={createRoomType.isPending || updateRoomType.isPending}>
//               {isEdit ? 'Save Changes' : 'Create Room Type'}
//             </Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }


















import { Modal, TextInput, Textarea, NumberInput, Select, Button, Group, Stack, SimpleGrid, TagsInput, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect } from 'react'
import { BED_TYPES, type RoomType } from '../../types/roomType'
import { useCreateRoomType, useUpdateRoomType } from './hooks'

interface Props {
  opened: boolean
  onClose: () => void
  roomType: RoomType | null
}

export default function RoomTypeFormModal({ opened, onClose, roomType }: Props) {
  const createRoomType = useCreateRoomType()
  const updateRoomType = useUpdateRoomType()
  const isEdit = !!roomType

  const form = useForm({
    initialValues: {
      name: '', description: '', bedType: 'double', bedConfiguration: '',
      maxAdults: 2, maxChildren: 0, totalUnits: 1, basePrice: 0,
      tagline: '', amenities: [] as string[]
    }
  })

  useEffect(() => {
    if (roomType) {
      const attributes = (roomType.attributes ?? {}) as { tagline?: string; amenities?: string[] }
      form.setValues({
        name: roomType.name,
        description: roomType.description ?? '',
        bedType: roomType.bedType ?? 'double',
        bedConfiguration: roomType.bedConfiguration ?? '',
        maxAdults: roomType.maxAdults,
        maxChildren: roomType.maxChildren,
        totalUnits: roomType.totalUnits,
        basePrice: roomType.basePrice,
        tagline: attributes.tagline ?? '',
        amenities: attributes.amenities ?? []
      })
    } else {
      form.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, opened])

  function handleSubmit(values: typeof form.values) {
    const payload = {
      name: values.name,
      description: values.description,
      bedType: values.bedType,
      bedConfiguration: values.bedConfiguration,
      maxAdults: values.maxAdults,
      maxChildren: values.maxChildren,
      totalUnits: values.totalUnits,
      basePrice: values.basePrice,
      attributes: { tagline: values.tagline, amenities: values.amenities }
    }

    const mutation = isEdit
      ? updateRoomType.mutateAsync({ id: roomType!.id, input: payload })
      : createRoomType.mutateAsync(payload)

    mutation
      .then(() => {
        notifications.show({ message: `Room type ${isEdit ? 'updated' : 'created'}.`, color: 'green' })
        onClose()
      })
      .catch((err) => notifications.show({ message: err.message, color: 'red' }))
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit Room Type' : 'New Room Type'} size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" placeholder="Deluxe Room" {...form.getInputProps('name')} required />

          {isEdit && roomType && (
            <Text size="xs" c="dimmed">
              Public URL slug: <code>{roomType.slug}</code> — set automatically from the name at creation, doesn't change on rename.
            </Text>
          )}

          <TextInput
            label="Tagline"
            placeholder="A quiet room opening straight onto the flower beds."
            description="Short one-liner shown on the room card and detail page"
            {...form.getInputProps('tagline')}
          />

          <Textarea label="Description" {...form.getInputProps('description')} minRows={3} />

          <TagsInput
            label="Amenities"
            placeholder="Type an amenity and press Enter"
            description="e.g. Garden View, Free Wi-Fi, Breakfast Included"
            {...form.getInputProps('amenities')}
          />

          <SimpleGrid cols={3}>
            <Select label="Bed type" data={BED_TYPES} {...form.getInputProps('bedType')} />
            <NumberInput label="Max adults" min={1} {...form.getInputProps('maxAdults')} />
            <NumberInput label="Max children" min={0} {...form.getInputProps('maxChildren')} />
          </SimpleGrid>

          <TextInput
            label="Bed configuration (optional override)"
            placeholder="e.g. 1 Queen + 1 Single"
            description="Leave blank to just show the bed type above"
            {...form.getInputProps('bedConfiguration')}
          />

          <SimpleGrid cols={2}>
            <NumberInput label="Total units" min={1} {...form.getInputProps('totalUnits')} />
            <NumberInput label="Base price" min={0} decimalScale={2} {...form.getInputProps('basePrice')} />
          </SimpleGrid>

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" loading={createRoomType.isPending || updateRoomType.isPending}>
              {isEdit ? 'Save Changes' : 'Create Room Type'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}