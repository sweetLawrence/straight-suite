import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Tabs,
  SegmentedControl,
  Text,
  ThemeIcon,
  UnstyledButton
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  Plus,
  ArrowLeftRight,
  Building2,
  Truck,
  ChevronRight,
  Inbox,
  Package,
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { useTransfers, useIncomingTransfers } from '@/hooks/useTransfers'
import { useAuth } from '@/lib/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { RequestTransferModal } from '@/components/transfers/RequestTransferModal'
import { Transfer } from '@/lib/api/transfers'
import { formatDateTime } from '@/lib/utils/format'

export const Route = createFileRoute('/_app/transfers/')({
  component: TransfersPage
})

function TransfersPage () {
  const auth = useAuth()
  const [tab, setTab] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [open, { open: openModal, close }] = useDisclosure(false)

  // Managers see food and bar together and can narrow it; bar staff and the store are narrowed by the server
  const sees = auth.hasRole('manager', 'md', 'admin', 'supervisor', 'auditor', 'accountant')
  const [kind, setKind] = useState<'all' | 'food' | 'bar'>('all')
  const kindParam = sees && kind !== 'all' ? { kind } : {}
  const all = useTransfers({ page, limit: 20, ...kindParam })
  const incoming = useIncomingTransfers({ page, limit: 20, ...kindParam })

  const canRequest =
    auth.hasPermission('stock.issue') || auth.hasRole('manager', 'md')

  const columns: Column<Transfer>[] = [
    {
      key: 'transfer_ref',
      header: 'Reference',
      render: r => (
        <Stack gap={2}>
          {/* Template string - avoids the typed-params requirement while
              the route tree is regenerating */}
          <Text
            component={Link}
            to={`/transfers/${r.id}`}
            size='sm'
            fw={600}
            c='brand.7'
            style={{ textDecoration: 'none' }}
          >
            {r.transfer_ref}
          </Text>
          <Text size='xs' c='dimmed' ff='monospace'>
            #{r.id.slice(0, 8)}
          </Text>
        </Stack>
      )
    },
    {
      key: 'route',
      header: 'Route',
      render: r => <TransferRoute transfer={r} />
    },
    {
      key: 'lines',
      header: 'Items',
      align: 'right',
      width: 80,
      render: r => (
        <Text
          size='sm'
          c='dimmed'
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {r.transfer_lines?.length ?? 0}
        </Text>
      )
    },
    {
      key: 'requested_at',
      header: 'Requested',
      render: r => {
        const [date, ...timeParts] = formatDateTime(r.requested_at).split(' ')
        return (
          <Stack gap={0}>
            <Text size='sm'>{date}</Text>
            <Text size='xs' c='dimmed'>
              {timeParts.join(' ')}
            </Text>
          </Stack>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: r => <StatBadge value={r.status} />
    }
  ]

  const activeQuery = tab === 'incoming' ? incoming : all
  const transfers = activeQuery.data?.data ?? []
  const meta = activeQuery.data?.meta
  const incomingCount =
    incoming.data?.meta?.total ?? incoming.data?.data?.length ?? 0

  return (
    <>
      <PageHeader
        title='Transfers'
        subtitle='Inter-property and external stock movements'
        actions={
          canRequest ? (
            <Button
              leftSection={<Plus size={16} />}
              onClick={openModal}
              radius='md'
            >
              Request Transfer
            </Button>
          ) : undefined
        }
      />

      {sees && (
        <SegmentedControl
          mb='sm'
          value={kind}
          onChange={v => { setKind(v as 'all' | 'food' | 'bar'); setPage(1) }}
          data={[{ value: 'all', label: 'All' }, { value: 'food', label: 'Food' }, { value: 'bar', label: 'Bar' }]}
        />
      )}
      {/* ---------- Tabs ---------- */}
      <Tabs
        value={tab}
        onChange={setTab}
        mb='md'
        variant='pills'
        styles={{
          tab: {
            borderRadius: 'var(--mantine-radius-md)',
            fontWeight: 600
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab value='all' leftSection={<ArrowLeftRight size={14} />}>
            All Transfers
          </Tabs.Tab>
          <Tabs.Tab
            value='incoming'
            leftSection={<Inbox size={14} />}
            rightSection={
              incomingCount > 0 ? (
                <Badge
                  size='xs'
                  variant='filled'
                  color='orange'
                  radius='sm'
                  px={6}
                >
                  {incomingCount}
                </Badge>
              ) : undefined
            }
          >
            Incoming
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Mobile + tablet: card list. Desktop: table. */}
      <Box hiddenFrom='md'>
        <MobileTransferList
          transfers={transfers}
          loading={activeQuery.isLoading}
          error={activeQuery.error ? 'Failed to load transfers' : null}
          meta={meta}
          onPageChange={setPage}
          emptyTitle={tab === 'incoming' ? 'Nothing incoming' : 'No transfers'}
          emptyDescription={
            tab === 'incoming'
              ? 'No transfers awaiting receipt at your property.'
              : 'Transfers between properties will appear here.'
          }
        />
      </Box>

      <Box visibleFrom='md'>
        <DataTable
          data={transfers}
          columns={columns}
          loading={activeQuery.isLoading}
          error={activeQuery.error ? 'Failed to load transfers' : null}
          rowKey={r => r.id}
          meta={meta}
          onPageChange={setPage}
          emptyTitle={tab === 'incoming' ? 'Nothing incoming' : 'No transfers'}
          emptyDescription={
            tab === 'incoming'
              ? 'No transfers awaiting receipt at your property.'
              : 'Transfers between properties will appear here.'
          }
        />
      </Box>

      <RequestTransferModal opened={open} onClose={close} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Route cell                                                        */
/* ------------------------------------------------------------------ */

function TransferRoute ({ transfer }: { transfer: Transfer }) {
  const isExternal = transfer.destination_type !== 'hotel'
  const fromCode = transfer.source_property?.code
  const toLabel = isExternal
    ? transfer.destination_name || 'External'
    : transfer.destination_property?.code

  return (
    <Group gap={6} wrap='nowrap'>
      <Badge
        variant='light'
        color='gray'
        size='sm'
        radius='sm'
        leftSection={<Building2 size={11} />}
      >
        {fromCode || '-'}
      </Badge>

      <ArrowLeftRight
        size={12}
        color='var(--mantine-color-gray-5)'
        style={{ flexShrink: 0 }}
      />

      {isExternal ? (
        <Badge
          variant='light'
          color='orange'
          size='sm'
          radius='sm'
          leftSection={<Truck size={11} />}
        >
          {toLabel}
        </Badge>
      ) : (
        <Badge
          variant='light'
          color='brand'
          size='sm'
          radius='sm'
          leftSection={<Building2 size={11} />}
        >
          {toLabel || '-'}
        </Badge>
      )}
    </Group>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile transfer list                                              */
/* ------------------------------------------------------------------ */

type TransfersMeta = NonNullable<
  ReturnType<typeof useTransfers>['data']
>['meta']

function MobileTransferList ({
  transfers,
  loading,
  error,
  meta,
  onPageChange,
  emptyTitle,
  emptyDescription
}: {
  transfers: Transfer[]
  loading: boolean
  error: string | null
  meta?: TransfersMeta
  onPageChange: (p: number) => void
  emptyTitle: string
  emptyDescription: string
}) {
  if (loading) {
    return (
      <Stack gap='sm'>
        {[0, 1, 2, 3].map(i => (
          <Card key={i} withBorder radius='md' p='md'>
            <Group justify='space-between' mb='xs'>
              <Box
                style={{
                  width: 100,
                  height: 14,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 4
                }}
              />
              <Box
                style={{
                  width: 70,
                  height: 20,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 6
                }}
              />
            </Group>
            <Box
              style={{
                width: '70%',
                height: 22,
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 6,
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
            Couldn't load transfers
          </Text>
          <Text size='xs' c='dimmed'>
            {error}
          </Text>
        </Stack>
      </Card>
    )
  }

  if (transfers.length === 0) {
    return (
      <Card withBorder radius='md' p='xl'>
        <Stack align='center' gap={6}>
          <ThemeIcon variant='light' color='gray' size='xl' radius='md'>
            <ArrowLeftRight size={24} />
          </ThemeIcon>
          <Text fw={600} size='sm'>
            {emptyTitle}
          </Text>
          <Text size='xs' c='dimmed' ta='center' maw={280}>
            {emptyDescription}
          </Text>
        </Stack>
      </Card>
    )
  }

  const totalPages = meta?.pages ?? 1
  const currentPage = meta?.page ?? 1

  return (
    <>
      <Stack gap='sm'>
        {transfers.map(transfer => (
          <TransferCard key={transfer.id} transfer={transfer} />
        ))}
      </Stack>

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

function TransferCard ({ transfer }: { transfer: Transfer }) {
  const isExternal = transfer.destination_type !== 'hotel'
  const fromCode = transfer.source_property?.code
  const toLabel = isExternal
    ? transfer.destination_name || 'External'
    : transfer.destination_property?.code
  const itemCount = transfer.transfer_lines?.length ?? 0
  const [date, ...timeParts] = formatDateTime(transfer.requested_at).split(' ')
  const time = timeParts.join(' ')

  return (
    <UnstyledButton
      component={Link}
      to={`/transfers/${transfer.id}`}
      style={{ display: 'block' }}
    >
      <Card
        withBorder
        radius='md'
        p='md'
        style={{ transition: 'border-color 120ms ease' }}
      >
        {/* Row 1: ref + status */}
        <Group justify='space-between' align='center' mb='sm' wrap='nowrap'>
          <Group gap={8} wrap='nowrap' style={{ minWidth: 0 }}>
            <Text size='sm' fw={700} style={{ letterSpacing: '-0.01em' }}>
              {transfer.transfer_ref}
            </Text>
            <Text size='xs' c='dimmed' ff='monospace'>
              #{transfer.id.slice(0, 6)}
            </Text>
          </Group>
          <StatBadge value={transfer.status} />
        </Group>

        {/* Row 2: route visualization */}
        <Group gap={8} wrap='nowrap' mb='xs'>
          <Badge
            variant='light'
            color='gray'
            size='md'
            radius='sm'
            leftSection={<Building2 size={12} />}
          >
            {fromCode || '-'}
          </Badge>
          <ArrowLeftRight
            size={14}
            color='var(--mantine-color-gray-5)'
            style={{ flexShrink: 0 }}
          />
          {isExternal ? (
            <Badge
              variant='light'
              color='orange'
              size='md'
              radius='sm'
              leftSection={<Truck size={12} />}
            >
              {toLabel}
            </Badge>
          ) : (
            <Badge
              variant='light'
              color='brand'
              size='md'
              radius='sm'
              leftSection={<Building2 size={12} />}
            >
              {toLabel || '-'}
            </Badge>
          )}
        </Group>

        <Divider my='xs' />

        {/* Row 3: items + time + chevron */}
        <Group justify='space-between' align='center' wrap='nowrap'>
          <Group gap='lg' wrap='nowrap'>
            <Group gap={6} wrap='nowrap'>
              <Package size={12} color='var(--mantine-color-gray-6)' />
              <Text size='xs' c='dimmed'>
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </Text>
            </Group>
            <Group gap={6} wrap='nowrap'>
              <Clock size={12} color='var(--mantine-color-gray-6)' />
              <Text size='xs' c='dimmed'>
                {date} · {time}
              </Text>
            </Group>
          </Group>
          <ChevronRight size={16} color='var(--mantine-color-gray-5)' />
        </Group>
      </Card>
    </UnstyledButton>
  )
}
