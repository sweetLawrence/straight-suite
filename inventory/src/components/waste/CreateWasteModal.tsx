import { useEffect } from 'react';
import { Button, Group, Modal, NumberInput, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateWaste } from '@/hooks/useOperations';
import { useStockItems } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { useWasteUnitCost } from '@/hooks/useCashier';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  opened: boolean;
  onClose: () => void;
}

/**
 * Record waste. The value is worked out from what the stock cost (latest batch)
 * unless the person chooses to enter it by hand.
 */
export function CreateWasteModal({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200 });
  const units = useUnits();
  const create = useCreateWaste();

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      quantity: 0,
      unit_id: '',
      value_mode: 'auto' as 'auto' | 'manual',
      cost_amount: 0,
      reason: '',
    },
    validate: {
      stock_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
      reason: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const cost = useWasteUnitCost(form.values.stock_item_id || null);
  const autoValue = Math.round(Number(form.values.quantity || 0) * (cost.data?.unit_cost ?? 0) * 100) / 100;

  // Count in the item's own unit so the value matches the batch cost
  useEffect(() => {
    if (cost.data?.unit?.id) form.setFieldValue('unit_id', cost.data.unit.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cost.data?.unit?.id]);

  useEffect(() => {
    if (opened) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const w = await create.mutateAsync({
        stock_item_id: values.stock_item_id,
        quantity: values.quantity,
        unit_id: values.unit_id,
        reason: values.reason,
        // Left out = valued automatically by the server
        ...(values.value_mode === 'manual' ? { cost_amount: values.cost_amount } : {}),
      });
      notifications.show({
        color: 'green',
        title: w.status === 'pending' ? 'Sent to the manager' : 'Waste recorded',
        message: w.status === 'pending'
          ? `${w.waste_ref} · the stock comes off once the manager approves`
          : `${w.waste_ref} · ${formatCurrency(w.cost_amount)} written off`,
      });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Failed', message: getErrorMessage(err) });
    }
  };

  const stockItemOptions =
    stockItems.data?.data.map((s) => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`,
    })) || [];

  const unitOptions = units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];
  const unitMismatch = !!cost.data?.unit && !!form.values.unit_id && form.values.unit_id !== cost.data.unit.id;

  return (
    <Modal opened={opened} onClose={onClose} title="Record Waste" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select label="Stock Item" searchable data={stockItemOptions} required {...form.getInputProps('stock_item_id')} />
          <Group grow align="flex-start">
            <NumberInput label="Quantity" min={0} decimalScale={3} required {...form.getInputProps('quantity')} />
            <Select label="Unit" data={unitOptions} required {...form.getInputProps('unit_id')} />
          </Group>

          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Value
            </Text>
            <SegmentedControl
              fullWidth
              data={[
                { value: 'auto', label: 'Work it out' },
                { value: 'manual', label: 'Enter it' },
              ]}
              {...form.getInputProps('value_mode')}
            />
            {form.values.value_mode === 'auto' ? (
              <Group justify="space-between" px="sm" py={8} style={{ background: '#F8F9FA', borderRadius: 8 }}>
                <Text size="xs" c="dimmed">
                  {cost.data
                    ? cost.data.unit_cost
                      ? `${formatCurrency(cost.data.unit_cost)} per ${cost.data.unit?.name?.toLowerCase() || 'unit'}${
                          cost.data.batch ? ` (${cost.data.batch.batch_ref})` : ''
                        }`
                      : 'No cost on record for this item'
                    : 'Pick an item'}
                </Text>
                <Text fw={700} style={{ color: '#C92A2A' }}>
                  {formatCurrency(autoValue)}
                </Text>
              </Group>
            ) : (
              <NumberInput label="Value (KES)" min={0} decimalScale={2} thousandSeparator="," {...form.getInputProps('cost_amount')} />
            )}
            {form.values.value_mode === 'auto' && unitMismatch && (
              <Text size="xs" style={{ color: '#D9480F' }}>
                Cost is per {cost.data?.unit?.name?.toLowerCase()}. Count in that unit, or enter the value yourself.
              </Text>
            )}
          </Stack>

          <TextInput label="Reason" placeholder="e.g. Spoilage, Burnt, Broken" required {...form.getInputProps('reason')} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="red" loading={create.isPending}>
              Record Waste
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
