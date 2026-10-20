import { Fragment } from 'react'

import {
  Badge,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton
} from '@mantine/core'
import { Lock, Pencil, Plus, Utensils } from 'lucide-react'
import { WeekResponse, StaffMenuSchedule } from '@/lib/api/staffMenu'

interface Props {
  week: WeekResponse
  onEditSlot: (
    dayOfWeek: number,
    mealType: 'breakfast' | 'lunch' | 'supper',
    existing: StaffMenuSchedule | null
  ) => void
  readOnly?: boolean
}

const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]
const meals: Array<'breakfast' | 'lunch' | 'supper'> = [
  'breakfast',
  'lunch',
  'supper'
]
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', supper: 'Supper' }

function SlotCell ({
  schedule,
  onClick,
  readOnly
}: {
  schedule: StaffMenuSchedule | null
  onClick: () => void
  readOnly?: boolean
}) {
  const hasItems = schedule && schedule.items && schedule.items.length > 0
  const isLocked = schedule?.status === 'locked'

  if (!hasItems) {
    return (
      <UnstyledButton
        onClick={onClick}
        disabled={readOnly}
        style={{ width: '100%' }}
      >
        <Card
          withBorder
          radius='md'
          p='xs'
          style={{
            minHeight: 72,
            background: 'var(--mantine-color-gray-0)',
            borderStyle: 'dashed'
          }}
        >
          <Group gap={4} justify='center' style={{ height: '100%' }}>
            <Plus size={14} color='var(--mantine-color-gray-5)' />
            <Text size='xs' c='dimmed'>
              {readOnly ? 'Empty' : 'Add'}
            </Text>
          </Group>
        </Card>
      </UnstyledButton>
    )
  }

  return (
    <UnstyledButton
      onClick={onClick}
      disabled={readOnly}
      style={{ width: '100%' }}
    >
      <Card
        withBorder
        radius='md'
        p='xs'
        style={{
          minHeight: 72,
          background: isLocked
            ? 'var(--mantine-color-red-0)'
            : 'var(--mantine-color-blue-0)',
          borderColor: isLocked
            ? 'var(--mantine-color-red-3)'
            : 'var(--mantine-color-blue-2)'
        }}
      >
        <Stack gap={4}>
          <Group justify='space-between' gap={4} wrap='nowrap'>
            <Group gap={4} wrap='nowrap' style={{ minWidth: 0 }}>
              <ThemeIcon
                size='xs'
                variant='transparent'
                color={isLocked ? 'red' : 'blue'}
              >
                {isLocked ? <Lock size={11} /> : <Pencil size={11} />}
              </ThemeIcon>
              <Text size='xs' fw={600} truncate>
                {schedule.items!.length} item
                {schedule.items!.length === 1 ? '' : 's'}
              </Text>
            </Group>
          </Group>
          <Stack gap={1}>
            {schedule.items!.slice(0, 2).map(item => (
              <Text
                key={item.id}
                size='xs'
                c='dimmed'
                truncate
                style={{ lineHeight: 1.3 }}
              >
                {item.stock_item?.item?.name || '-'} ·{' '}
                {parseFloat(item.quantity)} {item.unit?.code}
              </Text>
            ))}
            {schedule.items!.length > 2 && (
              <Text size='xs' c='dimmed' fs='italic'>
                +{schedule.items!.length - 2} more
              </Text>
            )}
          </Stack>
        </Stack>
      </Card>
    </UnstyledButton>
  )
}

export function WeekGrid ({ week, onEditSlot, readOnly }: Props) {
  return (
    <>
      {/* Mobile + small tablet: stacked list per day */}
      <Box hiddenFrom='lg'>
        <Stack gap='md'>
          {week.grid.map(day => (
            <Fragment key={day.day_of_week}>
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <Text size='sm' fw={600}>
                  {dayNames[day.day_of_week]}
                </Text>
              </Box>
              {day.meals.map(cell => (
                <SlotCell
                  key={`${day.day_of_week}-${cell.meal_type}`}
                  schedule={cell.schedule}
                  onClick={() =>
                    onEditSlot(day.day_of_week, cell.meal_type, cell.schedule)
                  }
                  readOnly={readOnly}
                />
              ))}
            </Fragment>
          ))}
        </Stack>
      </Box>

      {/* Large screens: grid table */}
      <Box visibleFrom='lg'>
        <Card withBorder radius='md' p='md'>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 1fr 1fr',
              gap: 8
            }}
          >
            <Box />
            {meals.map(m => (
              <Text
                key={m}
                size='xs'
                fw={700}
                c='dimmed'
                tt='uppercase'
                ta='center'
                style={{ letterSpacing: 0.5 }}
              >
                {mealLabels[m]}
              </Text>
            ))}

            {week.grid.map(day => (
              <>
                <Box
                  key={`label-${day.day_of_week}`}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Text size='sm' fw={600}>
                    {dayNames[day.day_of_week]}
                  </Text>
                </Box>
                {day.meals.map(cell => (
                  <SlotCell
                    key={`${day.day_of_week}-${cell.meal_type}`}
                    schedule={cell.schedule}
                    onClick={() =>
                      onEditSlot(day.day_of_week, cell.meal_type, cell.schedule)
                    }
                    readOnly={readOnly}
                  />
                ))}
              </>
            ))}
          </Box>
        </Card>
      </Box>
    </>
  )
}
