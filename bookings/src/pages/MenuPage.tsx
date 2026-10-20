import { useState } from 'react'
import { Title, Text, Button, Group, Stack, Card, TextInput, ActionIcon, Badge, Modal } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Plus, ArrowUp, ArrowDown, Trash2, Utensils,Eye, EyeOff } from 'lucide-react'
import {
  useMenuCategories, useCreateCategory, useUpdateCategory, useReorderCategories,
  useUpdateItem, useReorderItems, usePermanentlyDeleteCategory, usePermanentlyDeleteItem
} from '../features/menu/hooks'
import MenuItemFormModal from '../features/menu/MenuItemFormModal'

export default function MenuPage() {
  const { data: categories, isLoading } = useMenuCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const reorderCategories = useReorderCategories()
  const updateItem = useUpdateItem()
  const reorderItems = useReorderItems()
  const permanentlyDeleteCategory = usePermanentlyDeleteCategory()
  const permanentlyDeleteItem = usePermanentlyDeleteItem()

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [itemModalCategoryId, setItemModalCategoryId] = useState<string | null>(null)

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    createCategory.mutate(
      { name: newCategoryName, sortOrder: categories?.length ?? 0 },
      {
        onSuccess: () => {
          notifications.show({ message: 'Category added.', color: 'green' })
          setNewCategoryName('')
          setCategoryModalOpen(false)
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function moveCategory(index: number, delta: number) {
    if (!categories) return
    const otherIndex = index + delta
    if (otherIndex < 0 || otherIndex >= categories.length) return
    reorderCategories.mutate([
      { id: categories[index].id, sortOrder: otherIndex },
      { id: categories[otherIndex].id, sortOrder: index }
    ])
  }

  function moveItem(categoryId: string, items: NonNullable<typeof categories>[number]['items'], index: number, delta: number) {
    const otherIndex = index + delta
    if (otherIndex < 0 || otherIndex >= items.length) return
    reorderItems.mutate({
      categoryId,
      items: [
        { id: items[index].id, sortOrder: otherIndex },
        { id: items[otherIndex].id, sortOrder: index }
      ]
    })
  }

  function toggleCategoryActive(id: string, currentlyActive: boolean) {
    updateCategory.mutate(
      { id, input: { isActive: !currentlyActive } },
      { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) }
    )
  }

  function toggleItemActive(categoryId: string, itemId: string, currentlyActive: boolean) {
    updateItem.mutate(
      { categoryId, itemId, input: { isActive: !currentlyActive } },
      { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) }
    )
  }

  function handlePermanentDeleteCategory(id: string, name: string, itemCount: number) {
    const warning = itemCount > 0
      ? `Permanently delete "${name}" AND its ${itemCount} item(s)? This cannot be undone.`
      : `Permanently delete "${name}"? This cannot be undone.`
    if (!confirm(warning)) return
    permanentlyDeleteCategory.mutate(id, {
      onSuccess: () => notifications.show({ message: 'Category permanently deleted.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  function handlePermanentDeleteItem(categoryId: string, itemId: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    permanentlyDeleteItem.mutate(
      { categoryId, itemId },
      {
        onSuccess: () => notifications.show({ message: 'Item permanently deleted.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} className="text-primary-700 dark:text-primary-200">Restaurant Menu</Title>
          <Text size="sm" c="dimmed">Categories and dishes shown on the public Restaurant page.</Text>
        </div>
        <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setCategoryModalOpen(true)}>
          New Category
        </Button>
      </Group>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !categories || categories.length === 0 ? (
        <Text c="dimmed">No menu categories yet - add your first one.</Text>
      ) : (
        <Stack gap="md">
          {categories.map((cat, catIndex) => (
            <Card key={cat.id} withBorder radius="md" p="md">
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <Utensils size={16} className="text-primary-600" />
                  <Text fw={700} size="lg">{cat.name}</Text>
                  {!cat.isActive && <Badge color="gray" variant="light">inactive</Badge>}
                </Group>
                <Group gap="xs">
                  <ActionIcon variant="light" disabled={catIndex === 0} onClick={() => moveCategory(catIndex, -1)}>
                    <ArrowUp size={15} />
                  </ActionIcon>
                  <ActionIcon variant="light" disabled={catIndex === categories.length - 1} onClick={() => moveCategory(catIndex, 1)}>
                    <ArrowDown size={15} />
                  </ActionIcon>
                  <ActionIcon 
                    size="sm"
                    variant="light" 
                    color={cat.isActive ? "orange" : "green"}
                    onClick={() => toggleCategoryActive(cat.id, cat.isActive)}
                    title={cat.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {cat.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                  </ActionIcon>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => handlePermanentDeleteCategory(cat.id, cat.name, cat.items.length)}
                    loading={permanentlyDeleteCategory.isPending}
                  >
                    Delete Permanently
                  </Button>
                  <Button size="xs" variant="light" color="accent" onClick={() => setItemModalCategoryId(cat.id)}>
                    + Item
                  </Button>
                </Group>
              </Group>

              {cat.items.length === 0 ? (
                <Text size="sm" c="dimmed" pl="xl">No items in this category yet.</Text>
              ) : (
                <Stack gap={6} pl="xl">
                  {cat.items.map((item, itemIndex) => (
                    <Group key={item.id} justify="space-between" className="border-b border-surface-100 pb-2">
                      <div>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>{item.name}</Text>
                          {!item.isActive && <Badge size="xs" color="gray" variant="light">inactive</Badge>}
                        </Group>
                        <Text size="xs" c="dimmed">{item.description}</Text>
                      </div>
                      <Group gap="xs">
                        <Text size="sm" fw={600} className="font-mono text-primary-700">KSh {item.price.toLocaleString()}</Text>
                        <ActionIcon size="sm" variant="subtle" disabled={itemIndex === 0} onClick={() => moveItem(cat.id, cat.items, itemIndex, -1)}>
                          <ArrowUp size={13} />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="subtle" disabled={itemIndex === cat.items.length - 1} onClick={() => moveItem(cat.id, cat.items, itemIndex, 1)}>
                          <ArrowDown size={13} />
                        </ActionIcon>
                        <ActionIcon 
                          size="sm" 
                          color={item.isActive ? "orange" : "green"}
                          variant="subtle" 
                          onClick={() => toggleItemActive(cat.id, item.id, item.isActive)} 
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {item.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="subtle"
                          onClick={() => handlePermanentDeleteItem(cat.id, item.id, item.name)}
                          title="Delete permanently"
                          loading={permanentlyDeleteItem.isPending}
                        >
                          <Trash2 size={13} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              )}
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="New Menu Category">
        <Stack>
          <TextInput label="Category name" placeholder="Mains" value={newCategoryName} onChange={(e) => setNewCategoryName(e.currentTarget.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button color="primary" loading={createCategory.isPending} onClick={handleCreateCategory}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      <MenuItemFormModal
        opened={!!itemModalCategoryId}
        onClose={() => setItemModalCategoryId(null)}
        categoryId={itemModalCategoryId}
        nextSortOrder={categories?.find((c) => c.id === itemModalCategoryId)?.items.length ?? 0}
      />
    </Stack>
  )
}