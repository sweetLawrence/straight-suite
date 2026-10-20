import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton
} from '@mantine/core'
import { Calendar, ChevronRight, Lock, Plus, Repeat } from 'lucide-react'
import { useState } from 'react'
import { useStaffMenuWeeks } from '@/hooks/useStaffMenu'
import { useAuth } from '@/lib/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { NewWeekModal } from '@/components/staff-menu/NewWeekModal'
import { useDisclosure } from '@mantine/hooks'

export const Route = createFileRoute('/_app/staff-menu/')({
  component: StaffMenuWeeksPage
})

function formatWeekRange (weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('en-KE', opts)} – ${end.toLocaleDateString(
    'en-KE',
    opts
  )}`
}

function StaffMenuWeeksPage () {
  const auth = useAuth()
  const [open, { open: openNew, close }] = useDisclosure(false)
  const query = useStaffMenuWeeks()

  const canManage = auth.hasPermission('menu.manage')

  return (
    <>
      <PageHeader
        title='Staff Menu'
        subtitle='Weekly planned meals for staff'
        actions={
          canManage ? (
            <Group>
              <Link
                to='/staff-menu/standing'
                style={{ textDecoration: 'none' }}
              >
                <Button variant='light' leftSection={<Repeat size={16} />}>
                  Standing Menu
                </Button>
              </Link>
              <Button leftSection={<Plus size={16} />} onClick={openNew}>
                New Week
              </Button>
            </Group>
          ) : undefined
        }
      />

      {query.isLoading ? (
        <Stack align='center' py='xl'>
          <Loader />
        </Stack>
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState
          title='No weeks planned'
          description="Create a week to start planning staff meals. Staff don't get charged - but stock is consumed."
        />
      ) : (
        <Stack gap='sm'>
          {query.data.map(week => (
            <Link
              key={`${week.property_id}-${week.week_start_date}`}
              to='/staff-menu/$weekStart'
              params={{ weekStart: week.week_start_date }}
              style={{
                display: 'block',
                width: '100%',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <Card
                withBorder
                radius='md'
                p='md'
                style={{ transition: 'border-color 120ms ease' }}
              >
                <Group justify='space-between' wrap='nowrap'>
                  <Group gap='sm' wrap='nowrap' style={{ minWidth: 0 }}>
                    <ThemeIcon
                      variant='light'
                      color={week.status === 'locked' ? 'red' : 'blue'}
                      size='lg'
                      radius='md'
                    >
                      {week.status === 'locked' ? (
                        <Lock size={16} />
                      ) : (
                        <Calendar size={16} />
                      )}
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text fw={600} size='sm' truncate>
                        Week of {formatWeekRange(week.week_start_date)}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        {week.slots_filled} slot
                        {week.slots_filled === 1 ? '' : 's'} planned
                      </Text>
                    </Box>
                  </Group>
                  <Group gap='sm' wrap='nowrap'>
                    <Badge
                      variant='light'
                      color={week.status === 'locked' ? 'red' : 'blue'}
                      size='sm'
                    >
                      {week.status}
                    </Badge>
                    <ChevronRight
                      size={16}
                      color='var(--mantine-color-gray-5)'
                    />
                  </Group>
                </Group>
              </Card>
            </Link>
          ))}
        </Stack>
      )}

      <NewWeekModal opened={open} onClose={close} />
    </>
  )
}
