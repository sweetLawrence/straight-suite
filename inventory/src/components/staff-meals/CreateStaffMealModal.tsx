// import {
//   Button,
//   Card,
//   Divider,
//   Group,
//   Modal,
//   NumberInput,
//   Select,
//   Stack,
//   Text,
//   TextInput,
//   Textarea,
// } from '@mantine/core';
// import { useForm } from '@mantine/form';
// import { notifications } from '@mantine/notifications';
// import { Plus, Trash2 } from 'lucide-react';
// import { useCreateStaffMeal } from '@/hooks/useOperations';
// import { useStockItems } from '@/hooks/useStock';
// import { useUnits, useUsers } from '@/hooks/useCore';
// import { getErrorMessage } from '@/lib/api/client';

// interface Props {
//   opened: boolean;
//   onClose: () => void;
// }

// interface Line {
//   stock_item_id: string;
//   quantity: number;
//   unit_id: string;
//   cost_amount: number;
// }

// export function CreateStaffMealModal({ opened, onClose }: Props) {
//   const staffUsers = useUsers(1, 200);
//   const stockItems = useStockItems({ limit: 200 });
//   const units = useUnits();
//   const create = useCreateStaffMeal();

//   const form = useForm({
//     initialValues: {
//       staff_user_id: '',
//       staff_name: '',
//       meal_type: 'lunch' as 'breakfast' | 'lunch' | 'dinner',
//       source: 'alternative' as 'menu' | 'alternative',
//       lines: [
//         { stock_item_id: '', quantity: 0, unit_id: '', cost_amount: 0 },
//       ] as Line[],
//     },
//     validate: {
//       staff_name: (v) => (v.trim() ? null : 'Required'),
//       lines: {
//         stock_item_id: (v) => (v ? null : 'Required'),
//         quantity: (v) => (v > 0 ? null : 'Must be > 0'),
//         unit_id: (v) => (v ? null : 'Required'),
//       },
//     },
//   });

//   const handleSubmit = async (values: typeof form.values) => {
//     try {
//       const meal = await create.mutateAsync({
//         staff_user_id: values.staff_user_id || null,
//         staff_name: values.staff_name,
//         meal_type: values.meal_type,
//         source: values.source,
//         lines: values.lines,
//       });
//       notifications.show({
//         color: 'green',
//         title: 'Staff meal recorded',
//         message: `${meal.staff_meal_ref} created`,
//       });
//       form.reset();
//       onClose();
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err),
//       });
//     }
//   };

//   const userOptions =
//     staffUsers.data?.data.map((u) => ({
//       value: u.id,
//       label: `${u.full_name} (${u.username})`,
//     })) || [];

//   const stockItemOptions =
//     stockItems.data?.data.map((s) => ({
//       value: s.id,
//       label: `${s.item?.name || 'Item'} (${s.stock_model})`,
//     })) || [];

//   const unitOptions =
//     units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

//   return (
//     <Modal
//       opened={opened}
//       onClose={onClose}
//       title="Record Staff Meal"
//       size="xl"
//     >
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <Select
//             label="Staff User (optional)"
//             placeholder="Search staff"
//             searchable
//             clearable
//             data={userOptions}
//             value={form.values.staff_user_id}
//             onChange={(v) => {
//               form.setFieldValue('staff_user_id', v || '');
//               const u = staffUsers.data?.data.find((x) => x.id === v);
//               if (u) form.setFieldValue('staff_name', u.full_name);
//             }}
//           />
//           <Group grow>
//             <TextInput
//               label="Staff Name"
//               placeholder="Who is eating?"
//               required
//               {...form.getInputProps('staff_name')}
//             />
//             <Select
//               label="Meal"
//               data={[
//                 { value: 'breakfast', label: 'Breakfast' },
//                 { value: 'lunch', label: 'Lunch' },
//                 { value: 'dinner', label: 'Dinner' },
//               ]}
//               {...form.getInputProps('meal_type')}
//             />
//           </Group>
//           <Select
//             label="Source"
//             data={[
//               { value: 'menu', label: 'From defined staff menu' },
//               { value: 'alternative', label: 'Alternative (anything available)' },
//             ]}
//             {...form.getInputProps('source')}
//           />

