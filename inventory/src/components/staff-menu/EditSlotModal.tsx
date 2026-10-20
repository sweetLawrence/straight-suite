import {
  ActionIcon,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Plus, Trash2, Utensils } from 'lucide-react'
import { useUpsertStaffMenuSlot } from '@/hooks/useStaffMenu'
import { useStockItems } from '@/hooks/useStock'
import { useUnits } from '@/hooks/useCore'
import { getErrorMessage } from '@/lib/api/client'
import { StaffMenuSchedule } from '@/lib/api/staffMenu'
import { useEffect } from 'react'

interface Props {
  opened: boolean
  onClose: () => void
  weekStart: string
  /** Needed for MD/admin, who are not tied to one property */
  propertyId?: string
  dayOfWeek: number
  mealType: 'breakfast' | 'lunch' | 'supper'
  existing: StaffMenuSchedule | null
}

interface SlotLine {
  stock_item_id: string
  quantity: number
  unit_id: string
  notes: string
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
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', supper: 'Supper' }

export function EditSlotModal ({
  opened,
  onClose,
  weekStart,
  propertyId,
  dayOfWeek,
  mealType,
  existing
}: Props) {
  const stockItems = useStockItems({ limit: 200, ...(propertyId ? { property_id: propertyId } : {}) })
  const units = useUnits()
  const upsert = useUpsertStaffMenuSlot()

  const form = useForm({
    initialValues: {
      notes: '',
      lines: [
        { stock_item_id: '', quantity: 0.1, unit_id: '', notes: '' }
      ] as SlotLine[]
    },
    validate: {
      lines: {
        stock_item_id: v => (v ? null : 'Required'),
        quantity: v => (v > 0 ? null : 'Must be > 0'),
        unit_id: v => (v ? null : 'Required')
      }
    }
  })

  useEffect(() => {
    if (existing && existing.items && existing.items.length > 0) {
      form.setValues({
        notes: existing.notes || '',
        lines: existing.items.map(i => ({
          stock_item_id: i.stock_item_id,
          quantity: parseFloat(i.quantity),
          unit_id: i.unit_id,
          notes: i.notes || ''
        }))
      })
    } else {
      form.setValues({
        notes: '',
        lines: [{ stock_item_id: '', quantity: 0.1, unit_id: '', notes: '' }]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, opened])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await upsert.mutateAsync({
        weekStart,
        dayOfWeek,
        mealType,
        data: {
          ...(propertyId ? { property_id: propertyId } : {}),
          notes: values.notes || null,
          items: values.lines.map(l => ({
            stock_item_id: l.stock_item_id,
            quantity: l.quantity,
            unit_id: l.unit_id,
            notes: l.notes || null
          }))
        }
      })
      notifications.show({
        color: 'green',
        title: 'Slot saved',
        message: `${dayNames[dayOfWeek]} ${mealLabels[mealType]} updated.`
      })
      onClose()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const stockItemOptions =
    stockItems.data?.data.map(s => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`
    })) || []

  const unitOptions =
    units.data?.data.map(u => ({ value: u.id, label: u.name })) || []

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap='xs'>
          <ThemeIcon variant='light' color='blue' size='md' radius='md'>
            <Utensils size={14} />
          </ThemeIcon>
          <Text fw={600}>
            {dayNames[dayOfWeek]} · {mealLabels[mealType]}
          </Text>
        </Group>
      }
      size='lg'
      fullScreen={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap='md'>
          <Text size='xs' c='dimmed'>
            Set the planned items and per-staff quantities. This is a plan - it
            doesn't issue stock. Recording a staff meal is a separate action.
          </Text>

          <Divider />

          {form.values.lines.map((line, idx) => (
            <Card key={idx} withBorder padding='sm' radius='md'>
              <Stack gap='xs'>
                <Group justify='space-between' align='center'>
                  <Text size='xs' fw={600} c='dimmed' tt='uppercase'>
                    Item {idx + 1}
                  </Text>
                  {form.values.lines.length > 1 && (
                    <ActionIcon
                      variant='subtle'
                      color='red'
                      size='sm'
                      onClick={() => form.removeListItem('lines', idx)}
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  )}
                </Group>

                <Select
                  label='Stock Item'
                  placeholder='Search item'
                  searchable
                  size='sm'
                  data={stockItemOptions}
                  {...form.getInputProps(`lines.${idx}.stock_item_id`)}
                />

                <Group grow>
                  <NumberInput
                    label='Quantity per staff'
                    placeholder='e.g. 0.2'
                    min={0}
                    decimalScale={3}
                    size='sm'
                    {...form.getInputProps(`lines.${idx}.quantity`)}
                  />
                  <Select
                    label='Unit'
                    placeholder='kg, g, etc.'
                    size='sm'
                    data={unitOptions}
                    {...form.getInputProps(`lines.${idx}.unit_id`)}
                  />
                </Group>

                <Textarea
                  label='Notes (optional)'
                  placeholder='Any special remarks'
                  size='sm'
                  autosize
                  minRows={1}
                  maxRows={2}
                  {...form.getInputProps(`lines.${idx}.notes`)}
                />
              </Stack>
            </Card>
          ))}

          <Button
            variant='light'
            leftSection={<Plus size={14} />}
            size='sm'
            onClick={() =>
              form.insertListItem('lines', {
                stock_item_id: '',
                quantity: 0.1,
                unit_id: '',
                notes: ''
              })
            }
          >
            Add item
          </Button>

          <Textarea
            label='Slot notes (optional)'
            placeholder='e.g. Special diet considerations'
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' loading={upsert.isPending}>
              Save Slot
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
