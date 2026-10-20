import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Clock, Hash, User, Wine } from 'lucide-react'
import { useState } from 'react'
import { useBarPending, useIssueBarLine } from '@/hooks/useOrders'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { getErrorMessage } from '@/lib/api/client'
import { formatCurrency, formatDateTime, formatPacks } from '@/lib/utils/format'
import type { BarPendingLine } from '@/lib/api/orders'
import { OpenBarSales } from '@/components/bar/OpenBarSales'

export const Route = createFileRoute('/_app/bar/orders')({
  component: BarOrdersPage
})

function BarOrdersPage () {
  const [page] = useState(1)
  const query = useBarPending(page, 50)
  const issue = useIssueBarLine()

  const handleIssue = async (orderLineId: string, itemName: string) => {
    try {
      const res = await issue.mutateAsync(orderLineId)
      const left = (res.issued || [])
        .map(x => `${x.stock_name}: ${Number(x.remaining).toLocaleString('en-KE')} left`)
        .join(' · ')
      notifications.show({
        color: 'green',
        title: `${itemName} issued`,
        message: left || 'Issued from stock.'
      })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const lines = query.data?.data ?? []

  return (
    <>
      <PageHeader title='Bar Orders' subtitle='Drinks to pour, and sales still to bill' />

      <OpenBarSales />
      <Text fw={700} mb={8}>To pour</Text>

      {query.isLoading ? (
        <Center py='xl'>
          <Loader />
        </Center>
      ) : lines.length === 0 ? (
        <EmptyState
          title='Nothing to pour'
          description='New drink orders from the waiters and your counter sales appear here.'
        />
      ) : (
        <Stack gap='sm'>
          {lines.map(line => (
            <Card key={line.order_line_id} withBorder radius='md' p='md'>
              <Group justify='space-between' wrap='nowrap' align='flex-start' gap='sm'>
                <Group gap='sm' wrap='nowrap' align='flex-start' style={{ minWidth: 0 }}>
                  <ThemeIcon
                    size='lg'
                    radius='md'
                    variant='light'
                    style={{ color: '#862E9C', backgroundColor: '#F8F0FC', flexShrink: 0 }}
                  >
                    <Wine size={18} />
                  </ThemeIcon>
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={700}>
                      {line.menu_item_name} × {line.quantity}
                    </Text>
                    <Text size='sm' fw={600} style={{ color: '#862E9C' }}>
                      {formatCurrency(parseFloat(line.unit_price) * line.quantity)}
                    </Text>
                  </Box>
                </Group>
                <Button
                  radius='md'
                  onClick={() => handleIssue(line.order_line_id, line.menu_item_name)}
                  loading={issue.isPending && issue.variables === line.order_line_id}
                  style={{ backgroundColor: '#862E9C', flexShrink: 0 }}
                >
                  Issue
                </Button>
              </Group>

              <StockLine line={line} />

              <Group gap='md' mt={8} wrap='wrap'>
                <Text size='xs' c='dimmed'>
                  {line.order_ref}
                </Text>
                {line.table_number && (
                  <Group gap={4} wrap='nowrap'>
                    <Hash size={11} color='#868E96' />
                    <Text size='xs' c='dimmed'>
                      Table {line.table_number}
                    </Text>
                  </Group>
                )}
                {line.waiter_name && (
                  <Group gap={4} wrap='nowrap'>
                    <User size={11} color='#868E96' />
                    <Text size='xs' c='dimmed'>
                      {line.waiter_name}
                    </Text>
                  </Group>
                )}
                <Group gap={4} wrap='nowrap'>
                  <Clock size={11} color='#868E96' />
                  <Text size='xs' c='dimmed'>
                    {formatDateTime(line.created_at)}
                  </Text>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </>
  )
}


// Shows how many of each drink are on the shelf before it is issued
function StockLine ({ line }: { line: BarPendingLine }) {
  if (!line.stock?.length) return null
  return (
    <Group gap={6} mt={10} wrap='wrap'>
      {line.stock.map(st => {
        const need = st.per_unit * line.quantity
        const short = st.in_stock < need
        const left = st.in_stock - need
        const packs = formatPacks(st.in_stock, st.pack_size, st.pack_label)
        const color = short ? '#E03131' : left <= 5 ? '#F08C00' : '#2F9E44'
        return (
          <Badge
            key={st.name}
            variant='light'
            size='md'
            style={{
              color,
              backgroundColor: `${color}1A`,
              textTransform: 'none',
              height: 'auto',
              whiteSpace: 'normal',
              paddingTop: 3,
              paddingBottom: 3
            }}
          >
            {short
              ? `${st.name}: only ${st.in_stock} in stock`
              : `${st.name}: ${st.in_stock} in stock${packs ? ` (${packs})` : ''} → ${left} after`}
          </Badge>
        )
      })}
    </Group>
  )
}
