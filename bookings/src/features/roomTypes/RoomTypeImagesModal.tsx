import { useRef } from 'react'
import { Modal, SimpleGrid, Card, Image, Button, Text, Stack, Badge, ActionIcon, Group, Loader } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Upload, Star, Trash2 } from 'lucide-react'
import { useRoomType, useUploadRoomTypeImage, useSetRoomTypeImageCover, useDeleteRoomTypeImage } from './hooks'

interface Props {
  roomTypeId: string | null
  onClose: () => void
}

export default function RoomTypeImagesModal({ roomTypeId, onClose }: Props) {
  const { data: roomType, isLoading } = useRoomType(roomTypeId)
  const uploadImage = useUploadRoomTypeImage()
  const setCover = useSetRoomTypeImageCover()
  const deleteImage = useDeleteRoomTypeImage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !roomTypeId) return
    uploadImage.mutate(
      { roomTypeId, file },
      {
        onSuccess: () => notifications.show({ message: 'Image uploaded.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
    e.target.value = ''
  }

  return (
    <Modal opened={!!roomTypeId} onClose={onClose} title={roomType ? `Images - ${roomType.name}` : 'Images'} size="lg">
      {isLoading || !roomType ? (
        <Loader my="xl" mx="auto" display="block" />
      ) : (
        <Stack>
          <SimpleGrid cols={3}>
            {roomType.images.map((img) => (
              <Card key={img.id} withBorder padding={0} radius="md" className="overflow-hidden">
                <Image src={img.url} h={100} fit="cover" fallbackSrc="https://placehold.co/300x200?text=No+Image" />
                <Group justify="space-between" p={6}>
                  {img.isCover ? (
                    <Badge size="xs" color="accent">Cover</Badge>
                  ) : (
                    <ActionIcon
                      size="sm" variant="subtle" color="accent"
                      onClick={() => setCover.mutate({ roomTypeId: roomTypeId!, imageId: img.id })}
                      title="Set as cover"
                    >
                      <Star size={14} />
                    </ActionIcon>
                  )}
                  <ActionIcon
                    size="sm" variant="subtle" color="red"
                    onClick={() => deleteImage.mutate({ roomTypeId: roomTypeId!, imageId: img.id })}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          {roomType.images.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="md">No images yet - upload one below.</Text>
          )}

          <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
          <Button
            leftSection={<Upload size={16} />}
            variant="light" color="primary"
            loading={uploadImage.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
        </Stack>
      )}
    </Modal>
  )
}