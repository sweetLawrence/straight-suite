import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  ArrowLeft,
  Plus,
  Receipt,
  ChefHat,
  Wine,
  Clock,
  User,
  Hash,
  Calendar,
  ChevronRight,
  Pencil
} from 'lucide-react'
import { useState } from 'react'
import { ChangeLineModal, isIssued } from '@/components/orders/ChangeLineModal'
import { useOrder, useGenerateBill, useIssueBarLine } from '@/hooks/useOrders'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { StatBadge } from '@/components/StatBadge'
import { AddLineModal } from '@/components/orders/AddLineModal'
import { formatCurrency, formatDateTime, formatQty } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'
import { getErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth/useAuth'

export const Route = createFileRoute('/_app/orders/$id')({
  component: OrderDetailPage
})

function OrderDetailPage () {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const order = useOrder(id)
  const generateBill = useGenerateBill(id)
  const [addLineOpen, { open: openAddLine, close: closeAddLine }] =
    useDisclosure(false)
  const [changing, setChanging] = useState<OrderLine | null>(null)
  const issue = useIssueBarLine()
  const [pouring, setPouring] = useState<string | null>(null)

  if (order.isLoading) return <LoadingState />
  if (order.error || !order.data) return <EmptyState title='Order not found' />

  const o = order.data
  const isOpen = o.status === 'open' || o.status === 'in_progress'
  const canSell = auth.hasPermission('order.create') || auth.hasPermission('bar.order.create')
  const canAddLines = isOpen && canSell
  const canBill =
    isOpen && (o.order_lines ?? []).some(l => l.status !== 'cancelled')
  // Lines can change until the order is billed. Poured or sent lines need a manager.
  const changeable = !['billed', 'closed', 'cancelled'].includes(o.status) && !o.bill
  const canChange = (line: OrderLine) =>
    changeable &&
    line.status !== 'cancelled' &&
    canSell &&
    (!isIssued(line) || auth.hasPermission('order.edit_issued'))

  // The bar pours straight from here (no need to go to Bar Orders)
  const awaitingApproval = o.approval_status === 'pending'
  const canPour = (line: OrderLine) =>
    auth.hasPermission('bar.issue') && line.station === 'bar' && line.status === 'pending' && !awaitingApproval
  const toPour = (o.order_lines ?? []).filter(canPour)
  const pour = async (lines: OrderLine[]) => {
    for (const line of lines) {
      setPouring(line.id)
      try {
        await issue.mutateAsync(line.id)
      } catch (err) {
        notifications.show({ color: 'red', title: `Could not pour ${line.menu_item?.display_name || ''}`, message: getErrorMessage(err) })
        break
      }
    }
    setPouring(null)
    order.refetch()
  }

  const total =
    o.order_lines?.reduce((sum, l) => sum + parseFloat(l.line_total), 0) ?? 0
  const lineCount = o.order_lines?.length ?? 0

  const handleGenerateBill = async () => {
    try {
      const bill = await generateBill.mutateAsync()
      notifications.show({
        color: 'green',
        title: 'Bill created',
        message: `Bill ${bill.bill_ref} generated`
      })
      navigate({ to: `/bills/${bill.id}` })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  return (
    <Box pb={{ base: canBill && !o.bill ? 96 : 16, sm: 0 }}>
      {/* ---------- Back link ---------- */}
      <Button
        variant='subtle'
        color='gray'
        leftSection={<ArrowLeft size={16} />}
        component={Link}
        to='/orders'
        mb='sm'
        size='sm'
        radius='md'
        px={6}
      >
        Back to orders
      </Button>

      {/* ---------- Header ---------- */}
      <PageHeader
        title={o.order_ref}
        subtitle={
          <Group gap='lg' wrap='wrap' mt={4}>
            <Group gap={6} wrap='nowrap'>
              <User size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm' c='dimmed'>
                {o.customer_code || 'Walk-in'}
              </Text>
            </Group>
            {o.table_number && (
              <Group gap={6} wrap='nowrap'>
                <Hash size={13} color='var(--mantine-color-gray-6)' />
                <Text size='sm' c='dimmed'>
                  Table {o.table_number}
                </Text>
              </Group>
            )}
            <Group gap={6} wrap='nowrap'>
              <ChefHat size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm' c='dimmed'>
                {o.waiter?.full_name || 'Unassigned'}
              </Text>
            </Group>
            <Group gap={6} wrap='nowrap'>
              <Calendar size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm' c='dimmed'>
                {formatDateTime(o.created_at)}
              </Text>
            </Group>
          </Group>
        }
        actions={
          <Group visibleFrom='sm'>
            <StatBadge value={o.outlet} />
            <StatBadge value={o.status} />
            {o.approval_status && o.approval_status !== 'approved' && (
              <StatBadge value={o.approval_status} />
            )}
            {canBill && !o.bill && (
              <Button
                leftSection={<Receipt size={16} />}
                onClick={handleGenerateBill}
                loading={generateBill.isPending}
              >
                Generate Bill
              </Button>
            )}
            {o.bill && (
              <Button
                component={Link}
                to={`/bills/${o.bill.id}`}
                variant='light'
              >
                View Bill
              </Button>
            )}
          </Group>
        }
      />

      {/* Status on mobile (header actions are desktop only) */}
      <Group mb='md' gap='xs' hiddenFrom='sm'>
        <StatBadge value={o.outlet} />
        <StatBadge value={o.status} />
        {o.approval_status && o.approval_status !== 'approved' && (
          <StatBadge value={o.approval_status} />
        )}
        {o.bill && (
          <Button
            component={Link}
            to={`/bills/${o.bill.id}`}
            variant='light'
            size='xs'
            radius='md'
            rightSection={<ChevronRight size={14} />}
          >
            View Bill
          </Button>
        )}
      </Group>

      {/* ---------- Bar: pour from here ---------- */}
      {toPour.length > 0 && (
        <Paper withBorder radius='md' p='sm' mb='md' style={{ background: '#F8F0FC', borderColor: '#E5DBFF' }}>
          <Group justify='space-between' wrap='nowrap' gap='sm'>
            <Box style={{ minWidth: 0 }}>
              <Text size='sm' fw={700} style={{ color: '#862E9C' }}>
                {toPour.length} drink{toPour.length === 1 ? '' : 's'} to pour
              </Text>
              <Text size='xs' c='dimmed'>Pouring takes them off bar stock</Text>
            </Box>
            <Button color='grape' leftSection={<Wine size={16} />} loading={!!pouring} onClick={() => pour(toPour)}>
              Pour all
            </Button>
          </Group>
        </Paper>
      )}
      {awaitingApproval && auth.hasPermission('bar.issue') && (
        <Text size='sm' mb='md' style={{ color: '#E8590C' }}>Large bar order: waiting for the manager to approve before pouring.</Text>
      )}

      {/* ---------- Order Lines ---------- */}
      <Card withBorder radius='md' p={0} style={{ overflow: 'hidden' }}>
        <Group justify='space-between' align='center' p='md' pb='sm'>
          <Box>
            <Title order={5} fw={600}>
              Order Lines
            </Title>
            <Text size='xs' c='dimmed' mt={2}>
              {lineCount === 0
                ? 'No items yet'
                : `${lineCount} item${lineCount === 1 ? '' : 's'}`}
            </Text>
          </Box>
          {canAddLines && (
            <Button
              size='xs'
              leftSection={<Plus size={14} />}
              onClick={openAddLine}
              radius='md'
            >
              Add Line
            </Button>
          )}
        </Group>

        <Divider />

        {lineCount === 0 ? (
          <Stack align='center' py='xl' gap={6}>
            <ThemeIcon variant='light' color='gray' size='lg' radius='md'>
              <Receipt size={18} />
            </ThemeIcon>
            <Text size='sm' fw={600}>
              No items yet
            </Text>
            <Text size='xs' c='dimmed' ta='center' maw={280}>
              Add the first item to this order to get started.
            </Text>
            {canAddLines && (
              <Button
                size='xs'
                variant='light'
                mt='xs'
                leftSection={<Plus size={14} />}
                onClick={openAddLine}
                radius='md'
              >
                Add first item
              </Button>
            )}
          </Stack>
        ) : (
          <>
            {/* Mobile + tablet: stacked line cards */}
            <Box hiddenFrom='md' p='md' pt='sm'>
              <Stack gap='xs'>
                {o.order_lines!.map(line => (
                  <OrderLineCard
                    key={line.id}
                    line={line}
                    onChange={canChange(line) ? () => setChanging(line) : undefined}
                    onPour={canPour(line) ? () => pour([line]) : undefined}
                    pouring={pouring === line.id}
                  />
                ))}
              </Stack>
            </Box>

            {/* Desktop: table */}
            <Box visibleFrom='md'>
              <OrderLinesTable
                lines={o.order_lines!}
                onChange={l => (canChange(l) ? () => setChanging(l) : undefined)}
                onPour={l => (canPour(l) ? () => pour([l]) : undefined)}
                pouringId={pouring}
              />
            </Box>
          </>
        )}

        {/* Total footer */}
        {lineCount > 0 && (
          <>
            <Divider />
            <Group justify='space-between' align='center' p='md'>
              <Text size='sm' c='dimmed'>
                Order total
              </Text>
              <Text
                fw={700}
                size='lg'
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em'
                }}
              >
                {formatCurrency(total)}
              </Text>
            </Group>
          </>
        )}
      </Card>

      {/* ---------- Mobile sticky action bar ---------- */}
      {canBill && !o.bill && (
        <Paper
          shadow='lg'
          radius={0}
          p='md'
          hiddenFrom='sm'
          style={{
            position: 'fixed',
            // sit above the phone tab bar
            bottom: 'var(--bottom-nav-height, 0px)',
            left: 0,
            right: 0,
            zIndex: 100,
            borderTop: '1px solid var(--mantine-color-gray-2)',
            paddingBottom:
              'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))'
          }}
        >
          <Button
            fullWidth
            size='md'
            radius='md'
            leftSection={<Receipt size={18} />}
            onClick={handleGenerateBill}
            loading={generateBill.isPending}
          >
            Generate Bill · {formatCurrency(total)}
          </Button>
        </Paper>
      )}

      <AddLineModal opened={addLineOpen} onClose={closeAddLine} orderId={id} />
      <ChangeLineModal orderId={id} line={changing} onClose={() => setChanging(null)} />
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Order line card (mobile)                                          */
/* ------------------------------------------------------------------ */

type OrderLine = NonNullable<
  ReturnType<typeof useOrder>['data']
>['order_lines'] extends (infer U)[] | undefined
  ? U
  : never

function OrderLineCard ({
  line,
  onChange,
  onPour,
  pouring
}: {
  line: OrderLine
  onChange?: () => void
  onPour?: () => void
  pouring?: boolean
}) {
  const stationIcon =
    line.station === 'bar' ? <Wine size={11} /> : <ChefHat size={11} />
  const off = line.status === 'cancelled'

  return (
    <Card withBorder radius='md' p='sm' style={{ opacity: off ? 0.55 : 1 }}>
      <Group justify='space-between' align='flex-start' wrap='nowrap' mb={6}>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text
            fw={600}
            size='sm'
            lineClamp={2}
            td={off ? 'line-through' : undefined}
          >
            {line.menu_item?.display_name || '-'}
          </Text>
          <Group gap={6} mt={4} wrap='nowrap'>
            <Badge
              variant='light'
              color={line.station === 'bar' ? 'grape' : 'blue'}
              size='xs'
              radius='sm'
              leftSection={stationIcon}
              styles={{ label: { textTransform: 'capitalize' } }}
            >
              {line.station}
            </Badge>
            <StatBadge value={line.status} />
          </Group>
        </Box>
        <Text
          fw={700}
          size='sm'
          style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
        >
          {formatCurrency(line.line_total)}
        </Text>
      </Group>

      <Group
        gap='lg'
        mt='xs'
        pt='xs'
        style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Text size='xs' c='dimmed'>
          Qty{' '}
          <Text component='span' fw={600} c='dark'>
            {formatQty(line.quantity)}
          </Text>
        </Text>
        <Text size='xs' c='dimmed'>
          Unit{' '}
          <Text component='span' fw={600} c='dark'>
            {formatCurrency(line.unit_price)}
          </Text>
        </Text>
        {onPour && (
          <Button
            color='grape'
            size='compact-xs'
            ml='auto'
            loading={pouring}
            leftSection={<Wine size={12} />}
            onClick={onPour}
          >
            Pour
          </Button>
        )}
        {onChange && (
          <Button
            variant='subtle'
            size='compact-xs'
            ml={onPour ? 0 : 'auto'}
            leftSection={<Pencil size={12} />}
            onClick={onChange}
          >
            Change
          </Button>
        )}
      </Group>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Order lines table (desktop)                                       */
/* ------------------------------------------------------------------ */

function OrderLinesTable ({
  lines,
  onChange,
  onPour,
  pouringId
}: {
  lines: OrderLine[]
  onChange: (line: OrderLine) => (() => void) | undefined
  onPour: (line: OrderLine) => (() => void) | undefined
  pouringId: string | null
}) {
  return (
    <Table highlightOnHover verticalSpacing='sm' horizontalSpacing='md'>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th>Station</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Qty</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Price</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {lines.map(line => (
          <Table.Tr
            key={line.id}
            style={{ opacity: line.status === 'cancelled' ? 0.55 : 1 }}
          >
            <Table.Td>
              <Text
                fw={600}
                size='sm'
                td={line.status === 'cancelled' ? 'line-through' : undefined}
              >
                {line.menu_item?.display_name || '-'}
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge
                variant='light'
                color={line.station === 'bar' ? 'grape' : 'blue'}
                size='sm'
                radius='sm'
                leftSection={
                  line.station === 'bar' ? (
                    <Wine size={11} />
                  ) : (
                    <ChefHat size={11} />
                  )
                }
                styles={{ label: { textTransform: 'capitalize' } }}
              >
                {line.station}
              </Badge>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
              <Text size='sm' style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatQty(line.quantity)}
              </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
              <Text
                size='sm'
                c='dimmed'
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCurrency(line.unit_price)}
              </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
              <Text
                size='sm'
                fw={600}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCurrency(line.line_total)}
              </Text>
            </Table.Td>
            <Table.Td>
              <StatBadge value={line.status} />
            </Table.Td>
            <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              {onPour(line) && (
                <Button
                  color='grape'
                  size='compact-xs'
                  mr={6}
                  loading={pouringId === line.id}
                  leftSection={<Wine size={12} />}
                  onClick={onPour(line)}
                >
                  Pour
                </Button>
              )}
              {onChange(line) && (
                <Tooltip label='Lower quantity or remove'>
                  <ActionIcon
                    variant='subtle'
                    color='gray'
                    onClick={onChange(line)}
                    aria-label='Change line'
                  >
                    <Pencil size={15} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
