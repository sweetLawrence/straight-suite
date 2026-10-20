import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge, Button, Group, Select, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Plus } from 'lucide-react'
import { useStockItems } from '@/hooks/useStock'
import { useAuth } from '@/lib/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { StockItemFormModal } from '@/components/stock/StockItemFormModal'
import { StockItem } from '@/lib/api/stock'
import { Can } from '@/components/Can'

export const Route = createFileRoute('/_app/stock/items')({
  component: StockItemsPage
})

function StockItemsPage () {
  const auth = useAuth()
  const [page, setPage] = useState(1)
  const [storeType, setStoreType] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<StockItem | null>(null)
  const [modalOpen, { open, close }] = useDisclosure(false)
  const query = useStockItems({
    page,
    limit: 20,
    store_type: storeType || undefined
  })

  const canManage =
    auth.hasPermission('stock.item.manage') ||
    auth.hasRole('manager', 'md', 'admin')

  const handleAdd = () => {
    setEditItem(null)
    open()
  }

  const handleEdit = (item: StockItem) => {
    setEditItem(item)
    open()
  }

  const columns: Column<StockItem>[] = [
    {
      key: 'code',
      header: 'Code',
      render: r => <Text fw={500}>{r.item?.code || '-'}</Text>,
      width: 160
    },
    {
      key: 'name',
      header: 'Item',
      render: r => (
        <Text
          c='blue'
          style={{ cursor: 'pointer' }}
          onClick={() => handleEdit(r)}
        >
          {r.item?.name || '-'}
        </Text>
      )
    },
    {
      key: 'stock_model',
      header: 'Model',
      render: r => <Badge variant='light'>{r.stock_model}</Badge>,
      width: 110
    },
    {
      key: 'store_type',
      header: 'Store',
      render: r => (
        <Badge variant='light' color='gray'>
          {r.store_type}
        </Badge>
      ),
      width: 130
    },
    {
      key: 'reorder_level',
      header: 'Reorder',
      align: 'right',
      render: r => r.reorder_level ?? '-',
      width: 90
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
        title='Stock Items'
        subtitle='What this property stocks - the link between the catalog and what you receive'
        actions={
          canManage ? (
            <Can perm="stock.item.manage">
            <Button leftSection={<Plus size={16} />} onClick={handleAdd}>
              Enable Item
            </Button>
            </Can>
          ) : undefined
        }
      />

      <Group mb='md'>
        <Select
          placeholder='All stores'
          clearable
          data={['food_store', 'bar_store', 'kitchen']}
          value={storeType}
          onChange={v => {
            setStoreType(v)
            setPage(1)
          }}
          w={200}
        />
      </Group>

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load stock items' : null}
        rowKey={r => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle='No stock items'
        emptyDescription='Enable items from the catalog so they can be received.'
      />

      <StockItemFormModal
        opened={modalOpen}
        onClose={close}
        stockItem={editItem}
      />
    </>
  )
}
