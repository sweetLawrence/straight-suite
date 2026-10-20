import { Button, Group, Modal, Select, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateProductionBatch } from '@/hooks/useProduction';
import { useStockItems } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function StartProductionModal({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200, stock_model: 'produced' });
  const units = useUnits();
  const create = useCreateProductionBatch();

  const form = useForm({
    initialValues: {
      output_stock_item_id: '',
      unit_id: '',
      notes: '',
    },
    validate: {
      output_stock_item_id: (v) => (v ? null : 'Required'),
      unit_id: (v) => (v ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const b = await create.mutateAsync({
        output_stock_item_id: values.output_stock_item_id,
        unit_id: values.unit_id,
        notes: values.notes || undefined,
      });
      notifications.show({
        color: 'green',
        title: 'Production started',
        message: `${b.production_ref} - add inputs next`,
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
    stockItems.data?.data.map((s) => ({
      value: s.id,
      label: s.item?.name || s.item?.code || 'Item',
    })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Start Production" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="What are you producing?"
            placeholder="Select output item"
            searchable
            data={itemOptions}
            required
            {...form.getInputProps('output_stock_item_id')}
          />
          <Select
            label="Unit"
            placeholder="e.g. Piece"
            data={unitOptions}
            required
            {...form.getInputProps('unit_id')}
          />
          <Textarea
            label="Notes (optional)"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Start
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}