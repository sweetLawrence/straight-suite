import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Info } from 'lucide-react';
import { useAddProductionInput } from '@/hooks/useProduction';
import { useStockItems } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
  batchId: string;
  expectedOutputSoFar: number;
}

export function AddInputModal({
  opened,
  onClose,
  batchId,
  expectedOutputSoFar,
}: Props) {
  const stockItems = useStockItems({ limit: 500, status: 'active' });
  const units = useUnits();
  const add = useAddProductionInput(batchId);

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      quantity: 0,
      unit_id: '',
      cost_amount: 0,
    },
    validate: {
      stock_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
      cost_amount: (v) => (v >= 0 ? null : 'Must be ≥ 0'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await add.mutateAsync(values);
      notifications.show({
        color: 'green',
        title: 'Input added',
        message: 'Expected output updated',
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
    // Only bulk food (flour, oil, sugar...) goes into production: no bar, drinks or packaged goods
    stockItems.data?.data.filter((s) => s.store_type !== 'bar_store' && (s.stock_model === 'bulk' || s.stock_model === 'portioned')).map((s) => ({
      value: s.id,
      label: s.item?.name || s.item?.code || 'Item',
    })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Add Input" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {expectedOutputSoFar > 0 && (
            <Alert icon={<Info size={16} />} color="blue" variant="light">
              <Text size="sm">
                Expected output so far: <strong>{expectedOutputSoFar}</strong>
              </Text>
            </Alert>
          )}

          <Select
            label="Input Stock Item"
            placeholder="Select ingredient"
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
          <NumberInput
            label="Cost (KES)"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('cost_amount')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={add.isPending}>
              Add
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}