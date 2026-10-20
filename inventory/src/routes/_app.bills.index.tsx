import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton
} from '@mantine/core'
import { Banknote, ChevronRight, Clock, Hash, Printer, User } from 'lucide-react'
import { useState } from 'react'
import { useBills } from '@/hooks/useOrders'
import { PageHeader } from '@/components/PageHeader'
import { DayGroupedList } from '@/components/DayGroupedList'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { BillStatusBadge } from '@/components/orders/BillStatusBadge'
import { ListToolbar, emptyToolbar, toolbarParams } from '@/components/ListToolbar'
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal'
import { useAuth } from '@/lib/auth/useAuth'
import { getErrorMessage } from '@/lib/api/client'
import dayjs from 'dayjs'
import { Bill } from '@/lib/api/orders'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/bills/')({
  component: BillsPage
})

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open (unpaid)' },
  { value: 'paid', label: 'Paid' },
  { value: 'closed', label: 'Closed' },
  { value: 'voided', label: 'Voided' }
]

// Customer codes look like "T12-MG-20261006-001": table 12, tab 001
const tableOf = (code?: string | null) => {
  const m = String(code || '').match(/^T?([^-]+)-/)
  return m ? `T${m[1].replace(/^T/i, '')}` : code || '-'
}

const openBill = (id: string) => openPrint(`/bill/${id}`, 'Bill')