//           <Divider label="Items Consumed" labelPosition="left" />

//           {form.values.lines.map((line, idx) => (
//             <Card key={idx} withBorder padding="sm">
//               <Stack gap="xs">
//                 <Group justify="space-between">
//                   <Text size="sm" fw={500}>
//                     Line {idx + 1}
//                   </Text>
//                   {form.values.lines.length > 1 && (
//                     <Button
//                       variant="subtle"
//                       color="red"
//                       size="compact-sm"
//                       onClick={() => form.removeListItem('lines', idx)}
//                       leftSection={<Trash2 size={14} />}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </Group>
//                 <Select
//                   label="Stock Item"
//                   searchable
//                   data={stockItemOptions}
//                   {...form.getInputProps(`lines.${idx}.stock_item_id`)}
//                 />
//                 <Group grow>
//                   <NumberInput
//                     label="Quantity"
//                     min={0}
//                     decimalScale={3}
//                     {...form.getInputProps(`lines.${idx}.quantity`)}
//                   />
//                   <Select
//                     label="Unit"
//                     data={unitOptions}
//                     {...form.getInputProps(`lines.${idx}.unit_id`)}
//                   />
//                 </Group>
//                 <NumberInput
//                   label="Cost (KES)"
//                   min={0}
//                   decimalScale={2}
//                   {...form.getInputProps(`lines.${idx}.cost_amount`)}
//                 />
//               </Stack>
//             </Card>
//           ))}

//           <Button
//             variant="light"
//             leftSection={<Plus size={16} />}
//             onClick={() =>
//               form.insertListItem('lines', {
//                 stock_item_id: '',
//                 quantity: 0,
//                 unit_id: '',
//                 cost_amount: 0,
//               })
//             }
//           >
//             Add line
//           </Button>

//           <Group justify="flex-end" mt="md">
//             <Button variant="default" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit" loading={create.isPending}>
//               Record Meal
//             </Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   );
// }

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { AlertCircle, Info, Lock, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useCreateStaffMeal } from '@/hooks/useOperations'
import { useScheduleLookup } from '@/hooks/useOperations'
import { useStockItems } from '@/hooks/useStock'
import { useUnits, useUsers } from '@/hooks/useCore'
import { getErrorMessage } from '@/lib/api/client'

interface Props {
  opened: boolean
  onClose: () => void
}

interface Line {
  stock_item_id: string
  quantity: number
  unit_id: string
  cost_amount: number
}

