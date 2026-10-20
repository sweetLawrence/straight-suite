import { useState } from 'react'
import { Title, Text, Card, Group, Badge, Button, Stack, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { AlertCircle } from 'lucide-react'
import {
  usePendingManualPayments,
  useVerifyManualPayment,
  useUnmatchedPayments,
  useAssignUnmatchedPayment,
//   useRegisterC2bUrls
} from '../features/payments/hooks'

// import { useAuthStore } from '../stores/authStore'

export default function PaymentsPage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} className="text-primary-700 dark:text-primary-200">Payments</Title>
        <Text size="sm" c="dimmed">Manual payments awaiting verification, and money received that couldn't be auto-matched.</Text>
      </div>

      <PendingManualPaymentsSection />
      <UnmatchedPaymentsSection />
    </Stack>
  )
}

function PendingManualPaymentsSection() {
  const { data: payments, isLoading } = usePendingManualPayments()
  const verify = useVerifyManualPayment()

  function handleAction(paymentId: string, action: 'confirm' | 'reject') {
    verify.mutate(
      { paymentId, action },
      {
        onSuccess: () => notifications.show({ message: action === 'confirm' ? 'Payment confirmed.' : 'Payment rejected.', color: action === 'confirm' ? 'green' : 'red' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  if (isLoading) return null

  return (
    <Stack gap="sm">
      <Text fw={700} className="text-primary-700 dark:text-primary-200">Needs Verification</Text>
      {!payments || payments.length === 0 ? (
        <Text c="dimmed" size="sm">Nothing waiting on verification right now.</Text>
      ) : (
        payments.map((p) => (
          <Card key={p.id} withBorder radius="md" padding="md">
            <Group justify="space-between" wrap="wrap">
              <div>
                <Group gap="xs">
                  <AlertCircle size={16} className="text-accent-600" />
                  <Text fw={600} tt="capitalize">{p.type} payment - {p.amount} {p.currency}</Text>
                </Group>
                <Text size="sm" c="dimmed" mt={4}>Phone: {p.phoneNumber}</Text>
                <Text size="sm" c="dimmed">Guest-entered code: <b className="font-mono">{p.mpesaReceiptNumber}</b></Text>
              </div>
              <Group>
                <Badge color="yellow" variant="light">pending verification</Badge>
                <Button size="xs" color="green" onClick={() => handleAction(p.id, 'confirm')} loading={verify.isPending}>
                  Confirm - Matches Statement
                </Button>
                <Button size="xs" color="red" variant="outline" onClick={() => handleAction(p.id, 'reject')} loading={verify.isPending}>
                  Reject
                </Button>
              </Group>
            </Group>
          </Card>
        ))
      )}
    </Stack>
  )
}

function UnmatchedPaymentsSection() {
  const { data: unmatched, isLoading } = useUnmatchedPayments()
  const assign = useAssignUnmatchedPayment()
  const [bookingIdInputs, setBookingIdInputs] = useState<Record<string, string>>({})

  function handleAssign(paymentId: string) {
    const bookingId = bookingIdInputs[paymentId]
    if (!bookingId) return
    assign.mutate(
      { paymentId, bookingId },
      {
        onSuccess: () => notifications.show({ message: 'Payment linked to booking.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  if (isLoading) return null
  if (!unmatched || unmatched.length === 0) return null

  return (
    <Stack gap="sm">
      <Text fw={700} className="text-red-700">Unmatched Payments - money received, no booking match</Text>
      {unmatched.map((p) => (
        <Card key={p.id} withBorder radius="md" padding="md" className="border-red-300 bg-red-50">
          <Text fw={600}>{p.amount} {p.currency} - from {p.phoneNumber}</Text>
          <Text size="sm" c="dimmed">M-Pesa receipt: {p.mpesaReceiptNumber}</Text>
          <Group mt="sm">
            <TextInput
              placeholder="Booking ID (UUID) to link this to"
              value={bookingIdInputs[p.id] ?? ''}
              onChange={(e) => setBookingIdInputs((prev) => ({ ...prev, [p.id]: e.currentTarget.value }))}
              className="flex-1"
            />
            <Button size="xs" color="green" onClick={() => handleAssign(p.id)} loading={assign.isPending}>
              Link to Booking
            </Button>
          </Group>
        </Card>
      ))}
    </Stack>
  )
}