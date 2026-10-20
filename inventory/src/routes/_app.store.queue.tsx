import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge, Button, Card, Group, Stack, Text, TextInput } from '@mantine/core'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw, Search } from 'lucide-react'
import { useStoreQueue } from '@/hooks/useStore'
import { PageHeader } from '@/components/PageHeader'
import { StatusDot } from '@/components/StatusDot'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTime, formatQty } from '@/lib/utils/format'
import { kitchenName } from '@/lib/utils/menuName'

export const Route = createFileRoute('/_app/store/queue')({
  component: StoreQueuePage
})

// Waiting time → colour: under 15 min fine, 15–30 getting late, over 30 late
const ageColor = (min: number) => (min >= 30 ? '#E03131' : min >= 15 ? '#F08C00' : '#2F9E44')
const ageText = (min: number) =>
  min < 1 ? 'just now' : min < 60 ? `${min} min` : min < 1440 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${Math.floor(min / 1440)} day(s)`

function StoreQueuePage () {
  const navigate = useNavigate()
  const query = useStoreQueue({ limit: 100 })
  const [q, setQ] = useState('')
  const [now, setNow] = useState(() => Date.now())

  // New orders appear without pressing Refresh
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      query.refetch()
    }, 20_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orders = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...(query.data?.data ?? [])]
      .filter(
        o =>
          !needle ||
          [o.order_ref, o.table_number, o.customer_code, o.waiter?.full_name]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(needle))
      )
      // Newest first: what just came in sits at the top
      .sort((a, b) => dayjs(b.latest_at ?? b.created_at).valueOf() - dayjs(a.latest_at ?? a.created_at).valueOf())
  }, [query.data, q])

  if (query.isLoading) return <LoadingState />

  const late = orders.filter(o => (now - dayjs(o.latest_at ?? o.created_at).valueOf()) / 60000 >= 30).length

  return (
    <>
      <PageHeader
        title='Store Queue'
        subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'} waiting${late ? ` · ${late} waiting over 30 min` : ''} · updates every 20 s`}
        actions={
          <Button variant='light' leftSection={<RefreshCw size={16} />} onClick={() => query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
        }
      />

      <TextInput
        placeholder='Search table, order or waiter'
        leftSection={<Search size={14} />}
        value={q}
        onChange={e => setQ(e.currentTarget.value)}
        mb='md'
        maw={360}
      />

      {orders.length === 0 ? (
        <EmptyState
          title={q ? 'No orders match' : 'Nothing to dispatch'}
          description={q ? 'Try another table or order number.' : 'New orders appear here as waiters place them.'}
        />
      ) : (
        <Stack gap='md'>
          {orders.map(o => {
            const waited = Math.max(0, Math.floor((now - dayjs(o.latest_at ?? o.created_at).valueOf()) / 60000))
            const color = ageColor(waited)
            return (
              <Card key={o.order_id} withBorder padding='md' radius='md' >
                <Group justify='space-between' align='flex-start' mb='sm' wrap='wrap' gap='sm'>
                  <Stack gap={2}>
                    <Group gap='xs' wrap='wrap'>
                      <StatusDot color={color} size={10} />
                      <Text fw={700}>Table {o.table_number || '-'}</Text>
                      <Badge variant='light'>{o.order_ref}</Badge>
                      <Badge variant='filled' style={{ backgroundColor: color }}>
                        Waiting {ageText(waited)}
                      </Badge>
                    </Group>
                    <Text size='xs' c='dimmed'>
                      {o.waiter?.full_name || 'Unknown waiter'} · ordered {formatDateTime(o.latest_at ?? o.created_at)} · {o.customer_code}
                    </Text>
                  </Stack>
                  <Button
                    rightSection={<ArrowRight size={16} />}
                    onClick={() => navigate({ to: '/store/dispatch/$orderId', params: { orderId: o.order_id } })}
                  >
                    Review & dispatch
                  </Button>
                </Group>

                <Stack gap={6} mt='xs'>
                  {o.lines.map(l => {
                    const k = kitchenName(l.menu_item_name || '-', l.notes)
                    return (
                      <Group key={l.order_line_id} gap='sm' wrap='nowrap' align='flex-start'>
                        <Text size='sm' fw={800} w={48} ta='right' style={{ flexShrink: 0 }}>
                          {formatQty(l.quantity)} ×
                        </Text>
                        <Stack gap={0}>
                          <Text component="div" size='sm' fw={500}>
                            {k.name}
                            {k.style && (
                              <Badge ml={8} size='sm' color='orange' variant='light' styles={{ root: { maxWidth: 'none' } }}>
                                {k.style}
                              </Badge>
                            )}
                          </Text>
                          {k.rest && (
                            <Text size='xs' c='dimmed'>
                              Note: {k.rest}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    )
                  })}
                </Stack>
              </Card>
            )
          })}
        </Stack>
      )}
    </>
  )
}
