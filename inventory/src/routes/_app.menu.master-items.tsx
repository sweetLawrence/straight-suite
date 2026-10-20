import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge, Button, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Plus } from 'lucide-react'
import { useItems } from '@/hooks/useItems'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { MasterItemFormModal } from '@/components/menu/MasterItemFormModal'
import { MasterItem } from '@/lib/api/item'
import { Can } from '@/components/Can'

export const Route = createFileRoute('/_app/menu/master-items')({
  component: MasterItemsPage
})

function MasterItemsPage () {
  const [page, setPage] = useState(1)
  const [editItem, setEditItem] = useState<MasterItem | null>(null)
  const [modalOpen, { open, close }] = useDisclosure(false)
  const query = useItems({ page, limit: 20 })

  const handleAdd = () => {
    setEditItem(null)
    open()
  }

  const handleEdit = (item: MasterItem) => {
    setEditItem(item)
    open()
  }

  const columns: Column<MasterItem>[] = [
    {
      key: 'code',
      header: 'Code',
      render: r => <Text fw={500}>{r.code}</Text>,
      width: 140
    },
    {
      key: 'name',
      header: 'Name',
      render: r => (
        <Text
          c='blue'
          style={{ cursor: 'pointer' }}
          onClick={() => handleEdit(r)}
        >
          {r.name}
        </Text>
      )
    },
    {
      key: 'item_type',
      header: 'Type',
      render: r => <Badge variant='light'>{r.item_type}</Badge>
    },
    {
      key: 'base_unit',
      header: 'Unit',
      render: r => r.base_unit?.code || '-',
      width: 80
    },
    {
      key: 'status',
      header: 'Status',
      render: r => <StatBadge value={r.status} />,
      width: 100
    }
  ]

  return (
    <>
      <PageHeader
        title='Master Items'
        subtitle='The catalog of every ingredient, product, and menu item in the system'
        actions={
          <Can perm="item.manage">
          <Button leftSection={<Plus size={16} />} onClick={handleAdd}>
            Add Item
          </Button>
          </Can>
        }
      />

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load items' : null}
        rowKey={r => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle='No items'
        emptyDescription='Add your first master item.'
      />

      <MasterItemFormModal opened={modalOpen} onClose={close} item={editItem} />
    </>
  )
}
