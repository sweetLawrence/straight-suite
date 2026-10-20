import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useUpdateMenuItem } from '@/hooks/useMenu';
import { getErrorMessage } from '@/lib/api/client';
import { MenuItem } from '@/lib/api/menu';

interface Props {
  opened: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
}

export function EditMenuItemModal({ opened, onClose, menuItem }: Props) {
  const update = useUpdateMenuItem();

  const form = useForm({
    initialValues: {
      display_name: '',
      price: 0,
      category: '',
      station: 'kitchen' as 'kitchen' | 'bar' | 'both',
      status: 'active' as 'active' | 'inactive' | 'discontinued',
    },
    validate: {
      display_name: (v) => (v.trim() ? null : 'Required'),
      price: (v) => (v >= 0 ? null : 'Must be ≥ 0'),
    },
  });

  useEffect(() => {
    if (menuItem) {
      form.setValues({
        display_name: menuItem.display_name,
        price: parseFloat(menuItem.price),
        category: menuItem.category || '',
        station: (menuItem.station as any) || 'kitchen',
        status: menuItem.status as any,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItem]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!menuItem) return;
    try {
      await update.mutateAsync({
        id: menuItem.id,
        data: {
          display_name: values.display_name,
          price: values.price,
          category: values.category || undefined,
          station: values.station,
          status: values.status,
        },
      });
      notifications.show({
        color: 'green',
        title: 'Menu item updated',
        message: `${values.display_name} has been saved.`,
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

  if (!menuItem) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Menu Item" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Display Name"
            required
            {...form.getInputProps('display_name')}
          />
          <NumberInput
            label="Price (KES)"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('price')}
          />
          <Group grow>
            <TextInput
              label="Category"
              {...form.getInputProps('category')}
            />
            <Select
              label="Station"
              data={[
                { value: 'kitchen', label: 'Kitchen' },
                { value: 'bar', label: 'Bar' },
                { value: 'both', label: 'Both' },
              ]}
              {...form.getInputProps('station')}
            />
          </Group>
          <Select
            label="Status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'discontinued', label: 'Discontinued' },
            ]}
            {...form.getInputProps('status')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}