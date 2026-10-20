import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Modal,
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
  ArrowLeftRight,
  Check,
  Play,
  X,
  CheckCircle2,
  Building2,
  Truck,
  User,
  Calendar,
  Clock,
  Package,
  Hash,
  Info,
  Shield,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import {
  useTransfer,
  useApproveTransfer,
  useRejectTransfer
} from '@/hooks/useTransfers'
import { useAuth } from '@/lib/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { StatBadge } from '@/components/StatBadge'
import { ReasonField } from '@/components/ReasonField'
import { DispatchTransferModal } from '@/components/transfers/DispatchTransferModal'
import { ReceiveTransferModal } from '@/components/transfers/ReceiveTransferModal'
import { getErrorMessage } from '@/lib/api/client'
import { formatDateTime, formatNumber } from '@/lib/utils/format'

export const Route = createFileRoute('/_app/transfers/$id')({
  component: TransferDetailPage
})

function TransferDetailPage () {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const transfer = useTransfer(id)
  const approve = useApproveTransfer()
  const reject = useRejectTransfer()

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectWhy, setRejectWhy] = useState('')
  const [dispatchOpen, { open: openDispatch, close: closeDispatch }] =
    useDisclosure(false)
  const [receiveOpen, { open: openReceive, close: closeReceive }] =
    useDisclosure(false)

  if (transfer.isLoading) return <LoadingState />
  if (transfer.error || !transfer.data)
    return <EmptyState title='Transfer not found' />

  const t = transfer.data

  const groupLevel = auth.hasRole('md', 'admin')
  const isSource = groupLevel || t.source_property_id === auth.user?.primary_property_id
  const isDestination =
    groupLevel ||
    (t.destination_type === 'hotel' &&
      t.destination_property_id === auth.user?.primary_property_id)

  // By permission, so the manager who gets the notification can decide right here
  const canApprove = auth.hasPermission('transfer.approve') && isSource && t.status === 'requested'
  const canDispatch = auth.hasPermission('stock.issue') && isSource && t.status === 'approved'
  const canReceive =
    auth.hasPermission('stock.receive') && t.destination_type === 'hotel' && isDestination && ['dispatched', 'in_transit'].includes(t.status)
  const hasAnyAction = canApprove || canDispatch || canReceive

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id })
      notifications.show({
        color: 'green',
        title: 'Approved',
        message: 'Approved. The store has been told to dispatch it.'
      })
      // Someone who can also send it goes straight on to dispatching
      if (auth.hasPermission('stock.issue')) openDispatch()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const handleReject = () => {
    setRejectWhy('')
    setRejectOpen(true)
  }

  const submitReject = async () => {
    const notes = rejectWhy.trim()
    if (!notes) return
    try {
      await reject.mutateAsync({ id, data: { notes } })
      setRejectOpen(false)
      notifications.show({
        color: 'orange',
        title: 'Rejected',
        message: 'Transfer has been rejected.'
      })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const lines = t.transfer_lines ?? []
  const lineCount = lines.length
  const hasVariance = lines.some(
    l => l.variance && parseFloat(l.variance) !== 0
  )

  return (
    <Box pb={{ base: hasAnyAction ? 80 : 0, md: 0 }}>
      {/* ---------- Back link ---------- */}
      <Button
        variant='subtle'
        color='gray'
        leftSection={<ArrowLeft size={16} />}
        component={Link}
        to='/transfers'
        mb='sm'
        size='sm'
        radius='md'
        px={6}
      >
        Back to transfers
      </Button>

      {/* ---------- Header ---------- */}
      <PageHeader
        title={t.transfer_ref}
        subtitle={
          <Group gap='lg' wrap='wrap'>
            <Group gap={6} wrap='nowrap'>
              <User size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm' c='dimmed'>
                {t.requested_by_user?.full_name || 'Unknown'}
              </Text>
            </Group>
            <Group gap={6} wrap='nowrap'>
              <Calendar size={13} color='var(--mantine-color-gray-6)' />
              <Text size='sm' c='dimmed'>
                {formatDateTime(t.requested_at)}
              </Text>
            </Group>
            {t.reason && (
              <Group gap={6} wrap='nowrap'>
                <Shield size={13} color='var(--mantine-color-gray-6)' />
                <Text size='sm' c='dimmed'>
                  {t.reason}
                </Text>
              </Group>
            )}
          </Group>
        }
        actions={
          <Group gap='sm' visibleFrom='sm'>
            <StatBadge value={t.status} />
            {canApprove && (
              <>
                <Button
                  color='green'
                  leftSection={<Check size={16} />}
                  onClick={handleApprove}
                  loading={approve.isPending}
                  radius='md'
                >
                  Approve
                </Button>
                <Button
                  color='red'
                  variant='light'
                  leftSection={<X size={16} />}
                  onClick={handleReject}
                  loading={reject.isPending}
                  radius='md'
                >
                  Reject
                </Button>
              </>
            )}
            {canDispatch && (
              <Button
                leftSection={<Play size={16} />}
                onClick={openDispatch}
                radius='md'
              >
                Dispatch
              </Button>
            )}
            {canReceive && (
              <Button
                leftSection={<CheckCircle2 size={16} />}
                onClick={openReceive}
                radius='md'
              >
                Confirm Receipt
              </Button>
            )}
          </Group>
        }
      />

      {/* What happens next, and who does it */}
      {!['received', 'rejected', 'cancelled'].includes(t.status) && (
        <Paper p='sm' mb='md' radius='md' style={{ background: '#F8F9FA', border: '1px solid #E9ECEF' }}>
          <Group gap='xs' wrap='nowrap' align='flex-start'>
            <Info size={16} color='#0f766e' style={{ marginTop: 2, flexShrink: 0 }} />
            <Text size='sm'>
              {t.status === 'requested' && (canApprove ? 'Waiting for you: approve or reject below.' : 'Step 1 of 3: waiting for the manager to approve.')}
              {t.status === 'approved' && (canDispatch ? 'Approved. Next: dispatch it from your store.' : 'Step 2 of 3: approved, waiting for the store to dispatch.')}
              {['dispatched', 'in_transit'].includes(t.status) && (canReceive ? 'On its way. Count it in and confirm receipt.' : 'Step 3 of 3: on its way, waiting for the destination to receive.')}
              {t.status === 'partially_received' && 'Received with a shortage. The manager resolves it.'}
            </Text>
          </Group>
        </Paper>
      )}

      {/* Status on mobile (header actions hidden) */}
      <Group mb='md' hiddenFrom='sm'>
        <StatBadge value={t.status} />
        {hasVariance && (
          <Badge
            variant='light'
            color='orange'
            size='sm'
            radius='sm'
            leftSection={<AlertTriangle size={11} />}
          >
            Has variance
          </Badge>
        )}
      </Group>

      {/* ---------- Route hero ---------- */}
      <Card withBorder radius='md' p={0} mb='lg' style={{ overflow: 'hidden' }}>
        <RouteHero transfer={t} />
      </Card>

      {/* ---------- Details + Approvals ---------- */}
      <SimpleGrid cols={{ base: 1, md: 2 }} mb='lg' spacing='lg'>
        <Card withBorder radius='md' p={0} style={{ overflow: 'hidden' }}>
          <Group p='md' pb='sm'>
            <Box>
              <Title order={5} fw={600}>
                Timeline
              </Title>
              <Text size='xs' c='dimmed' mt={2}>
                Key events for this transfer
              </Text>
            </Box>
          </Group>
          <Divider />
          <Stack gap={0}>
            <TimelineRow
              label='Requested'
              value={formatDateTime(t.requested_at)}
              icon={<Package size={14} />}
              tone='neutral'
              isLast={!t.approved_at && !t.dispatched_at && !t.received_at}
            />
            {t.approved_at && (
              <TimelineRow
                label='Approved'
                value={formatDateTime(t.approved_at)}
                icon={<Check size={14} />}
                tone='success'
                isLast={!t.dispatched_at && !t.received_at}
              />
            )}
            {t.dispatched_at && (
              <TimelineRow
                label='Dispatched'
                value={formatDateTime(t.dispatched_at)}
                icon={<Truck size={14} />}
                tone='info'
                isLast={!t.received_at}
              />
            )}
            {t.received_at && (
              <TimelineRow
                label='Received'
                value={formatDateTime(t.received_at)}
                icon={<CheckCircle2 size={14} />}
                tone='success'
                isLast
              />
            )}
          </Stack>
        </Card>

        <Card withBorder radius='md' p={0} style={{ overflow: 'hidden' }}>
          <Group p='md' pb='sm'>
            <Box>
              <Title order={5} fw={600}>
                Approvals
              </Title>
              <Text size='xs' c='dimmed' mt={2}>
                {t.approvals && t.approvals.length > 0
                  ? `${t.approvals.length} decision${
                      t.approvals.length === 1 ? '' : 's'
                    } recorded`
                  : 'No approvals yet'}
              </Text>
            </Box>
          </Group>
          <Divider />
          {!t.approvals || t.approvals.length === 0 ? (
            <Stack align='center' py='xl' gap={4}>
              <ThemeIcon variant='light' color='gray' size='md' radius='md'>
                <Shield size={14} />
              </ThemeIcon>
              <Text size='sm' c='dimmed'>
                No decisions yet
              </Text>
            </Stack>
          ) : (
            <Stack gap={0}>
              {t.approvals.map((a, i) => (
                <Box
                  key={a.id}
                  p='md'
                  style={{
                    borderTop:
                      i === 0 ? 'none' : '1px solid var(--mantine-color-gray-2)'
                  }}
                >
                  <Group justify='space-between' align='center' wrap='nowrap'>
                    <Box style={{ minWidth: 0 }}>
                      <Text size='sm' fw={600} lineClamp={1}>
                        {a.approver?.full_name || 'Unknown'}
                      </Text>
                      <Text size='xs' c='dimmed' mt={2}>
                        {formatDateTime(a.decision_at)}
                      </Text>
                    </Box>
                    <StatBadge value={a.decision} />
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </SimpleGrid>

      {/* ---------- Lines ---------- */}
      <Card withBorder radius='md' p={0} style={{ overflow: 'hidden' }}>
        <Group justify='space-between' align='center' p='md' pb='sm'>
          <Box>
            <Title order={5} fw={600}>
              Transfer Lines
            </Title>
            <Text size='xs' c='dimmed' mt={2}>
              {lineCount === 0
                ? 'No items'
                : `${lineCount} item${lineCount === 1 ? '' : 's'}`}
              {hasVariance && (
                <Text component='span' c='orange.7' fw={600}>
                  {' '}
                  · variance detected
                </Text>
              )}
            </Text>
          </Box>
        </Group>

        <Divider />

        {lineCount === 0 ? (
          <Stack align='center' py='xl' gap={6}>
            <ThemeIcon variant='light' color='gray' size='lg' radius='md'>
              <Package size={18} />
            </ThemeIcon>
            <Text size='sm' fw={600}>
              No lines
            </Text>
            <Text size='xs' c='dimmed' ta='center' maw={280}>
              This transfer has no items recorded.
            </Text>
          </Stack>
        ) : (
          <>
            {/* Mobile + tablet: stacked line cards */}
            <Box hiddenFrom='md' p='md' pt='sm'>
              <Stack gap='xs'>
                {lines.map(line => (
                  <TransferLineCard key={line.id} line={line} />
                ))}
              </Stack>
            </Box>

            {/* Desktop: table */}
            <Box visibleFrom='md'>
              <TransferLinesTable lines={lines} />
            </Box>
          </>
        )}
      </Card>

      {/* ---------- Mobile sticky action bar ---------- */}
      {hasAnyAction && (
        <Paper
          shadow='lg'
          radius={0}
          p='md'
          hiddenFrom='sm'
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            borderTop: '1px solid var(--mantine-color-gray-2)',
            paddingBottom:
              'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))'
          }}
        >
          <Group grow gap='sm'>
            {canApprove && (
              <>
                <Button
                  color='red'
                  variant='light'
                  leftSection={<X size={16} />}
                  onClick={handleReject}
                  loading={reject.isPending}
                  radius='md'
                >
                  Reject
                </Button>
                <Button
                  color='green'
                  leftSection={<Check size={16} />}
                  onClick={handleApprove}
                  loading={approve.isPending}
                  radius='md'
                >
                  Approve
                </Button>
              </>
            )}
            {canDispatch && (
              <Button
                fullWidth
                leftSection={<Play size={16} />}
                onClick={openDispatch}
                radius='md'
              >
                Dispatch Transfer
              </Button>
            )}
            {canReceive && (
              <Button
                fullWidth
                leftSection={<CheckCircle2 size={16} />}
                onClick={openReceive}
                radius='md'
              >
                Confirm Receipt
              </Button>
            )}
          </Group>
        </Paper>
      )}

      <Modal opened={rejectOpen} onClose={() => setRejectOpen(false)} title='Reject transfer' centered>
        <Stack>
          <ReasonField
            label='Reason'
            required
            options={['Not enough stock to spare', 'Not needed at the destination', 'Wrong item or quantity', 'Not approved by management']}
            value={rejectWhy}
            onChange={setRejectWhy}
          />
          <Button color='red' disabled={!rejectWhy.trim()} loading={reject.isPending} onClick={submitReject}>Reject</Button>
        </Stack>
      </Modal>

      <DispatchTransferModal
        opened={dispatchOpen}
        onClose={closeDispatch}
        transfer={t}
      />
      <ReceiveTransferModal
        opened={receiveOpen}
        onClose={closeReceive}
        transfer={t}
      />
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Route hero - visual "A → B"                                        */
/* ------------------------------------------------------------------ */

function RouteHero ({
  transfer
}: {
  transfer: NonNullable<ReturnType<typeof useTransfer>['data']>
}) {
  const isExternal = transfer.destination_type !== 'hotel'
  const fromCode = transfer.source_property?.code || '-'
  const fromName = transfer.source_property?.name || ''
  const toCode = isExternal
    ? transfer.destination_name || 'External'
    : transfer.destination_property?.code || '-'
  const toName = isExternal
    ? 'External destination'
    : transfer.destination_property?.name || ''

  return (
    <Box p='lg'>
      <Group justify='center' align='center' gap='xl' wrap='nowrap'>
        {/* Source */}
        <Stack align='center' gap={6} style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon variant='light' color='gray' size={44} radius='md'>
            <Building2 size={22} />
          </ThemeIcon>
          <Text
            size='xs'
            c='dimmed'
            tt='uppercase'
            fw={600}
            style={{ letterSpacing: 0.5 }}
          >
            From
          </Text>
          <Text fw={700} size='lg' ta='center' lineClamp={1}>
            {fromCode}
          </Text>
          {fromName && (
            <Text size='xs' c='dimmed' ta='center' lineClamp={1}>
              {fromName}
            </Text>
          )}
        </Stack>

        {/* Arrow */}
        <Stack align='center' gap={4} style={{ flexShrink: 0 }}>
          <ThemeIcon
            variant={isExternal ? 'light' : 'light'}
            color={isExternal ? 'orange' : 'brand'}
            size='lg'
            radius='xl'
          >
            <ArrowLeftRight size={18} />
          </ThemeIcon>
        </Stack>

        {/* Destination */}
        <Stack align='center' gap={6} style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon
            variant='light'
            color={isExternal ? 'orange' : 'brand'}
            size={44}
            radius='md'
          >
            {isExternal ? <Truck size={22} /> : <Building2 size={22} />}
          </ThemeIcon>
          <Text
            size='xs'
            c='dimmed'
            tt='uppercase'
            fw={600}
            style={{ letterSpacing: 0.5 }}
          >
            To
          </Text>
          <Text fw={700} size='lg' ta='center' lineClamp={1}>
            {toCode}
          </Text>
          {toName && (
            <Text size='xs' c='dimmed' ta='center' lineClamp={1}>
              {toName}
            </Text>
          )}
        </Stack>
      </Group>
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Timeline row                                                       */
/* ------------------------------------------------------------------ */

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const toneColor: Record<Tone, string> = {
  neutral: 'gray',
  success: 'green',
  warning: 'orange',
  danger: 'red',
  info: 'blue'
}

function TimelineRow ({
  label,
  value,
  icon,
  tone,
  isLast
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: Tone
  isLast: boolean
}) {
  return (
    <Box
      p='md'
      style={{
        borderTop: '1px solid var(--mantine-color-gray-2)'
      }}
    >
      <Group gap='md' wrap='nowrap' align='flex-start'>
        <ThemeIcon
          variant='light'
          color={toneColor[tone]}
          size='md'
          radius='xl'
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          {icon}
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size='sm' fw={600}>
            {label}
          </Text>
          <Text size='xs' c='dimmed' mt={2}>
            {value}
          </Text>
        </Box>
      </Group>
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Transfer line card (mobile)                                       */
/* ------------------------------------------------------------------ */

type TransferLine = NonNullable<
  NonNullable<ReturnType<typeof useTransfer>['data']>['transfer_lines']
>[number]

function TransferLineCard ({ line }: { line: TransferLine }) {
  const variance = line.variance ? parseFloat(line.variance) : 0
  const hasVariance = variance !== 0
  const varianceTone = variance < 0 ? 'red' : variance > 0 ? 'green' : 'gray'

  return (
    <Card withBorder radius='md' p='sm'>
      {/* Item name + variance */}
      <Group justify='space-between' align='flex-start' wrap='nowrap' mb={4}>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={600} size='sm' lineClamp={1}>
            {line.stock_item?.item?.name || '-'}
          </Text>
          {line.batch?.batch_ref && (
            <Group gap={4} mt={2} wrap='nowrap'>
              <Hash size={11} color='var(--mantine-color-gray-6)' />
              <Text size='xs' c='dimmed' ff='monospace' lineClamp={1}>
                {line.batch.batch_ref}
              </Text>
            </Group>
          )}
        </Box>
        {hasVariance && (
          <Badge
            variant='light'
            color={varianceTone}
            size='sm'
            radius='sm'
            leftSection={
              variance > 0 ? (
                <TrendingUp size={11} />
              ) : variance < 0 ? (
                <TrendingDown size={11} />
              ) : (
                <Minus size={11} />
              )
            }
            styles={{ label: { fontVariantNumeric: 'tabular-nums' } }}
          >
            {variance > 0 ? '+' : ''}
            {formatNumber(line.variance ?? '', 3)}
          </Badge>
        )}
      </Group>

      <Divider my='xs' />

      {/* Qty row: requested → dispatched → received */}
      <SimpleGrid cols={3} spacing='xs'>
        <QtyCell
          label='Requested'
          value={line.requested_qty}
          unit={line.unit?.code}
          tone='neutral'
        />
        <QtyCell
          label='Dispatched'
          value={line.dispatched_qty}
          unit={line.unit?.code}
          tone='info'
        />
        <QtyCell
          label='Received'
          value={line.received_qty}
          unit={line.unit?.code}
          tone='success'
        />
      </SimpleGrid>
    </Card>
  )
}

function QtyCell ({
  label,
  value,
  unit,
  tone
}: {
  label: string
  value?: string | null
  unit?: string
  tone: Tone
}) {
  const hasValue = value !== null && value !== undefined && value !== ''
  return (
    <Stack gap={2} align='center'>
      <Text
        size='xs'
        c='dimmed'
        tt='uppercase'
        fw={600}
        style={{ letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      {hasValue ? (
        <Text
          fw={600}
          size='sm'
          c={toneColor[tone] === 'gray' ? undefined : toneColor[tone]}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatNumber(value!)}
          {unit && (
            <Text component='span' size='xs' c='dimmed' ml={2}>
              {unit}
            </Text>
          )}
        </Text>
      ) : (
        <Text size='sm' c='dimmed'>
          -
        </Text>
      )}
    </Stack>
  )
}

/* ------------------------------------------------------------------ */
/*  Transfer lines table (desktop)                                    */
/* ------------------------------------------------------------------ */

function TransferLinesTable ({ lines }: { lines: TransferLine[] }) {
  return (
    <Table highlightOnHover verticalSpacing='sm' horizontalSpacing='md'>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th>Batch</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Requested</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Dispatched</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Received</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Variance</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {lines.map(l => {
          const variance = l.variance ? parseFloat(l.variance) : 0
          const hasVariance = variance !== 0
          return (
            <Table.Tr key={l.id}>
              <Table.Td>
                <Text fw={600} size='sm'>
                  {l.stock_item?.item?.name || '-'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm' c='dimmed' ff='monospace'>
                  {l.batch?.batch_ref || '-'}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text size='sm' style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatNumber(l.requested_qty)}{' '}
                  <Text component='span' c='dimmed' size='xs'>
                    {l.unit?.code}
                  </Text>
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {l.dispatched_qty ? (
                  <Text
                    size='sm'
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatNumber(l.dispatched_qty)}{' '}
                    <Text component='span' c='dimmed' size='xs'>
                      {l.unit?.code}
                    </Text>
                  </Text>
                ) : (
                  <Text size='sm' c='dimmed'>
                    -
                  </Text>
                )}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {l.received_qty ? (
                  <Text
                    size='sm'
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatNumber(l.received_qty)}{' '}
                    <Text component='span' c='dimmed' size='xs'>
                      {l.unit?.code}
                    </Text>
                  </Text>
                ) : (
                  <Text size='sm' c='dimmed'>
                    -
                  </Text>
                )}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                {hasVariance ? (
                  <Text
                    size='sm'
                    fw={600}
                    c={variance < 0 ? 'red' : 'green'}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {variance > 0 ? '+' : ''}
                    {formatNumber(l.variance ?? '', 3)}
                  </Text>
                ) : (
                  <Text size='sm' c='dimmed'>
                    -
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
