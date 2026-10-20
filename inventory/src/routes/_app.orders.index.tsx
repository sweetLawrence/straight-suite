import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  UnstyledButton
} from '@mantine/core'
import { Plus, User, Hash, Clock, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { PageHeader } from '@/components/PageHeader'
import { DayGroupedList } from '@/components/DayGroupedList'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { Order } from '@/lib/api/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { getErrorMessage } from '@/lib/api/client'
import { ListToolbar, emptyToolbar, toolbarParams } from '@/components/ListToolbar'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending_approval', label: 'Needs approval' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'served', label: 'Served' },
  { value: 'billed', label: 'Billed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' }
]

// "09", "9" and "T00099" all show the same way: T9, T99
const tableLabel = (t?: string | null) => {
  if (!t) return '-'
  const raw = String(t).replace(/^T/i, '')
  return /^\d+$/.test(raw) ? `T${Number(raw)}` : String(t)
}

export const Route = createFileRoute('/_app/orders/')({
  component: OrdersPage
})

function orderTotal (order: Order): number {
  return (
    order.order_lines?.reduce((sum, l) => sum + parseFloat(l.line_total), 0) ??
    0
  )
}

function OrdersPage () {
  const auth = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyToolbar())
  const query = useOrders({ page, limit: 20, ...toolbarParams(filters) })
  const error = query.error ? getErrorMessage(query.error) : null
  // The bar only sees the bar lines of an order
  const barOnly = auth.hasRole('bar_attendant') && !auth.hasRole('manager', 'md', 'admin', 'waiter')

  const columns: Column<Order>[] = [
    {
      key: 'order_ref',
      header: 'Reference',
      render: r => (
        <Stack gap={2}>
          <Text
            component={Link}
            to={`/orders/${r.id}`}
            size='sm'
            fw={600}
            c='brand.7'
            style={{ textDecoration: 'none' }}
          >
            {r.order_ref}
          </Text>
          <Text size='xs' c='dimmed' ff='monospace'>
            #{r.id.slice(0, 8)}
          </Text>
        </Stack>
      )
    },
    {
      key: 'customer_code',
      header: 'Customer',
      render: r =>
        r.customer_code ? (
          <Text size='sm'>{r.customer_code}</Text>
        ) : (
          <Text size='sm' c='dimmed' fs='italic'>
            Walk-in
          </Text>
        )
    },
    {
      key: 'table',
      header: 'Table',
      width: 90,
      render: r =>
        r.table_number ? (
          <Badge variant='light' color='gray' radius='sm' size='md' styles={{ root: { maxWidth: 'none' }, label: { overflow: 'visible' } }}>
            {tableLabel(r.table_number)}
          </Badge>
        ) : (
          <Text size='sm' c='dimmed'>
            -
          </Text>
        )
    },
    {
      key: 'waiter',
      header: 'Waiter',
      render: r =>
        r.waiter?.full_name ? (
          <Text size='sm'>{r.waiter.full_name}</Text>
        ) : (
          <Text size='sm' c='dimmed'>
            Unassigned
          </Text>
        )
    },
    {
      key: 'lines',
      header: barOnly ? 'Bar lines' : 'Lines',
      align: 'right',
      width: 80,
      render: r => (
        <Text
          size='sm'
          c='dimmed'
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {r.order_lines?.length ?? 0}
        </Text>
      )
    },
    {
      key: 'total',
      header: barOnly ? 'Bar total' : 'Total',
      align: 'right',
      render: r => (
        <Text size='sm' fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(orderTotal(r))}
        </Text>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: r => (
        <Text size='sm' style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(r.created_at)}
        </Text>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: r => <StatBadge value={r.status} />
    },
    {
  key: 'outlet',
  header: 'Outlet',
  render: (r) => <StatBadge value={r.outlet || 'restaurant'} />,
  width: 110,
},  
  ]

  const orders = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <>
      <PageHeader
        title='Orders'
        subtitle={query.data?.meta ? `${query.data.meta.total} order${query.data.meta.total === 1 ? '' : 's'}` : 'All orders for your scope'}
        actions={
          auth.hasPermission('order.create') ? (
            <Button
              leftSection={<Plus size={16} />}
              component={Link}
              to='/orders/new'
              radius='md'
            >
              New Order
            </Button>
          ) : undefined
        }
      />

      <ListToolbar
        value={filters}
        onChange={v => {
          setFilters(v)
          setPage(1)
        }}
        placeholder='Search order ref or table'
        statusOptions={STATUS_OPTIONS}
      />

      {/* Mobile + tablet: card list. Desktop: table. */}
      <Box hiddenFrom='md'>
        <MobileOrderList
          orders={orders}
          loading={query.isLoading}
          error={error}
          meta={meta}
          onPageChange={setPage}
        />
      </Box>

      <Box visibleFrom='md'>
        <DataTable
          data={orders}
          columns={columns}
          loading={query.isLoading}
          error={error}
          onRetry={() => query.refetch()}
          rowKey={r => r.id}
          onRowClick={r => navigate({ to: '/orders/$id', params: { id: r.id } })}
          meta={meta}
          onPageChange={setPage}
          emptyTitle='No orders'
          emptyDescription='No orders have been created yet.'
        />
      </Box>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile order list - tap-friendly cards                            */
