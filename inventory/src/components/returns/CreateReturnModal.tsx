import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateReturn } from '@/hooks/useOperations';
import { useStockItems } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateReturnModal({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200 });
  const units = useUnits();
  const create = useCreateReturn();

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      return_type: 'bulk' as 'portion' | 'bulk' | 'packaged' | 'production_output',
      quantity: 0,
      unit_id: '',
      reason: '',
    },
    validate: {
      stock_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const r = await create.mutateAsync({
        stock_item_id: values.stock_item_id,
        return_type: values.return_type,
        quantity: values.quantity,
        unit_id: values.unit_id,
        reason: values.reason || null,
      });
      notifications.show({
        color: 'green',
        title: 'Return recorded',
        message: `${r.return_ref} - stock added back`,
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

  const stockItemOptions =
    stockItems.data?.data.map((s) => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`,
    })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Record Stock Return" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Stock Item"
            searchable
            data={stockItemOptions}
            required
            {...form.getInputProps('stock_item_id')}
          />
          <Select
            label="Return Type"
            data={[
              { value: 'portion', label: 'Portion' },
              { value: 'bulk', label: 'Bulk' },
              { value: 'packaged', label: 'Packaged' },
              { value: 'production_output', label: 'Production Output' },
            ]}
            {...form.getInputProps('return_type')}
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
          <Textarea
            label="Reason (optional)"
            autosize
            minRows={2}
            {...form.getInputProps('reason')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Record Return
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}