function BillsPage () {
  const auth = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyToolbar())
  const [paying, setPaying] = useState<Bill | null>(null)
  const query = useBills({ page, limit: 20, ...toolbarParams(filters) })
  const canPay = auth.hasPermission('payment.record')

  const onFilters = (v: typeof filters) => {
    setFilters(v)
    setPage(1)
  }

  const columns: Column<Bill>[] = [
    {
      key: 'bill_ref',
      header: 'Bill',
      render: r => (
        <Stack gap={2} align='flex-start'>
          <Text c='blue' fw={500} style={{ whiteSpace: 'nowrap' }}>
            {r.bill_ref}
          </Text>
          <StatBadge value={r.outlet} />
        </Stack>
      )
    },
    {
      key: 'table',
      header: 'Table',
      render: r => (
        <Tooltip label={`Tab ${r.customer_code}`} withArrow>
          <Text size='sm' fw={600} style={{ whiteSpace: 'nowrap', cursor: 'default' }}>
            {tableOf(r.customer_code)}
          </Text>
        </Tooltip>
      )
    },
    {
      key: 'waiter',
      header: 'Waiter',
      render: r => <Text size='sm' style={{ whiteSpace: 'nowrap' }}>{r.waiter?.full_name || '-'}</Text>
    },
    {
      // Gross and discount sit under the net amount; saves two columns
      key: 'net',
      header: 'Amount',
      align: 'right',
      render: r => {
        const d = parseFloat(r.discount_total)
        return (
          <Stack gap={0} align='flex-end'>
            <Text fw={600} style={{ whiteSpace: 'nowrap' }}>
              {formatCurrency(r.net_total)}
            </Text>
            {d > 0 && (
              <Text size='xs' c='red' style={{ whiteSpace: 'nowrap' }}>
                {formatCurrency(r.gross_total)} − {formatCurrency(d)} discount
              </Text>
            )}
          </Stack>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: r => (
        <Stack gap={2} align='flex-start'>
          <BillStatusBadge status={r.status} paymentState={r.payment_state} />
          {r.pay_later && r.status === 'open' && (
            <Badge size='xs' style={{ color: '#D9480F', backgroundColor: '#FFF4E6', textTransform: 'none' }}>
              Pays later{r.pay_later_room ? ` · room ${r.pay_later_room}` : ''}
            </Badge>
          )}
        </Stack>
      )
    },
    {
      key: 'created',
      header: 'Created',
      render: r => (
        <Text size='sm' style={{ whiteSpace: 'nowrap' }}>
          {dayjs(r.created_at).format('D MMM, HH:mm')}
        </Text>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: r => (
        <Group gap={4} justify='flex-end' wrap='nowrap' onClick={e => e.stopPropagation()}>
          {canPay && r.status === 'open' && (
            <Button size='xs' leftSection={<Banknote size={14} />} onClick={() => setPaying(r)}>
              Pay
            </Button>
          )}
          <Tooltip label='Print bill'>
            <ActionIcon variant='subtle' color='gray' onClick={() => openBill(r.id)} aria-label='Print bill'>
              <Printer size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )
    }
  ]

  const bills = query.data?.data ?? []
  const meta = query.data?.meta
  const error = query.error ? getErrorMessage(query.error) : null

  return (
    <>
      <PageHeader
        title='Bills'
        subtitle={meta ? `${meta.total} bill${meta.total === 1 ? '' : 's'}` : 'All bills in your scope'}
      />

      <ListToolbar
        value={filters}
        onChange={onFilters}
        placeholder='Search bill, table, order or waiter'
        statusOptions={STATUS_OPTIONS}
      />

      {/* Mobile + tablet: card list. Desktop: table. */}
      <Box hiddenFrom='md'>
        <MobileBillList
          bills={bills}
          loading={query.isLoading}
          error={error}
          page={meta?.page ?? 1}
          pages={meta?.pages ?? 1}
          onPageChange={setPage}
        />
      </Box>

      <Box visibleFrom='md'>
        <DataTable
          data={bills}
          columns={columns}
          loading={query.isLoading}
          error={error}
          onRetry={() => query.refetch()}
          rowKey={r => r.id}
          onRowClick={r => navigate({ to: '/bills/$id', params: { id: r.id } })}
          meta={meta}
          onPageChange={setPage}
          emptyTitle='No bills'
          emptyDescription={filters.search || filters.status || filters.preset !== 'any' ? 'No bills match these filters.' : 'Bills are created from orders.'}
        />
      </Box>

      {paying && (
        <RecordPaymentModal
          opened
          onClose={() => setPaying(null)}
          billId={paying.id}
          billNetTotal={parseFloat(paying.net_total)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile bill list - tap-friendly cards                             */
/* ------------------------------------------------------------------ */

function MobileBillList ({
  bills,
  loading,
  error,
  page,
  pages,
  onPageChange
}: {
  bills: Bill[]
  loading: boolean
  error: string | null
  page: number
  pages: number
  onPageChange: (p: number) => void
}) {
  if (loading) {
    return (
      <Stack gap='sm'>
        {[0, 1, 2, 3].map(i => (
          <Card key={i} withBorder radius='md' p='md'>
            <Box style={{ width: 110, height: 14, background: '#E9ECEF', borderRadius: 4, marginBottom: 10 }} />
            <Box style={{ width: '55%', height: 12, background: '#F1F3F5', borderRadius: 4 }} />
          </Card>
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Card withBorder radius='md' p='lg'>
        <Stack align='center' gap={4}>
          <Text fw={600} size='sm'>Couldn't load bills</Text>
          <Text size='xs' c='dimmed'>{error}</Text>
        </Stack>
      </Card>
    )
  }

  if (bills.length === 0) {
    return (
      <Card withBorder radius='md' p='xl'>
        <Stack align='center' gap={6}>
          <Text fw={600} size='sm'>No bills</Text>
          <Text size='xs' c='dimmed' ta='center'>Nothing matches. Bills are created from orders.</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <>
      <DayGroupedList
        items={bills}
        getDate={b => b.created_at}
        keyOf={b => b.id}
        render={bill => <BillCard bill={bill} />}
      />

      {pages > 1 && (
        <Group justify='space-between' mt='md' px={4}>
          <Button variant='default' size='sm' radius='md' disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <Text size='xs' c='dimmed'>Page {page} of {pages}</Text>
          <Button variant='default' size='sm' radius='md' disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </Group>
      )}
    </>
  )
}

function BillCard ({ bill }: { bill: Bill }) {
  const discount = parseFloat(bill.discount_total)

  return (
    <UnstyledButton component={Link} to={`/bills/${bill.id}`} style={{ display: 'block' }}>
      <Card withBorder radius='md' p='md'>
        {/* Row 1: ref + status */}
        <Group justify='space-between' align='center' mb={6} wrap='nowrap'>
          <Text size='sm' fw={700} truncate style={{ letterSpacing: '-0.01em' }}>
            {bill.bill_ref}
          </Text>
          <BillStatusBadge status={bill.status} paymentState={bill.payment_state} />
        </Group>

        {bill.pay_later && bill.status === 'open' && (
          <Badge size='sm' mb={6} style={{ color: '#D9480F', backgroundColor: '#FFF4E6', textTransform: 'none' }}>
            Pays later · {bill.pay_later_guest}{bill.pay_later_room ? `, room ${bill.pay_later_room}` : ''}
          </Badge>
        )}

        {/* Row 2: table + waiter */}
        <Group gap='md' mb={10} wrap='wrap'>
          <Group gap={4} wrap='nowrap'>
            <Hash size={13} color='#868E96' />
            <Text size='xs' c='dimmed'>Table {tableOf(bill.customer_code)}</Text>
          </Group>
          {bill.waiter?.full_name && (
            <Group gap={4} wrap='nowrap'>
              <User size={13} color='#868E96' />
              <Text size='xs' c='dimmed'>{bill.waiter.full_name}</Text>
            </Group>
          )}
          <Group gap={4} wrap='nowrap'>
            <Clock size={13} color='#868E96' />
            <Text size='xs' c='dimmed'>{formatDateTime(bill.created_at)}</Text>
          </Group>
        </Group>

        {/* Row 3: totals */}
        <Group justify='space-between' align='flex-end' wrap='nowrap'>
          <Stack gap={0}>
            {discount > 0 && (
              <Text size='xs' c='dimmed'>
                {formatCurrency(bill.gross_total)} · <Text span size='xs' c='red'>-{formatCurrency(discount)}</Text>
              </Text>
            )}
            <Text fw={700} size='lg'>{formatCurrency(bill.net_total)}</Text>
          </Stack>
          <ChevronRight size={18} color='#ADB5BD' />
        </Group>
      </Card>
    </UnstyledButton>
  )
}
