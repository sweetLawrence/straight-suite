import { createFileRoute } from '@tanstack/react-router'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Menu as MantineMenu,
  Text,
  Tooltip
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Pencil, Plus, Wine, ChefHat, MinusCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { useMenuItemsList } from '@/hooks/useMenu'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { CreateMenuItemModal } from '@/components/menu/CreateMenuItemModal'
import { EditMenuItemModal } from '@/components/menu/EditMenuItemModal'
import { MenuItem } from '@/lib/api/menu'
import { formatCurrency } from '@/lib/utils/format'
import { Can } from '@/components/Can'

export const Route = createFileRoute('/_app/menu/')({
  component: MenuPage
})

function MenuPage () {
  const auth = useAuth()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<MenuItem | null>(null)

  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false)
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const query = useMenuItemsList({ page, limit: 20 })
  const canManage = auth.hasPermission('menu.manage')

  const handleEdit = (item: MenuItem) => {
    setSelected(item)
    openEdit()
  }

  const columns: Column<MenuItem>[] = [
    {
      key: 'display_name',
      header: 'Name',
      render: r => (
        <Text fw={600} size='sm'>
          {r.display_name}
        </Text>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: r =>
        r.category ? (
          <Text size='sm' c='dimmed'>
            {r.category}
          </Text>
        ) : (
          <Text size='sm' c='dimmed'>
            -
          </Text>
        )
    },
    {
      key: 'station',
      header: 'Station',
      render: r =>
        r.station ? (
          <Badge
            variant='light'
            color={r.station === 'bar' ? 'grape' : 'blue'}
            leftSection={
              r.station === 'bar' ? <Wine size={11} /> : <ChefHat size={11} />
            }
            radius='sm'
            size='sm'
            styles={{ label: { textTransform: 'capitalize' } }}
          >
            {r.station}
          </Badge>
        ) : (
          <Text size='sm' c='dimmed'>
            -
          </Text>
        )
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: r => (
        <Text fw={600} size='sm' style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(r.price)}
        </Text>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: r => (
        <Badge
          color={r.status === 'active' ? 'green' : 'gray'}
          variant='dot'
          radius='sm'
          size='sm'
          styles={{ label: { textTransform: 'capitalize' } }}
        >
          {r.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 60,
      render: r =>
        canManage ? (
          <Tooltip label='Edit item' withArrow position='left'>
            <ActionIcon
              variant='subtle'
              color='gray'
              size='md'
              radius='md'
              onClick={() => handleEdit(r)}
              aria-label={`Edit ${r.display_name}`}
            >
              <Pencil size={15} />
            </ActionIcon>
          </Tooltip>
        ) : null
    }
  ]

  return (
    <>
      <PageHeader
        title='Menu'
        subtitle='Items available for sale'
        actions={
          canManage ? (
            <Can perm="menu.manage">
            <Button
              leftSection={<Plus size={16} />}
              onClick={openCreate}
              radius='md'
            >
              Create Menu Item
            </Button>
            </Can>
          ) : undefined
        }
      />

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load menu' : null}
        rowKey={r => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle='No menu items'
        emptyDescription='Create your first menu item to get started.'
      />

      <CreateMenuItemModal opened={createOpen} onClose={closeCreate} />
      <EditMenuItemModal
        opened={editOpen}
        onClose={closeEdit}
        menuItem={selected}
      />
    </>
  )
}
