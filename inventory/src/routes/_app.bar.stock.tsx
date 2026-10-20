import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Button,
  Card,
  Group,
  Loader,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import dayjs from 'dayjs'
import { Crown, Search } from 'lucide-react'
import { HouseUseModal } from '@/components/stock/HouseUseModal'
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
import { useProperties } from '@/hooks/useCore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuth } from '@/lib/auth/useAuth'
import { getErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_app/bar/stock')({
  component: BarStockPage
})

type When = 'today' | 'yesterday' | 'date'
type Filter = 'all' | 'sold' | 'low' | 'out'

function BarStockPage () {
  const auth = useAuth()
  const isMobile = useIsMobile()
  const isGroupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant')

  const [when, setWhen] = useState<When>('today')
  const [date, setDate] = useState<string | null>(
    dayjs().subtract(2, 'day').format('YYYY-MM-DD')
  )
  const [propertyId, setPropertyId] = useState<string>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [houseOpen, setHouseOpen] = useState(false)
  const canHouse = auth.hasPermission('stock.house_use')

  const day =
    when === 'yesterday'
      ? dayjs().subtract(1, 'day').format('YYYY-MM-DD')
      : when === 'date'
      ? date || undefined
      : undefined

  const stock = useBarStock({
    from: day,
    to: day,
    property_id: isGroupLevel && propertyId !== 'all' ? propertyId : undefined
  })
  const properties = useProperties(1, 20)
  const data = stock.data
  const changes = useStockChanges(data?.period.is_today ? data.drinks : undefined)
  const isToday = !!data?.period.is_today

  const drinks = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data?.drinks ?? []).filter(
      d =>
        (filter === 'all' ||
          (filter === 'sold' && d.sold > 0) ||
          d.status === filter) &&
        (!needle ||
          d.name.toLowerCase().includes(needle) ||
          d.code.toLowerCase().includes(needle))
    )
  }, [data, filter, q])

  const s = data?.summary
  const periodText = data
    ? isToday
      ? `Today · since ${dayjs(data.period.start).format('HH:mm')} · updates live`
      : dayjs(data.period.from).format('dddd D MMM YYYY')
    : ''

  return (
    <Stack gap='md' pb='xl'>
      <PageHeader
        title='Bar Stock'
        subtitle={
          <>
            {periodText}
            {stock.isFetching && <Loader size={10} ml={8} />}
          </>
        }
        actions={
          canHouse ? (
            <Button
              variant='light'
              color='pink'
              leftSection={<Crown size={16} />}
              onClick={() => setHouseOpen(true)}
            >
              House use
            </Button>
          ) : undefined
        }
      />

      {/* ── Filters ── */}
      <Card withBorder radius='md' p='sm'>
        <Group gap='sm' align='flex-end' wrap='wrap'>
          <SegmentedControl
            value={when}
            onChange={v => setWhen(v as When)}
            data={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'date', label: 'Pick a day' }
            ]}
            fullWidth={isMobile}
            style={isMobile ? { width: '100%' } : undefined}
          />
          {when === 'date' && (
            <DatePickerInput
              value={date}
              onChange={v => setDate(v as string | null)}
              maxDate={dayjs().format('YYYY-MM-DD')}
              valueFormat='D MMM YYYY'
              w={isMobile ? '100%' : 170}
            />
          )}
          {isGroupLevel && (
            <Select
              value={propertyId}
              allowDeselect={false}
              onChange={v => setPropertyId(v || 'all')}
              data={[
                { value: 'all', label: 'All properties' },
                ...(properties.data?.data ?? []).map(p => ({
                  value: p.id,
                  label: p.name
                }))
              ]}
              w={isMobile ? '100%' : 210}
            />
          )}
        </Group>
      </Card>

      {stock.isError && !data ? (
        <Card withBorder p='lg'>
          <Text c='red'>{getErrorMessage(stock.error)}</Text>
        </Card>
      ) : !data || !s ? (
        <Group justify='center' py='xl'>
          <Loader />
        </Group>
      ) : (
        <>
          {/* ── Totals ── */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing='sm'>
            <Stat
              label={isToday ? 'Drinks sold today' : 'Drinks sold'}
              value={Number(s.sold).toLocaleString('en-KE')}
              hint={kes(s.revenue)}
              color={BAR.wine}
            />
            <Stat
              label='Received'
              value={Number(s.received).toLocaleString('en-KE')}
              hint={s.waste ? `${s.waste} wasted` : 'No waste'}
              color={BAR.green}
            />
            <Stat
              label='Running low'
              value={String(s.low)}
              hint={s.out ? `${s.out} out of stock` : 'None out of stock'}
              color={s.out ? BAR.red : s.low ? BAR.orange : BAR.muted}
            />
            <Stat
              label='Stock value'
              value={kes(s.value)}
              hint={`${s.drinks} drinks`}
              color={BAR.navy}
            />
          </SimpleGrid>

          {/* ── Search + quick filters ── */}
          <Group gap='sm' wrap='wrap'>
            <TextInput
              placeholder='Search drink'
              leftSection={<Search size={14} />}
              value={q}
              onChange={e => setQ(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <SegmentedControl
              value={filter}
              onChange={v => setFilter(v as Filter)}
              data={[
                { value: 'all', label: `All (${s.drinks})` },
                {
                  value: 'sold',
                  label: `Sold (${data.drinks.filter(d => d.sold > 0).length})`
                },
                { value: 'low', label: `Low (${s.low})` },
                { value: 'out', label: `Out (${s.out})` }
              ]}
            />
          </Group>

          {drinks.length === 0 ? (
            <Text c='dimmed' ta='center' py='xl'>
              No drinks match.
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='sm'>
              {drinks.map(d => (
                <DrinkCard
                  key={d.id}
                  drink={d}
                  isToday={isToday}
                  change={changes[d.id]}
                  showProperty={isGroupLevel && propertyId === 'all'}
                  onOpen={() => setOpenId(d.id)}
                />
              ))}
            </SimpleGrid>
          )}

          <Text size='xs' c='dimmed' ta='center'>
            Tap a drink to see every bottle in and out. Counts drop as soon as
            the bar issues a drink.
          </Text>
        </>
      )}

      <MovementsDrawer drinkId={openId} onClose={() => setOpenId(null)} />
      <HouseUseModal opened={houseOpen} onClose={() => setHouseOpen(false)} store='bar_store' />
    </Stack>
  )
}

function Stat ({
  label,
  value,
  hint,
  color
}: {
  label: string
  value: string
  hint: string
  color: string
}) {
  return (
    <Card withBorder radius='md' p='md'>
      <Group gap={6} wrap='nowrap'>
        <StatusDot color={color} />
        <Text size='xs' c='dimmed' fw={600} tt='uppercase' truncate>
          {label}
        </Text>
      </Group>
      <Text fw={800} fz={{ base: 20, sm: 24 }} style={{ color: BAR.navy, whiteSpace: 'nowrap' }}>
        {value}
      </Text>
      <Box>
        <Text size='xs' c='dimmed'>
          {hint}
        </Text>
      </Box>
    </Card>
  )
}
