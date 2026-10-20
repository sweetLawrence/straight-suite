import { createFileRoute } from '@tanstack/react-router'
import { ActionIcon, Badge, Button, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { usePortionDefinitionsList } from '@/hooks/useMenu'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { CreatePortionDefinitionModal } from '@/components/menu/CreatePortionDefinitionModal'
import { EditPortionDefinitionModal } from '@/components/menu/EditPortionDefinitionModal'
import { PortionDefinition } from '@/lib/api/menu'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Can } from '@/components/Can'

export const Route = createFileRoute('/_app/portion-definitions/')({
  component: PortionDefinitionsPage
})

function PortionDefinitionsPage () {
  const auth = useAuth()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PortionDefinition | null>(null)

  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false)
  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const query = usePortionDefinitionsList({ page, limit: 20 })
  const canManage = auth.hasPermission('menu.manage')

  const handleEdit = (item: PortionDefinition) => {
    setSelected(item)
    openEdit()
  }

  const columns: Column<PortionDefinition>[] = [
    {
      key: 'portion_name',
      header: 'Portion Name',
      render: r => (
        <Text fw={600} size='sm'>
          {r.portion_name}
        </Text>
      )
    },
    {
      key: 'portion_size',
      header: 'Size',
      align: 'right',
      render: r => (
        <Text
          size='sm'
          c='dimmed'
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatNumber(r.portion_size, 3)}
        </Text>
      )
    },
    {
      key: 'sell_price',
      header: 'Sell Price',
      align: 'right',
      render: r => (
        <Text fw={600} size='sm' style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(r.sell_price)}
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
          <Tooltip label='Edit portion' withArrow position='left'>
            <ActionIcon
              variant='subtle'
              color='gray'
              size='md'
              radius='md'
              onClick={() => handleEdit(r)}
              aria-label={`Edit ${r.portion_name}`}
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
        title='Portion Definitions'
        subtitle='Standard sizes and prices for portioned stock'
        actions={
          canManage ? (
            <Can perm="menu.manage">
            <Button
              leftSection={<Plus size={16} />}
              onClick={openCreate}
              radius='md'
            >
              Create Portion
            </Button>
            </Can>
          ) : undefined
        }
      />

      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load portion definitions' : null}
        rowKey={r => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle='No portion definitions'
        emptyDescription='Create portion definitions to standardize servings.'
      />

      <CreatePortionDefinitionModal opened={createOpen} onClose={closeCreate} />
      <EditPortionDefinitionModal
        opened={editOpen}
        onClose={closeEdit}
        portionDefinition={selected}
      />
    </>
  )
}
