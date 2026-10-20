import { getActing } from '@/lib/auth/acting'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { ArrowLeft, CheckCircle2, Clock, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useDailyStaffMealStatus } from '@/hooks/useOperations'
import { useAuth } from '@/lib/auth/useAuth'
import { useProperties } from '@/hooks/useCore'
import { PageHeader } from '@/components/PageHeader'
import { BulkStaffMealModal } from '@/components/staff-meals/BulkStaffMealModal'
import { formatCurrency } from '@/lib/utils/format'

export const Route = createFileRoute('/_app/staff-meals/daily')({
  component: DailyStaffMealsPage
})

type MealType = 'breakfast' | 'lunch' | 'supper'

function DailyStaffMealsPage () {
  const auth = useAuth()
  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [bulkOpen, { open: openBulk, close: closeBulk }] = useDisclosure(false)

  // MD/admin are not tied to one property, so they pick which one to view
  const isGroupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant')
  const properties = useProperties(1, 20)
  const [pickedProperty, setPickedProperty] = useState<string | null>(null)
  const propertyId = isGroupLevel ? pickedProperty || properties.data?.data[0]?.id : undefined
  const query = useDailyStaffMealStatus(
    { date, meal_type: mealType, ...(propertyId ? { property_id: propertyId } : {}) },
    { enabled: !isGroupLevel || !!propertyId }
  )
  // Issuing meals is done at a property by its own staff
  const canManage = auth.hasPermission('staff_meal.authorize') && (!isGroupLevel || (auth.hasRole('admin') && !!getActing()))

  const pendingStaff = useMemo(
    () => query.data?.entries.filter(e => e.status === 'pending') || [],
    [query.data]
  )

  return (
    <>
      <Link to='/staff-meals' style={{ textDecoration: 'none' }}>
        <Button variant='subtle' leftSection={<ArrowLeft size={16} />} mb='sm'>
          Back to staff meals
        </Button>
      </Link>

      <PageHeader
        title='Daily Staff Meals'
        subtitle='Who has had a meal asked for today (the store sends it, you confirm it)'
      />

      <Group mb='lg' gap='sm' align='flex-end' wrap='wrap'>
        {isGroupLevel && (
          <Select
            label='Property'
            value={propertyId || null}
            onChange={setPickedProperty}
            allowDeselect={false}
            data={(properties.data?.data || []).map(p => ({ value: p.id, label: p.name }))}
            w={220}
          />
        )}
        <DatePickerInput
          label='Date'
          value={date}
          onChange={v => setDate(v || dayjs().format('YYYY-MM-DD'))}
          valueFormat='ddd, DD MMM YYYY'
          w={200}
          popoverProps={{
            withinPortal: true,
            zIndex: 2000,
            position: 'bottom-start',
            offset: 8
          }}
        />
        <Group gap={4}>
          {(['breakfast', 'lunch', 'supper'] as MealType[]).map(m => (
            <Button
              key={m}
              variant={mealType === m ? 'filled' : 'default'}
              size='sm'
              radius='md'
              onClick={() => setMealType(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </Group>
        {canManage && pendingStaff.length > 0 && (
          <Button
            leftSection={<Users size={16} />}
            onClick={openBulk}
            ml='auto'
          >
            Record for {pendingStaff.length} pending
          </Button>
        )}
      </Group>

      {query.isLoading ? (
        <Stack align='center' py='xl'>
          <Loader />
        </Stack>
      ) : !query.data ? (
        <Text c='dimmed' ta='center' py='xl'>
          No data available.
        </Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mb='lg'>
            <Card withBorder padding='md'>
              <Group gap='xs'>
                <ThemeIcon variant='light' color='blue' size='sm'>
                  <Users size={12} />
                </ThemeIcon>
                <Text size='xs' c='dimmed' fw={500}>
                  Eligible
                </Text>
              </Group>
              <Text size='xl' fw={700} mt='xs'>
                {query.data.total_eligible}
              </Text>
            </Card>
            <Card withBorder padding='md'>
              <Group gap='xs'>
                <ThemeIcon variant='light' color='green' size='sm'>
                  <CheckCircle2 size={12} />
                </ThemeIcon>
                <Text size='xs' c='dimmed' fw={500}>
                  Issued
                </Text>
              </Group>
              <Text size='xl' fw={700} mt='xs'>
                {query.data.total_issued}
              </Text>
            </Card>
            <Card withBorder padding='md'>
              <Group gap='xs'>
                <ThemeIcon variant='light' color='orange' size='sm'>
                  <Clock size={12} />
                </ThemeIcon>
                <Text size='xs' c='dimmed' fw={500}>
                  Pending
                </Text>
              </Group>
              <Text size='xl' fw={700} mt='xs'>
                {query.data.total_pending}
              </Text>
            </Card>
            <Card withBorder padding='md'>
              <Text size='xs' c='dimmed' fw={500}>
                Coverage
              </Text>
              <Text size='xl' fw={700} mt='xs'>
                {query.data.coverage_pct}%
              </Text>
            </Card>
          </SimpleGrid>

          <Card withBorder>
            <Text fw={600} mb='sm'>
              Staff status - {mealType}
            </Text>
            <Stack gap='xs'>
              {query.data.entries.length === 0 ? (
                <Text c='dimmed' ta='center' py='md'>
                  No eligible staff for this property.
                </Text>
              ) : (
                query.data.entries.map(entry => (
                  <Card
                    key={entry.staff_user_id}
                    withBorder
                    radius='md'
                    p='sm'
                    style={{
                      background:
                        entry.status === 'issued'
                          ? 'var(--mantine-color-green-0)'
                          : undefined,
                      borderColor:
                        entry.status === 'issued'
                          ? 'var(--mantine-color-green-3)'
                          : undefined
                    }}
                  >
                    <Group justify='space-between' wrap='nowrap'>
                      <Group gap='sm' wrap='nowrap' style={{ minWidth: 0 }}>
                        <ThemeIcon
                          size='sm'
                          variant='light'
                          color={entry.status === 'issued' ? 'green' : 'orange'}
                        >
                          {entry.status === 'issued' ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                        </ThemeIcon>
                        <Box style={{ minWidth: 0 }}>
                          <Text fw={500} size='sm' truncate>
                            {entry.staff_name}
                          </Text>
                          {entry.status === 'issued' && (
                            <Text size='xs' c='dimmed'>
                              Issued by {entry.issued_by || '-'}
                              {entry.total_cost
                                ? ` · ${formatCurrency(entry.total_cost)}`
                                : ''}
                            </Text>
                          )}
                        </Box>
                      </Group>
                      <Badge
                        variant='light'
                        color={entry.status === 'issued' ? 'green' : 'orange'}
                        size='sm'
                      >
                        {entry.status}
                      </Badge>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </>
      )}

      <BulkStaffMealModal
        opened={bulkOpen}
        onClose={closeBulk}
        defaultMealType={mealType}
        defaultDate={date}
      />
    </>
  )
}
