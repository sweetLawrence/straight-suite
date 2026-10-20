import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateRecipe, useItemsList, useUnitsList } from '@/hooks/useMenu';
import { useMenuItemsList } from '@/hooks/useMenu';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateRecipeModal({ opened, onClose }: Props) {
  const menuItems = useMenuItemsList({ limit: 200 });
  const items = useItemsList({ limit: 200 });
  const units = useUnitsList();
  const create = useCreateRecipe();

  const form = useForm({
    initialValues: {
      menu_item_id: '',
      stock_item_id: '',
      portion_definition_id: '',
      quantity: 1,
      unit_id: '',
    },
    validate: {
      menu_item_id: (v) => (v ? null : 'Required'),
      stock_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await create.mutateAsync({
        menu_item_id: values.menu_item_id,
        stock_item_id: values.stock_item_id,
        portion_definition_id: values.portion_definition_id || null,
        quantity: values.quantity,
        unit_id: values.unit_id,
      });
      notifications.show({
        color: 'green',
        title: 'Recipe created',
        message: 'Ingredient has been added to the recipe.',
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

  const menuOptions =
    menuItems.data?.data.map((m) => ({
      value: m.id,
      label: `${m.display_name} - ${m.property?.code || ''}`,
    })) || [];

  const itemOptions =
    items.data?.data
      .filter((i) => i.item_type.startsWith('stock_'))
      .map((i) => ({ value: i.id, label: `${i.name} (${i.code})` })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Create Recipe Line" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Menu Item"
            placeholder="Which dish?"
            searchable
            data={menuOptions}
            required
            {...form.getInputProps('menu_item_id')}
          />
          <Select
            label="Stock Item"
            placeholder="Which ingredient?"
            searchable
            data={itemOptions}
            required
            {...form.getInputProps('stock_item_id')}
          />
          <Group grow>
            <NumberInput
              label="Quantity"
              min={0}
              decimalScale={3}
              required
              {...form.getInputProps('quantity')}
            />
            <Select
              label="Unit"
              data={unitOptions}
              required
              {...form.getInputProps('unit_id')}
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}