export function CreateStaffMealModal ({ opened, onClose }: Props) {
  const staffUsers = useUsers(1, 200)
  const stockItems = useStockItems({ limit: 200 })
  const units = useUnits()
  const create = useCreateStaffMeal()

  const [date, setDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [manualCosts, setManualCosts] = useState<Record<number, number>>({})

  const form = useForm({
    initialValues: {
      staff_user_id: '',
      staff_name: '',
      meal_type: 'lunch' as 'breakfast' | 'lunch' | 'supper',
      date: dayjs().format('YYYY-MM-DD'),
      source: 'menu' as 'menu' | 'alternative',
      lines: [
        { stock_item_id: '', quantity: 0, unit_id: '', cost_amount: 0 }
      ] as Line[]
    },
    validate: {
      staff_name: v => (v.trim() ? null : 'Required'),
      lines: {
        stock_item_id: (v, values) => {
          if (values.source === 'menu') return null // auto-filled
          return v ? null : 'Required'
        },
        quantity: v => (v > 0 ? null : 'Must be > 0'),
        unit_id: (v, values) => {
          if (values.source === 'menu') return null
          return v ? null : 'Required'
        }
      }
    }
  })

  // Reset on open
  useEffect(() => {
    if (opened) {
      const today = dayjs().format('YYYY-MM-DD')
      setDate(today)
      form.setValues({
        staff_user_id: '',
        staff_name: '',
        meal_type: 'lunch',
        date: today,
        source: 'menu',
        lines: [{ stock_item_id: '', quantity: 0, unit_id: '', cost_amount: 0 }]
      })
      setManualCosts({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  // Schedule lookup - only active when source = 'menu'
  const lookup = useScheduleLookup({
    date: form.values.date,
    meal_type: form.values.meal_type,
    enabled: opened && form.values.source === 'menu'
  })

  const scheduleItems = lookup.data?.items || []
  const hasSchedule = scheduleItems.length > 0
  const scheduleSource = lookup.data?.source

  // Auto-load items when schedule changes and source = 'menu'
  useEffect(() => {
    if (form.values.source !== 'menu') return
    if (!hasSchedule) return

    const newLines: Line[] = scheduleItems.map(item => ({
      stock_item_id: item.stock_item_id,
      quantity: item.quantity,
      unit_id: item.unit_id,
      cost_amount: 20
    }))
    form.setFieldValue('lines', newLines)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scheduleItems.length,
    form.values.source,
    form.values.meal_type,
    form.values.date
  ])

  const handleSubmit = async (values: typeof form.values) => {
    if (values.source === 'menu' && !hasSchedule) {
      notifications.show({
        color: 'red',
        title: 'No menu plan',
        message:
          'No standing or week menu for this meal. Switch to Alternative.'
      })
      return
    }

    try {
      const meal = await create.mutateAsync({
        staff_user_id: values.staff_user_id || null,
        staff_name: values.staff_name,
        meal_type: values.meal_type,
        source: values.source,
        lines: values.lines
      })
      notifications.show({
        color: 'green',
        title: 'Staff meal recorded',
        message: `${meal.staff_meal_ref} created`
      })
      form.reset()
      setManualCosts({})
      onClose()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const userOptions =
    staffUsers.data?.data.map(u => ({
      value: u.id,
      label: `${u.full_name} (${u.username})`
    })) || []

  const stockItemOptions =
    stockItems.data?.data.map(s => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`
    })) || []

  const unitOptions =
    units.data?.data.map(u => ({ value: u.id, label: u.name })) || []

  const isMenuSource = form.values.source === 'menu'

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='Record Staff Meal'
      size='xl'
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group grow>
            <Select
              label='Staff User (optional)'
              placeholder='Search staff'
              searchable
              clearable
              data={userOptions}
              value={form.values.staff_user_id}
              onChange={v => {
                form.setFieldValue('staff_user_id', v || '')
                const u = staffUsers.data?.data.find(x => x.id === v)
                if (u) form.setFieldValue('staff_name', u.full_name)
              }}
            />
            <TextInput
              label='Staff Name'
              placeholder='Who is eating?'
              required
              {...form.getInputProps('staff_name')}
            />
          </Group>

          <Group grow>
            <Select
              label='Meal'
              data={[
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'supper', label: 'Supper' }
              ]}
              {...form.getInputProps('meal_type')}
            />
            <DatePickerInput
              label='Date'
              value={form.values.date}
              onChange={v => {
                form.setFieldValue('date', v || dayjs().format('YYYY-MM-DD'))
              }}
              valueFormat='ddd, DD MMM'
              popoverProps={{
                withinPortal: true,
                zIndex: 2000,
                position: 'bottom-start',
                offset: 8
              }}
            />
            <Select
              label='Source'
              data={[
                { value: 'menu', label: 'From menu plan' },
                { value: 'alternative', label: 'Alternative (manual)' }
              ]}
              {...form.getInputProps('source')}
            />
          </Group>

          <Divider label='Items Consumed' labelPosition='left' />

          {isMenuSource && lookup.isLoading && (
            <Group justify='center' py='md'>
              <Loader size='sm' />
            </Group>
          )}

          {isMenuSource && !lookup.isLoading && !hasSchedule && (
            <Alert icon={<AlertCircle size={16} />} color='red' variant='light'>
              <Text size='sm'>
                No menu plan for this date and meal. Switch Source to{' '}
                <strong>Alternative</strong> to pick items manually.
              </Text>
            </Alert>
          )}

          {isMenuSource && hasSchedule && (
            <Alert
              icon={<Lock size={16} />}
              color={scheduleSource === 'week' ? 'blue' : 'green'}
              variant='light'
            >
              <Group gap='xs'>
                <Text size='sm'>
                  Items locked to the <strong>{scheduleSource} menu</strong>.
                </Text>
                <Badge
                  variant='light'
                  color={scheduleSource === 'week' ? 'blue' : 'green'}
                  size='sm'
                >
                  {scheduleSource}
                </Badge>
              </Group>
            </Alert>
          )}

          {isMenuSource && hasSchedule && (
            <Stack gap='xs'>
              {form.values.lines.map((line, idx) => {
                const scheduleItem = scheduleItems[idx]
                if (!scheduleItem) return null
                return (
                  <Card key={idx} withBorder padding='sm' radius='md'>
                    <Group justify='space-between' wrap='nowrap'>
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text size='sm' fw={500} truncate>
                          {scheduleItem.stock_item_name}
                        </Text>
                        <Text size='xs' c='dimmed'>
                          {scheduleItem.quantity} {scheduleItem.unit_name} per
                          meal
                        </Text>
                      </Stack>
                      <NumberInput
                        size='xs'
                        w={120}
                        min={0}
                        decimalScale={2}
                        prefix='KES '
                        value={line.cost_amount}
                        onChange={v =>
                          form.setFieldValue(
                            `lines.${idx}.cost_amount`,
                            typeof v === 'number' ? v : 0
                          )
                        }
                      />
                    </Group>
                  </Card>
                )
              })}
            </Stack>
          )}

          {!isMenuSource && (
            <>
              {form.values.lines.map((line, idx) => (
                <Card key={idx} withBorder padding='sm'>
                  <Stack gap='xs'>
                    <Group justify='space-between'>
                      <Text size='sm' fw={500}>
                        Line {idx + 1}
                      </Text>
                      {form.values.lines.length > 1 && (
                        <Button
                          variant='subtle'
                          color='red'
                          size='compact-sm'
                          onClick={() => form.removeListItem('lines', idx)}
                          leftSection={<Trash2 size={14} />}
                        >
                          Remove
                        </Button>
                      )}
                    </Group>
                    <Select
                      label='Stock Item'
                      searchable
                      data={stockItemOptions}
                      {...form.getInputProps(`lines.${idx}.stock_item_id`)}
                    />
                    <Group grow>
                      <NumberInput
                        label='Quantity'
                        min={0}
                        decimalScale={3}
                        {...form.getInputProps(`lines.${idx}.quantity`)}
                      />
                      <Select
                        label='Unit'
                        data={unitOptions}
                        {...form.getInputProps(`lines.${idx}.unit_id`)}
                      />
                    </Group>
                    <NumberInput
                      label='Cost (KES)'
                      min={0}
                      decimalScale={2}
                      {...form.getInputProps(`lines.${idx}.cost_amount`)}
                    />
                  </Stack>
                </Card>
              ))}

              <Button
                variant='light'
                leftSection={<Plus size={16} />}
                onClick={() =>
                  form.insertListItem('lines', {
                    stock_item_id: '',
                    quantity: 0,
                    unit_id: '',
                    cost_amount: 0
                  })
                }
              >
                Add line
              </Button>
            </>
          )}

          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              loading={create.isPending}
              disabled={isMenuSource && !hasSchedule}
            >
              Record Meal
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
