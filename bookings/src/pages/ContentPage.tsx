import { useRef, useState } from 'react'
import {
  Title,
  Text,
  Tabs,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  ActionIcon,
  Select,
  Image
} from '@mantine/core'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Tag,
  PartyPopper,
  Images
} from 'lucide-react'
import { notifications } from '@mantine/notifications'
import {
  useOffers,
  useUpdateOffer,
  useDeleteOffer
} from '../features/offers/hooks'
import {
  useEventTypes,
  useDeleteEventType,
  useReorderEventTypes
} from '../features/eventTypes/hooks'
import {
  useGallery,
  useUploadGalleryImage,
  useDeleteGalleryItem,
  useReorderGallery
} from '../features/gallery/hooks'
import { GALLERY_CATEGORIES } from '../types/content'
import OfferFormModal from '../features/offers/OfferFormModal'
import EventTypeFormModal from '../features/eventTypes/EventTypeFormModal'

export default function ContentPage () {
  return (
    <Stack gap='lg'>
      <div>
        <Title order={2} className='text-primary-700'>
          Content
        </Title>
        <Text size='sm' c='dimmed'>
          Offers, event types, and gallery images shown on the public site.
        </Text>
      </div>
      <Tabs defaultValue='offers'>
        <Tabs.List>
          <Tabs.Tab value='offers' leftSection={<Tag size={14} />}>
            Offers
          </Tabs.Tab>
          <Tabs.Tab value='events' leftSection={<PartyPopper size={14} />}>
            Event Types
          </Tabs.Tab>
          <Tabs.Tab value='gallery' leftSection={<Images size={14} />}>
            Gallery
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value='offers' pt='md'>
          <OffersTab />
        </Tabs.Panel>
        <Tabs.Panel value='events' pt='md'>
          <EventTypesTab />
        </Tabs.Panel>
        <Tabs.Panel value='gallery' pt='md'>
          <GalleryTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

function OffersTab () {
  const { data: offers, isLoading } = useOffers()
  const updateOffer = useUpdateOffer()
  const deleteOffer = useDeleteOffer()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <Stack>
      <Group justify='flex-end'>
        <Button
          leftSection={<Plus size={16} />}
          color='accent'
          onClick={() => setFormOpen(true)}
        >
          New Offer
        </Button>
      </Group>
      {isLoading ? (
        <Text c='dimmed'>Loading...</Text>
      ) : !offers || offers.length === 0 ? (
        <Text c='dimmed'>No offers yet.</Text>
      ) : (
        <SimpleGrid cols={3}>
          {offers.map(o => (
            <Card key={o.id} withBorder radius='md' padding='sm'>
              <Group justify='space-between' mb={4}>
                <Text fw={600}>{o.title}</Text>
                <Badge color={o.isActive ? 'green' : 'gray'} variant='light'>
                  {o.isActive ? 'active' : 'inactive'}
                </Badge>
              </Group>
              <Text size='sm' c='dimmed' lineClamp={2}>
                {o.description}
              </Text>
              <Text size='sm' fw={500} className='text-accent-700' mt={4}>
                {o.discountType === 'percentage'
                  ? `${o.discountValue}% off`
                  : `${o.discountValue} off`}
              </Text>

              {o.code && <Text size="xs" c="dimmed" ff="monospace" mt={2}>Code: {o.code}</Text>}
              
              <Group gap='xs' mt='sm'>
                <Button
                  size='xs'
                  variant='light'
                  onClick={() =>
                    updateOffer.mutate(
                      { id: o.id, input: { isActive: !o.isActive } },
                      {
                        onError: (err: any) =>
                          notifications.show({
                            message: err.message,
                            color: 'red'
                          })
                      }
                    )
                  }
                >
                  {o.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <ActionIcon
                  color='red'
                  variant='light'
                  onClick={() => {
                    if (confirm(`Delete "${o.title}"?`))
                      deleteOffer.mutate(o.id)
                  }}
                >
                  <Trash2 size={15} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
      <OfferFormModal opened={formOpen} onClose={() => setFormOpen(false)} />
    </Stack>
  )
}

function EventTypesTab () {
  const { data: eventTypes, isLoading } = useEventTypes()
  const deleteEventType = useDeleteEventType()
  const reorder = useReorderEventTypes()
  const [formOpen, setFormOpen] = useState(false)

  function move (index: number, delta: number) {
    if (!eventTypes) return
    const otherIndex = index + delta
    if (otherIndex < 0 || otherIndex >= eventTypes.length) return
    reorder.mutate([
      { id: eventTypes[index].id, sortOrder: otherIndex },
      { id: eventTypes[otherIndex].id, sortOrder: index }
    ])
  }

  return (
    <Stack>
      <Group justify='flex-end'>
        <Button
          leftSection={<Plus size={16} />}
          color='accent'
          onClick={() => setFormOpen(true)}
        >
          New Event Type
        </Button>
      </Group>
      {isLoading ? (
        <Text c='dimmed'>Loading...</Text>
      ) : !eventTypes || eventTypes.length === 0 ? (
        <Text c='dimmed'>No event types yet.</Text>
      ) : (
        <Stack gap='xs'>
          {eventTypes.map((et, index) => (
            <Card key={et.id} withBorder radius='md' padding='sm'>
              <Group justify='space-between'>
                <div>
                  {/* <Text fw={600}>{et.title}</Text>
                  <Text size="sm" c="dimmed">{et.description}</Text> */}

                  <Group gap='sm'>
                    {et.imageUrl && (
                      <Image
                        src={et.imageUrl}
                        w={60}
                        h={44}
                        radius='sm'
                        fit='cover'
                      />
                    )}
                    <div>
                      <Text fw={600}>{et.title}</Text>
                      <Text size='sm' c='dimmed'>
                        {et.description}
                      </Text>
                    </div>
                  </Group>
                </div>
                <Group gap='xs'>
                  <ActionIcon
                    variant='light'
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={15} />
                  </ActionIcon>
                  <ActionIcon
                    variant='light'
                    disabled={index === eventTypes.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={15} />
                  </ActionIcon>
                  <ActionIcon
                    color='red'
                    variant='light'
                    onClick={() => {
                      if (confirm(`Deactivate "${et.title}"?`))
                        deleteEventType.mutate(et.id)
                    }}
                  >
                    <Trash2 size={15} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
      <EventTypeFormModal
        opened={formOpen}
        onClose={() => setFormOpen(false)}
        nextSortOrder={eventTypes?.length ?? 0}
      />
    </Stack>
  )
}

function GalleryTab () {
  const [category, setCategory] = useState('')
  const { data: items, isLoading } = useGallery(category || undefined)
  const uploadImage = useUploadGalleryImage()
  const deleteItem = useDeleteGalleryItem()
  const reorder = useReorderGallery()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingCategory, setPendingCategory] = useState('rooms')

  function handleFileChange (e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadImage.mutate(
      { file, category: pendingCategory },
      {
        onSuccess: () =>
          notifications.show({ message: 'Image uploaded.', color: 'green' }),
        onError: (err: any) =>
          notifications.show({ message: err.message, color: 'red' })
      }
    )
    e.target.value = ''
  }

  function move (index: number, delta: number) {
    if (!items) return
    const otherIndex = index + delta
    if (otherIndex < 0 || otherIndex >= items.length) return
    reorder.mutate([
      { id: items[index].id, sortOrder: otherIndex },
      { id: items[otherIndex].id, sortOrder: index }
    ])
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Select
          placeholder='Filter by category'
          data={GALLERY_CATEGORIES}
          value={category}
          onChange={v => setCategory(v ?? '')}
          clearable
          w={200}
        />
        <Group gap='xs'>
          <Select
            data={GALLERY_CATEGORIES}
            value={pendingCategory}
            onChange={v => v && setPendingCategory(v)}
            w={140}
          />
          <input
            type='file'
            ref={fileInputRef}
            accept='image/jpeg,image/png,image/webp'
            hidden
            onChange={handleFileChange}
          />
          <Button
            leftSection={<Upload size={16} />}
            color='accent'
            loading={uploadImage.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </Group>
      </Group>

      {isLoading ? (
        <Text c='dimmed'>Loading...</Text>
      ) : !items || items.length === 0 ? (
        <Text c='dimmed'>No images in this category yet.</Text>
      ) : (
        <SimpleGrid cols={4}>
          {items.map((item, index) => (
            <Card
              key={item.id}
              withBorder
              radius='md'
              padding={0}
              className='overflow-hidden'
            >
              <Image
                src={item.imageUrl}
                h={110}
                fit='cover'
                fallbackSrc='https://placehold.co/300x200?text=No+Image'
              />
              <Stack p={6} gap={4}>
                <Text size='xs' c='dimmed' lineClamp={1}>
                  {item.caption ?? item.category}
                </Text>
                <Group justify='space-between'>
                  <Group gap={2}>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={13} />
                    </ActionIcon>
                    <ActionIcon
                      size='sm'
                      variant='subtle'
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={13} />
                    </ActionIcon>
                  </Group>
                  <ActionIcon
                    size='sm'
                    color='red'
                    variant='subtle'
                    onClick={() => {
                      if (confirm('Delete this image?'))
                        deleteItem.mutate(item.id)
                    }}
                  >
                    <Trash2 size={13} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  )
}
