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
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Plus, Trash2, Utensils } from 'lucide-react';
import { useUpsertStandingSlot } from '@/hooks/useStaffMenu';
import { useStockItems } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { StaffMenuSchedule } from '@/lib/api/staffMenu';
import { useEffect } from 'react';

interface Props {
  opened: boolean;
  onClose: () => void;
  dayOfWeek: number;
  mealType: 'breakfast' | 'lunch' | 'supper';
  existing: StaffMenuSchedule | null;
}

interface SlotLine {
  stock_item_id: string;
  quantity: number;
  unit_id: string;
  notes: string;
}

const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  supper: 'Supper',
};

export function StandingSlotModal({
  opened,
  onClose,
  dayOfWeek,
  mealType,
  existing,
}: Props) {
  const stockItems = useStockItems({ limit: 200 });
  const units = useUnits();
  const upsert = useUpsertStandingSlot();

  const form = useForm({
    initialValues: {
      notes: '',
      lines: [
        { stock_item_id: '', quantity: 0.1, unit_id: '', notes: '' },
      ] as SlotLine[],
    },
    validate: {
      lines: {
        stock_item_id: (v) => (v ? null : 'Required'),
        quantity: (v) => (v > 0 ? null : 'Must be > 0'),
        unit_id: (v) => (v ? null : 'Required'),
      },
    },
  });

  useEffect(() => {
    if (existing && existing.items && existing.items.length > 0) {
      form.setValues({
        notes: existing.notes || '',
        lines: existing.items.map((i) => ({
          stock_item_id: i.stock_item_id,
          quantity: parseFloat(i.quantity),
          unit_id: i.unit_id,
          notes: i.notes || '',
        })),
      });
    } else {
      form.setValues({
        notes: '',
        lines: [{ stock_item_id: '', quantity: 0.1, unit_id: '', notes: '' }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await upsert.mutateAsync({
        dayOfWeek,
        mealType,
        data: {
          notes: values.notes || null,
          items: values.lines.map((l) => ({
            stock_item_id: l.stock_item_id,
            quantity: l.quantity,
            unit_id: l.unit_id,
            notes: l.notes || null,
          })),
        },
      });
      notifications.show({
        color: 'green',
        title: 'Standing slot saved',
        message: `${dayNames[dayOfWeek]} ${mealLabels[mealType]} updated.`,
      });
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const stockItemOptions =
    stockItems.data?.data.map((s) => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`,
    })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="md" radius="md">
            <Utensils size={14} />
          </ThemeIcon>
          <Text fw={600}>
            {dayNames[dayOfWeek]} · {mealLabels[mealType]}
          </Text>
        </Group>
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            This standing slot applies every week until overridden by a
            specific week.
          </Text>

          <Divider />

          {form.values.lines.map((line, idx) => (
            <Card key={idx} withBorder padding="sm" radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                    Item {idx + 1}
                  </Text>
                  {form.values.lines.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => form.removeListItem('lines', idx)}
                    >
                      <Trash2 size={14} />
                    </ActionIcon>
                  )}
                </Group>

                <Select
                  label="Stock Item"
                  searchable
                  size="sm"
                  data={stockItemOptions}
                  {...form.getInputProps(`lines.${idx}.stock_item_id`)}
                />

                <Group grow>
                  <NumberInput
                    label="Quantity per staff"
                    min={0}
                    decimalScale={3}
                    size="sm"
                    {...form.getInputProps(`lines.${idx}.quantity`)}
                  />
                  <Select
                    label="Unit"
                    size="sm"
                    data={unitOptions}
                    {...form.getInputProps(`lines.${idx}.unit_id`)}
                  />
                </Group>

                <Textarea
                  label="Notes (optional)"
                  size="sm"
                  autosize
                  minRows={1}
                  {...form.getInputProps(`lines.${idx}.notes`)}
                />
              </Stack>
            </Card>
          ))}

          <Button
            variant="light"
            leftSection={<Plus size={14} />}
            size="sm"
            onClick={() =>
              form.insertListItem('lines', {
                stock_item_id: '',
                quantity: 0.1,
                unit_id: '',
                notes: '',
              })
            }
          >
            Add item
          </Button>

          <Textarea
            label="Slot notes (optional)"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={upsert.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}