import { createFileRoute, Link } from '@tanstack/react-router'
import { Button, Card, Group, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useException, useInvestigateException } from '@/hooks/useAdmin'
import { useAuth } from '@/lib/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { StatBadge } from '@/components/StatBadge'
import { ResolveExceptionModal } from '@/components/exceptions/ResolveExceptionModal'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'
import { getErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_app/exceptions/$id')({
  component: ExceptionDetailPage
})

function ExceptionDetailPage () {
  const { id } = Route.useParams()
  const auth = useAuth()
  const query = useException(id)
  const investigate = useInvestigateException(id)
  const [open, { open: openModal, close }] = useDisclosure(false)

  if (query.isLoading) return <LoadingState />
  if (query.error || !query.data)
    return <EmptyState title='Exception not found' />

  const e = query.data
  const canInvestigate =
    ['open', 'escalated'].includes(e.status) &&
    auth.hasPermission('exception.resolve')
  const canResolve =
    ['open', 'investigating', 'escalated'].includes(e.status) &&
    auth.hasPermission('exception.resolve')

  const handleInvestigate = async () => {
    try {
      await investigate.mutateAsync({ notes: 'Investigation started' })
      notifications.show({
        color: 'blue',
        title: 'Marked as investigating',
        message: 'The exception is now under investigation.'
      })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  return (
    <>
      <Link to='/exceptions' style={{ textDecoration: 'none' }}>
        <Button variant='subtle' leftSection={<ArrowLeft size={16} />} mb='sm'>
          Back to exceptions
        </Button>
      </Link>

      <PageHeader
        title={e.exception_ref}
        subtitle={e.exception_type.replace(/_/g, ' ')}
        actions={
          <Group>
            <StatBadge value={e.severity} />
            <StatBadge value={e.status} />
            {canInvestigate && (
              <Button
                variant='light'
                onClick={handleInvestigate}
                loading={investigate.isPending}
              >
                Mark Investigating
              </Button>
            )}
            {canResolve && (
              <Button
                leftSection={<CheckCircle size={16} />}
                onClick={openModal}
              >
                Resolve
              </Button>
            )}
          </Group>
        }
      />

      <Card withBorder>
        <Stack>
          <div>
            <Text size='sm' fw={500} c='dimmed'>
              Description
            </Text>
            <Text size='sm'>{e.description}</Text>
          </div>
          {e.amount && (
            <Group justify='space-between'>
              <Text size='sm' c='dimmed'>
                Amount
              </Text>
              <Text size='sm'>{formatCurrency(e.amount)}</Text>
            </Group>
          )}
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Created
            </Text>
            <Text size='sm'>{formatDateTime(e.created_at)}</Text>
          </Group>
          {e.assigned_to_user && (
            <Group justify='space-between'>
              <Text size='sm' c='dimmed'>
                Assigned To
              </Text>
              <Text size='sm'>{e.assigned_to_user.full_name}</Text>
            </Group>
          )}
          {e.status === 'resolved' && (
            <div>
              <Text size='sm' fw={500} c='dimmed'>
                Resolution
              </Text>
              <Text size='sm'>{e.resolution}</Text>
              <Text size='xs' c='dimmed' mt={4}>
                By {e.resolved_by_user?.full_name} •{' '}
                {formatDateTime(e.resolved_at)}
              </Text>
            </div>
          )}
        </Stack>
      </Card>

      <ResolveExceptionModal opened={open} onClose={close} exceptionId={id} />
    </>
  )
}
