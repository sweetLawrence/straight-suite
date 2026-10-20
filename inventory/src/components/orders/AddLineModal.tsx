import { useMemo } from 'react';
import {
  Button,
  Chip,
  Group,
  Input,
  Modal,
  NumberInput,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAddOrderLine } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { cookingStyles, menuBaseName } from '@/lib/utils/menuName';
import { MenuItemPicker } from './MenuItemPicker';
import { useAuth } from '@/lib/auth/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
  orderId: string;
}

export function AddLineModal({ opened, onClose, orderId }: Props) {
  const auth = useAuth();
  // Selling over the bar counter: bar items only
  const barOnly = !auth.hasPermission('order.create');
  const menuItems = useMenuItems(1, 500, undefined, { status: 'active', ...(barOnly ? { station: 'bar' } : {}) });
  const addLine = useAddOrderLine(orderId);

  const form = useForm({
    initialValues: {
      menu_item_id: '',
      quantity: 1,
      style: '',
      notes: '',
    },
    validate: {
      menu_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      style: (v, values) => {
        const item = menuItems.data?.data.find((m) => m.id === values.menu_item_id);
        return item && cookingStyles(item.display_name).length && !v ? 'Choose how the kitchen should cook it' : null;
      },
    },
  });

  const selected = menuItems.data?.data.find((m) => m.id === form.values.menu_item_id);
  const styles = useMemo(() => (selected ? cookingStyles(selected.display_name) : []), [selected]);

  const handleSubmit = async (values: typeof form.values) => {
    // The chosen style travels with the line to the queue, slip and bill
    const notes = [values.style ? `Style: ${values.style}` : '', values.notes.trim()].filter(Boolean).join(' · ');
    try {
      await addLine.mutateAsync({
        menu_item_id: values.menu_item_id,
        quantity: values.quantity,
        notes: notes || undefined,
      });
      notifications.show({
        color: 'green',
        title: 'Line added',
        message: `${values.quantity} × ${selected ? menuBaseName(selected.display_name) : 'item'}${values.style ? ` (${values.style})` : ''}`,
      });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const activeItems = useMemo(
    () => (menuItems.data?.data ?? []).filter((m) => m.status === 'active' && (!barOnly || m.station === 'bar')),
    [menuItems.data, barOnly]
  );

  return (
    <Modal opened={opened} onClose={onClose} title="Add Item" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <MenuItemPicker
            items={activeItems}
            loading={menuItems.isLoading}
            value={form.values.menu_item_id}
            error={form.errors.menu_item_id}
            onChange={(id) => {
              form.setFieldValue('menu_item_id', id);
              form.setFieldValue('style', '');
            }}
          />
          {styles.length > 0 && (
            <Input.Wrapper label="How to cook it" required error={form.errors.style}>
              <Chip.Group
                multiple={false}
                value={form.values.style}
                onChange={(v) => form.setFieldValue('style', v as string)}
              >
                <Group gap="xs" mt={6}>
                  {styles.map((s) => (
                    <Chip key={s} value={s} radius="sm">
                      {s}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Input.Wrapper>
          )}
          <NumberInput
            label="Quantity"
            min={1}
            required
            {...form.getInputProps('quantity')}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="e.g. no chilli, well done"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={addLine.isPending}>
              Add
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
