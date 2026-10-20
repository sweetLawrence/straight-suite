import { useState } from 'react'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

import {
  Modal,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Tabs,
  Loader,
  Card,
  Divider,
  SimpleGrid,
  Select
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Calendar, User, Wallet, DoorOpen, CreditCard } from 'lucide-react'
import { useRooms } from '../rooms/hooks'
import {
  useBooking,
  usePayments,
  useUpdateBookingStatus,
  useAssignRoom,
  useRequestRefund,
  useUpdateRefundStatus
} from './hooks'
import { useInitiateStkPush, usePaymentStatusPoll, useRecordCashPayment } from '../payments/hooks'
import {
  BOOKING_TRANSITIONS,
  STATUS_COLORS,
  type BookingStatus
} from '../../types/booking'

interface Props {
  bookingId: string | null
  onClose: () => void
}

// Define types for refund inputs and created refunds
interface RefundInput {
  amount: string
  reason: string
}

interface CreatedRefund {
  id: string
  status: string
}

export default function BookingDetailModal({ bookingId, onClose }: Props) {
  const { data: booking, isLoading } = useBooking(bookingId)
  const { data: payments } = usePayments(bookingId)
  const updateStatus = useUpdateBookingStatus()
  const assignRoom = useAssignRoom()
  const requestRefund = useRequestRefund()
  const updateRefundStatus = useUpdateRefundStatus()
  const initiateStkPush = useInitiateStkPush()
  const recordCashPayment = useRecordCashPayment()

  const [roomId, setRoomId] = useState<string>('')
  const [refundInputs, setRefundInputs] = useState<Record<string, RefundInput>>({})
  const [createdRefunds, setCreatedRefunds] = useState<Record<string, CreatedRefund>>({})

  const [balancePhone, setBalancePhone] = useState<string>('')
  const [balancePushSent, setBalancePushSent] = useState<boolean>(false)
  const [balancePushError, setBalancePushError] = useState<string | null>(null)
  const [cashAmount, setCashAmount] = useState<string>('')

  const { data: rooms } = useRooms(booking?.roomTypeId)
  const { data: balancePaymentStatus } = usePaymentStatusPoll(booking?.bookingCode ?? null, balancePushSent)

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM D, YYYY')
  }

  const formatStayDuration = (checkIn: string, checkOut: string) => {
    const start = dayjs(checkIn)
    const end = dayjs(checkOut)
    const nights = end.diff(start, 'days')
    return `${nights} night${nights !== 1 ? 's' : ''}`
  }

  function handleStatusChange(status: BookingStatus) {
    if (!bookingId || !booking) return

    if (status === 'checked_in' && Number(booking.balanceDue) > 0) {
      const proceed = confirm(
        `This guest still owes ${booking.balanceDue} ${booking.currency}. Check in anyway?`
      )
      if (!proceed) return
    }

    updateStatus.mutate(
      { id: bookingId, status },
      {
        onSuccess: () =>
          notifications.show({
            message: `Booking updated to ${status.replace('_', ' ')}.`,
            color: 'green'
          }),
        onError: (err: any) =>
          notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function handleAssignRoom() {
    if (!bookingId || !roomId) return
    assignRoom.mutate(
      { bookingId, roomId },
      {
        onSuccess: () =>
          notifications.show({ message: 'Room assigned.', color: 'green' }),
        onError: (err: any) =>
          notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function handleRefund(paymentId: string) {
    const input = refundInputs[paymentId]
    if (!input?.amount || !input?.reason) return
    requestRefund.mutate(
      { paymentId, amount: Number(input.amount), reason: input.reason },
      {
        onSuccess: (refund: any) =>
          setCreatedRefunds(prev => ({ ...prev, [paymentId]: refund })),
        onError: (err: any) =>
          notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function handleRefundStatus(
    paymentId: string,
    status: 'completed' | 'rejected'
  ) {
    const refund = createdRefunds[paymentId]
    if (!refund) return
    updateRefundStatus.mutate(
      { refundId: refund.id, status },
      {
        onSuccess: () => {
          notifications.show({ message: `Refund ${status}.`, color: 'green' })
          setCreatedRefunds(prev => ({
            ...prev,
            [paymentId]: { ...refund, status }
          }))
        }
      }
    )
  }

  function handleSendBalancePush() {
    if (!booking || !balancePhone) return
    setBalancePushError(null)
    initiateStkPush.mutate(
      { 
        bookingCode: booking.bookingCode, 
        phoneNumber: balancePhone, 
        amountType: 'balance' 
      },
      { 
        onSuccess: () => setBalancePushSent(true), 
        onError: (err: any) => setBalancePushError(err.message) 
      }
    )
  }

  function handleRecordCash() {
    if (!bookingId || !cashAmount) return
    recordCashPayment.mutate(
      { bookingId, amount: Number(cashAmount), type: 'balance' },
      {
        onSuccess: () => {
          notifications.show({ message: 'Cash payment recorded.', color: 'green' })
          setCashAmount('')
        },
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  // Helper to get available room options
  const roomOptions = (rooms ?? [])
    .filter(r => r.status === 'active')
    .map(r => ({ value: r.id, label: `Room ${r.roomNumber}` }))

  return (
    <Modal
      opened={!!bookingId}
      onClose={onClose}
      title={
        booking ? (
          <Group gap="sm">
            <Text fw={600}>{booking.bookingCode}</Text>
            <Badge color={STATUS_COLORS[booking.status]} variant="light">
              {booking.status.replace('_', ' ')}
            </Badge>
          </Group>
        ) : (
          'Booking'
        )
      }
      size="lg"
    >
      {isLoading || !booking ? (
        <Loader my="xl" mx="auto" display="block" />
      ) : (
        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details" leftSection={<User size={14} />}>
              Details &amp; Actions
            </Tabs.Tab>
            <Tabs.Tab value="payments" leftSection={<CreditCard size={14} />}>
              Payments &amp; Refunds
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="sm">
                <Card withBorder padding="sm" radius="md">
                  <Group gap="xs" mb={4}>
                    <User size={14} className="text-surface-500" />
                    <Text size="xs" c="dimmed" fw={600}>
                      GUEST
                    </Text>
                  </Group>
                  <Text size="sm">
                    {booking.guestFirstName} {booking.guestLastName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {booking.guestEmail}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {booking.guestPhone}
                  </Text>
                </Card>
                <Card withBorder padding="sm" radius="md">
                  <Group gap="xs" mb={4}>
                    <Calendar size={14} className="text-surface-500" />
                    <Text size="xs" c="dimmed" fw={600}>
                      STAY
                    </Text>
                  </Group>
                  <Text size="sm">
                    <Text component="span" fw={500}>
                      {formatDate(booking.checkInDate)}
                    </Text>
                    <Text component="span" c="dimmed" mx={6}>
                      →
                    </Text>
                    <Text component="span" fw={500}>
                      {formatDate(booking.checkOutDate)}
                    </Text>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatStayDuration(booking.checkInDate, booking.checkOutDate)}
                    {' · '}
                    {booking.numAdults} adult{booking.numAdults !== 1 ? 's' : ''}
                    {booking.numChildren > 0 && `, ${booking.numChildren} child${booking.numChildren !== 1 ? 'ren' : ''}`}
                    {(booking.numChildrenUnder4 ?? 0) > 0 && `, ${booking.numChildrenUnder4} aged 3 and under`}
                    {booking.numRooms > 0 && `, ${booking.numRooms} room${booking.numRooms !== 1 ? 's' : ''}`}
                  </Text>
                  {booking.roomNumbers.length > 0 && (
                    <Text size="xs" c="dimmed" mt={2}>
                      Room{booking.roomNumbers.length > 1 ? 's' : ''}: {booking.roomNumbers.join(', ')}
                    </Text>
                  )}
                </Card>
                <Card withBorder padding="sm" radius="md">
                  <Group gap="xs" mb={4}>
                    <Wallet size={14} className="text-surface-500" />
                    <Text size="xs" c="dimmed" fw={600}>
                      PAYMENT
                    </Text>
                  </Group>
                  <Text size="sm">
                    Subtotal: {booking.subtotal} {booking.currency}
                  </Text>
                  <Text size="sm">
                    Paid: {booking.amountPaid} - Balance: {booking.balanceDue}
                  </Text>
                </Card>
                {booking.specialRequests && (
                  <Card withBorder padding="sm" radius="md">
                    <Text size="xs" c="dimmed" fw={600} mb={4}>
                      SPECIAL REQUESTS
                    </Text>
                    <Text size="sm">{booking.specialRequests}</Text>
                  </Card>
                )}
              </SimpleGrid>

              <Divider label="Status actions" labelPosition="left" />
              <Group>
                {BOOKING_TRANSITIONS[booking.status]?.length === 0 ? (
                  <Text size="sm" c="dimmed">No further transitions available.</Text>
                ) : (
                  BOOKING_TRANSITIONS[booking.status]?.map((s: BookingStatus) => (
                    <Button
                      key={s}
                      size="xs"
                      color={s === 'cancelled' || s === 'no_show' ? 'red' : 'secondary'}
                      loading={updateStatus.isPending}
                      onClick={() => handleStatusChange(s)}
                    >
                      Mark {s.replace('_', ' ')}
                    </Button>
                  ))
                )}
              </Group>

              {Number(booking.balanceDue) > 0 && (
                <>
                  <Divider label="Collect outstanding balance" labelPosition="left" />
                  <Card withBorder padding="sm" radius="md" className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                    <Text size="sm" fw={600} className="text-orange-800 dark:text-orange-300">
                      Balance due: {booking.balanceDue} {booking.currency}
                    </Text>

                    <Stack gap="xs" mt="sm">
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase">Option A - Send M-Pesa prompt</Text>
                      {!balancePushSent ? (
                        <Group gap="xs">
                          <TextInput
                            placeholder="M-Pesa phone number"
                            value={balancePhone}
                            onChange={(e) => setBalancePhone(e.currentTarget.value)}
                            size="xs"
                            className="flex-1"
                          />
                          <Button size="xs" onClick={handleSendBalancePush} loading={initiateStkPush.isPending} disabled={!balancePhone}>
                            Send Prompt
                          </Button>
                        </Group>
                      ) : (
                        <Group gap="xs">
                          {!balancePaymentStatus || balancePaymentStatus.status === 'initiated' || balancePaymentStatus.status === 'pending' ? (
                            <Text size="xs" c="dimmed">Waiting for guest to complete payment on their phone...</Text>
                          ) : balancePaymentStatus.status === 'completed' ? (
                            <Text size="xs" c="green" fw={600}>Balance paid - receipt {balancePaymentStatus.mpesaReceiptNumber}</Text>
                          ) : (
                            <Group gap="xs">
                              <Text size="xs" c="red">Payment failed.</Text>
                              <Button size="xs" variant="subtle" onClick={() => { setBalancePushSent(false); setBalancePushError(null) }}>Try Again</Button>
                            </Group>
                          )}
                        </Group>
                      )}
                      {balancePushError && <Text size="xs" c="red">{balancePushError}</Text>}

                      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="xs">Option B - Record cash collected</Text>
                      <Group gap="xs">
                        <TextInput
                          placeholder={`Up to ${booking.balanceDue}`}
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.currentTarget.value)}
                          size="xs"
                          w={140}
                        />
                        <Button size="xs" color="green" onClick={handleRecordCash} loading={recordCashPayment.isPending} disabled={!cashAmount}>
                          Record Cash
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                </>
              )}

              <Divider label="Assign physical room" labelPosition="left" />
              <Group gap="xs">
                <DoorOpen size={16} className="text-surface-500" />
                <Select
                  placeholder="Select a room"
                  data={roomOptions}
                  value={roomId}
                  onChange={(v) => setRoomId(v ?? '')}
                  className="flex-1"
                  size="sm"
                />
                <Button
                  size="xs"
                  onClick={handleAssignRoom}
                  loading={assignRoom.isPending}
                  disabled={!roomId}
                >
                  Assign
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="payments" pt="md">
            <Stack gap="sm">
              {!payments || payments.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No payments yet.
                </Text>
              ) : (
                payments.map(p => (
                  <Card key={p.id} withBorder padding="sm" radius="md">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={500} tt="capitalize">
                          {p.type} - {p.amount} {p.currency}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {p.provider}
                          {p.mpesaReceiptNumber
                            ? ` · receipt ${p.mpesaReceiptNumber}`
                            : ''}
                        </Text>
                      </div>
                      <Badge
                        size="sm"
                        color={
                          p.status === 'completed'
                            ? 'green'
                            : p.status === 'failed'
                            ? 'red'
                            : 'yellow'
                        }
                        variant="light"
                      >
                        {p.status}
                      </Badge>
                    </Group>

                    {p.status === 'completed' && !createdRefunds[p.id] && (
                      <Group gap="xs" mt="sm">
                        <TextInput
                          size="xs"
                          placeholder="Amount"
                          w={100}
                          onChange={(e) => {
                            const value = e.currentTarget.value
                            setRefundInputs(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id] || {}, amount: value, reason: prev[p.id]?.reason || '' }
                            }))
                          }}
                        />
                        <TextInput
                          size="xs"
                          placeholder="Reason"
                          className="flex-1"
                          onChange={(e) => {
                            const value = e.currentTarget.value
                            setRefundInputs(prev => ({
                              ...prev,
                              [p.id]: { ...prev[p.id] || {}, reason: value, amount: prev[p.id]?.amount || '' }
                            }))
                          }}
                        />
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => handleRefund(p.id)}
                          loading={requestRefund.isPending}
                        >
                          Refund
                        </Button>
                      </Group>
                    )}

                    {createdRefunds[p.id] && (
                      <Group gap="xs" mt="sm">
                        <Badge size="sm" variant="dot">
                          {createdRefunds[p.id].status}
                        </Badge>
                        {createdRefunds[p.id].status === 'requested' && (
                          <>
                            <Button
                              size="xs"
                              color="green"
                              onClick={() =>
                                handleRefundStatus(p.id, 'completed')
                              }
                            >
                              Mark completed
                            </Button>
                            <Button
                              size="xs"
                              color="red"
                              variant="outline"
                              onClick={() =>
                                handleRefundStatus(p.id, 'rejected')
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Group>
                    )}
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}
    </Modal>
  )
}