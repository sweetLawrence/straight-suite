import { useState } from 'react'
import { Title, Text, Button, Group, SimpleGrid, Card, Badge, Stack, Skeleton, Image, ActionIcon } from '@mantine/core'
import { Plus, ImageIcon, Pencil, Ban,RotateCcw } from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useRoomTypes, useDeactivateRoomType, useUpdateRoomType } from '../features/roomTypes/hooks'
import type { RoomType } from '../types/roomType'
import RoomTypeFormModal from '../features/roomTypes/RoomTypeFormModal'
import RoomTypeImagesModal from '../features/roomTypes/RoomTypeImagesModal'

export default function RoomTypesPage() {
  const { data: roomTypes, isLoading } = useRoomTypes()
  const deactivate = useDeactivateRoomType()
  const updateRoomType = useUpdateRoomType()
  const [formTarget, setFormTarget] = useState<RoomType | null | undefined>(undefined) // undefined = closed, null = create, RoomType = edit
  const [imagesTargetId, setImagesTargetId] = useState<string | null>(null)

  function handleDeactivate(rt: RoomType) {
    if (!confirm(`Deactivate "${rt.name}"? It will disappear from the public site.`)) return
    deactivate.mutate(rt.id, {
      onSuccess: () => notifications.show({ message: 'Room type deactivated.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  function handleReactivate(rt: RoomType) {
  updateRoomType.mutate(
    { id: rt.id, input: { isActive: true } },
    {
      onSuccess: () => notifications.show({ message: 'Room type reactivated.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    }
  )
}

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} className="text-primary-700">Room Types</Title>
          <Text size="sm" c="dimmed">Manage the rooms guests can book for this property.</Text>
        </div>
        <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setFormTarget(null)}>
          New Room Type
        </Button>
      </Group>

      {isLoading ? (
        <SimpleGrid cols={3}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={220} radius="md" />)}
        </SimpleGrid>
      ) : !roomTypes || roomTypes.length === 0 ? (
        <Text c="dimmed">No room types yet - create your first one.</Text>
      ) : (
        <SimpleGrid cols={3}>
          {roomTypes.map((rt) => {
            const cover = rt.images.find((i) => i.isCover) ?? rt.images[0]
            return (
              <Card key={rt.id} withBorder radius="md" padding={0} className="overflow-hidden">
                <Image src={cover?.url} h={130} fit="cover" fallbackSrc="https://placehold.co/400x260?text=No+Image" />
                <Stack p="sm" gap={6}>
                  <Group justify="space-between">
                    <Text fw={600}>{rt.name}</Text>
                    <Badge color={rt.isActive ? 'green' : 'gray'} variant="light">{rt.isActive ? 'active' : 'inactive'}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">{rt.bedType} · {rt.maxAdults} adults, {rt.maxChildren} children</Text>
                  <Text size="sm" fw={500} className="text-accent-700">{rt.basePrice} {rt.currency} / night</Text>
                  <Group gap="xs" mt="xs">
                    <ActionIcon variant="light" color="primary" onClick={() => setFormTarget(rt)} title="Edit">
                      <Pencil size={15} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="secondary" onClick={() => setImagesTargetId(rt.id)} title="Manage images">
                      <ImageIcon size={15} />
                    </ActionIcon>
                    {/* <ActionIcon variant="light" color="red" onClick={() => handleDeactivate(rt)} title="Deactivate">
                      <Ban size={15} />
                    </ActionIcon> */}

                    {rt.isActive ? (
  <ActionIcon variant="light" color="red" onClick={() => handleDeactivate(rt)} title="Deactivate">
    <Ban size={15} />
  </ActionIcon>
) : (
  <ActionIcon variant="light" color="green" onClick={() => handleReactivate(rt)} title="Reactivate">
    <RotateCcw size={15} />
  </ActionIcon>
)}

                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      <RoomTypeFormModal
        opened={formTarget !== undefined}
        onClose={() => setFormTarget(undefined)}
        roomType={formTarget ?? null}
      />
      <RoomTypeImagesModal roomTypeId={imagesTargetId} onClose={() => setImagesTargetId(null)} />
    </Stack>
  )
}