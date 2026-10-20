import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text
} from '@mantine/core'
import dayjs from 'dayjs'
import { ArrowRight, Banknote, GlassWater, Receipt, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatusDot } from '@/components/StatusDot'
import {
  BAR,
  DrinkCard,
  MovementsDrawer,
  kes,
  useStockChanges
} from '@/components/bar/BarStockParts'
import { useBarStock } from '@/hooks/useBarStock'
import { useBarPending } from '@/hooks/useOrders'
import { useCurrentHandover } from '@/hooks/usePayments'
import { formatCurrency, formatPacks } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/useAuth'

export const Route = createFileRoute('/_app/bar/')({
  component: BarDashboard
})

function BarDashboard () {
  const auth = useAuth()
  const stock = useBarStock()
  const pending = useBarPending(1, 50)
  const handover = useCurrentHandover(!auth.hasRole('md', 'admin', 'auditor', 'accountant'))
  const [openId, setOpenId] = useState<string | null>(null)

  const data = stock.data
  const changes = useStockChanges(data?.drinks)
  const s = data?.summary
  const drinks = data?.drinks ?? []
  const attention = drinks.filter(d => d.status !== 'ok')
  // Most recently sold first
  const recent = [...drinks]
    .filter(d => d.sold > 0)
    .sort((a, b) => (b.last_sold_at || '').localeCompare(a.last_sold_at || ''))
    .slice(0, 6)
  const pendingCount = pending.data?.meta?.total ?? pending.data?.data.length ?? 0
  const canIssue = auth.hasPermission('bar.issue') || auth.hasPermission('stock.issue')

  return (
    <Stack gap='md' pb='xl'>
      <PageHeader
        title='Bar Dashboard'
        subtitle={
          data
            ? `Today since ${dayjs(data.period.start).format('HH:mm')} · updates live`
            : 'Your bar at a glance'
        }
        actions={
          canIssue && (
            <Button
              component={Link}
              to='/bar/orders'
              leftSection={<Receipt size={16} />}
              style={{ backgroundColor: BAR.wine }}
            >
              Bar orders{pendingCount ? ` (${pendingCount})` : ''}
            </Button>
          )
        }
      />

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing='sm'>
        <Stat
          icon={<GlassWater size={16} />}
          label='Drinks sold today'
          value={s ? Number(s.sold).toLocaleString('en-KE') : '…'}
          hint={s ? kes(s.revenue) : ''}
          color={BAR.wine}
        />
        <Stat
          icon={<Receipt size={16} />}
          label='Waiting to issue'
          value={String(pendingCount)}
          hint={pendingCount ? 'Drinks ordered, not yet poured' : 'All caught up'}
          color={pendingCount ? BAR.orange : BAR.muted}
        />
        <Stat
          icon={<TriangleAlert size={16} />}
          label='Low / out'
          value={s ? `${s.low} / ${s.out}` : '…'}
          hint='At or below reorder level'
          color={s?.out ? BAR.red : s?.low ? BAR.orange : BAR.muted}
        />
        <Stat
          icon={<Banknote size={16} />}
          label='Cash pending'
          value={handover.data ? formatCurrency(handover.data.cash_pending) : '-'}
          hint='Not yet dropped'
          color={BAR.navy}
        />
      </SimpleGrid>

      {!data ? (
        <Group justify='center' py='xl'>
          <Loader />
        </Group>
      ) : (
        <>
          {attention.length > 0 && (
            <Card withBorder radius='md' p='md'>
              <Group gap={8} mb='xs' wrap='nowrap'>
                <StatusDot color={attention.some(d => d.status === 'out') ? BAR.red : BAR.orange} size={10} />
                <Text fw={600} style={{ color: BAR.navy }}>
                  Needs restocking
                </Text>
              </Group>
              <Stack gap={6}>
                {attention.map(d => (
                  <Group key={d.id} justify='space-between' wrap='nowrap'>
                    <Group gap={8} wrap='nowrap' style={{ minWidth: 0 }}>
                      <StatusDot color={d.status === 'out' ? BAR.red : BAR.orange} />
                      <Text size='sm' truncate>
                        {d.name}
                      </Text>
                    </Group>
                    <Group gap={6} wrap='nowrap'>
                      <Text size='sm' fw={700} style={{ color: d.status === 'out' ? BAR.red : BAR.orange }}>
                        {d.balance} left
                      </Text>
                      {formatPacks(d.balance, d.pack_size, d.pack_label) && (
                        <Text size='xs' c='dimmed'>
                          ({formatPacks(d.balance, d.pack_size, d.pack_label)})
                        </Text>
                      )}
                      <Badge
                        size='xs'
                        variant='light'
                        style={{
                          color: d.status === 'out' ? BAR.red : BAR.orange,
                          backgroundColor: d.status === 'out' ? '#E031311A' : '#F08C001A'
                        }}
                      >
                        {d.status === 'out' ? 'Out' : `Reorder at ${d.reorder_level}`}
                      </Badge>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}

          <Group justify='space-between' mt='xs'>
            <Text fw={600} style={{ color: BAR.navy }}>
              {recent.length ? 'Just sold' : 'Stock'}
            </Text>
            <Link to='/bar/stock' style={{ textDecoration: 'none' }}>
              <Group gap={4}>
                <Text size='sm' fw={500} style={{ color: BAR.wine }}>
                  All bar stock
                </Text>
                <ArrowRight size={14} color={BAR.wine} />
              </Group>
            </Link>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='sm'>
            {(recent.length ? recent : drinks.slice(0, 6)).map(d => (
              <DrinkCard
                key={d.id}
                drink={d}
                isToday
                change={changes[d.id]}
                showProperty={auth.hasRole('md', 'admin', 'auditor', 'accountant')}
                onOpen={() => setOpenId(d.id)}
              />
            ))}
          </SimpleGrid>
        </>
      )}

      <MovementsDrawer drinkId={openId} onClose={() => setOpenId(null)} />
    </Stack>
  )
}

function Stat ({
  icon,
  label,
  value,
  hint,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  color: string
}) {
  return (
    <Card withBorder radius='md' p='md'>
      <Group justify='space-between' wrap='nowrap' gap={4}>
        <Group gap={6} wrap='nowrap' style={{ minWidth: 0 }}>
          <StatusDot color={color} />
          <Text size='xs' c='dimmed' fw={600} tt='uppercase' truncate>
            {label}
          </Text>
        </Group>
        <Box visibleFrom='sm' style={{ color }}>
          {icon}
        </Box>
      </Group>
      <Text fw={800} fz={{ base: 20, sm: 24 }} style={{ color: BAR.navy, whiteSpace: 'nowrap' }}>
        {value}
      </Text>
      <Text size='xs' c='dimmed'>
        {hint}
      </Text>
    </Card>
  )
}
