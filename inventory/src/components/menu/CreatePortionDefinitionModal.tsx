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
import { useCreatePortionDefinition, useItemsList, useUnitsList } from '@/hooks/useMenu';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreatePortionDefinitionModal({ opened, onClose }: Props) {
  const items = useItemsList({ limit: 200 });
  const units = useUnitsList();
  const create = useCreatePortionDefinition();

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      portion_name: '',
      portion_size: 0,
      portion_unit_id: '',
      sell_price: 0,
    },
    validate: {
      stock_item_id: (v) => (v ? null : 'Required'),
      portion_name: (v) => (v.trim() ? null : 'Required'),
      portion_size: (v) => (v > 0 ? null : 'Must be > 0'),
      portion_unit_id: (v) => (v ? null : 'Required'),
      sell_price: (v) => (v >= 0 ? null : 'Must be ≥ 0'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const pd = await create.mutateAsync(values);
      notifications.show({
        color: 'green',
        title: 'Portion definition created',
        message: `${pd.portion_name} has been added.`,
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

  const itemOptions =
    items.data?.data
      .filter((i) => i.item_type.startsWith('stock_'))
      .map((i) => ({ value: i.id, label: `${i.name} (${i.code})` })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Portion Definition"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Stock Item"
            searchable
            data={itemOptions}
            required
            {...form.getInputProps('stock_item_id')}
          />
          <TextInput
            label="Portion Name"
            placeholder="e.g. Standard cup, 150g serving"
            required
            {...form.getInputProps('portion_name')}
          />
          <Group grow>
            <NumberInput
              label="Portion Size"
              min={0}
              decimalScale={3}
              required
              {...form.getInputProps('portion_size')}
            />
            <Select
              label="Unit"
              data={unitOptions}
              required
              {...form.getInputProps('portion_unit_id')}
            />
          </Group>
          <NumberInput
            label="Sell Price (KES)"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('sell_price')}
          />
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