/* ------------------------------------------------------------------ */

type OrdersMeta = NonNullable<ReturnType<typeof useOrders>['data']>['meta']

function MobileOrderList ({
  orders,
  loading,
  error,
  meta,
  onPageChange
}: {
  orders: Order[]
  loading: boolean
  error: string | null
  meta?: OrdersMeta
  onPageChange: (p: number) => void
}) {
  if (loading) {
    return (
      <Stack gap='sm'>
        {[0, 1, 2, 3].map(i => (
          <Card key={i} withBorder radius='md' p='md'>
            <Group justify='space-between' mb='xs'>
              <Box
                style={{
                  width: 90,
                  height: 14,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 4
                }}
              />
              <Box
                style={{
                  width: 60,
                  height: 20,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 6
                }}
              />
            </Group>
            <Box
              style={{
                width: '60%',
                height: 12,
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 4,
                marginBottom: 10
              }}
            />
            <Box
              style={{
                width: '40%',
                height: 12,
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 4
              }}
            />
          </Card>
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Card withBorder radius='md' p='lg'>
        <Stack align='center' gap={4}>
          <Text fw={600} size='sm'>
            Couldn't load orders
          </Text>
          <Text size='xs' c='dimmed'>
            {error}
          </Text>
        </Stack>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card withBorder radius='md' p='xl'>
        <Stack align='center' gap={6}>
          <Text fw={600} size='sm'>
            No orders
          </Text>
          <Text size='xs' c='dimmed' ta='center'>
            No orders have been created yet.
          </Text>
        </Stack>
      </Card>
    )
  }

  const totalPages = meta?.pages ?? 1
  const currentPage = meta?.page ?? 1

  return (
    <>
      <DayGroupedList
        items={orders}
        getDate={o => o.created_at}
        keyOf={o => o.id}
        render={order => <OrderCard order={order} />}
      />

      {totalPages > 1 && (
        <Group justify='space-between' mt='md' px={4}>
          <Button
            variant='default'
            size='sm'
            radius='md'
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Text size='xs' c='dimmed'>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            variant='default'
            size='sm'
            radius='md'
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </Group>
      )}
    </>
  )
}

function OrderCard ({ order }: { order: Order }) {

  return (
    <UnstyledButton
      component={Link}
      to={`/orders/${order.id}`}
      style={{ display: 'block' }}
    >
      <Card
        withBorder
        radius='md'
        p='md'
        style={{ transition: 'border-color 120ms ease' }}
      >
        {/* Row 1: ref + status */}
        <Group justify='space-between' align='center' mb='xs' wrap='nowrap'>
          <Text size='sm' fw={700} truncate style={{ letterSpacing: '-0.01em', minWidth: 0 }}>
            {order.order_ref}
          </Text>
          <Box style={{ flexShrink: 0 }}>
            <StatBadge value={order.status} />
          </Box>
        </Group>

        {/* Row 2: customer + table */}
        <Group gap='lg' mb='xs' wrap='wrap'>
          <Group gap={6} wrap='nowrap'>
            <User size={13} color='var(--mantine-color-gray-6)' />
            <Text
              size='sm'
              c={order.customer_code ? undefined : 'dimmed'}
              fs={order.customer_code ? undefined : 'italic'}
            >
              {order.customer_code || 'Walk-in'}
            </Text>
          </Group>
          {order.table_number && (
            <Group gap={6} wrap='nowrap'>
              <Hash size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm'>{tableLabel(order.table_number)}</Text>
            </Group>
          )}
        </Group>

        <Divider my='xs' />

        {/* Row 3: total + time */}
        <Group justify='space-between' align='center' wrap='nowrap'>
          <Group gap={6} wrap='nowrap'>
            <Clock size={12} color='var(--mantine-color-gray-6)' />
            <Text size='xs' c='dimmed'>
              {formatDateTime(order.created_at)}
            </Text>
          </Group>
          <Group gap={6} wrap='nowrap'>
            <Text
              size='sm'
              fw={700}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(orderTotal(order))}
            </Text>
            <ChevronRight size={16} color='var(--mantine-color-gray-5)' />
          </Group>
        </Group>
      </Card>
    </UnstyledButton>
  )
}










































