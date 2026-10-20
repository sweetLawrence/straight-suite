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
import { useStockItems, useCreateBulkIssue, useLedgerSummary } from '@/hooks/useStock';
import { formatNumber } from '@/lib/utils/format';
import { useUnits } from '@/hooks/useCore';
import { ReasonField } from '@/components/ReasonField';
import { getErrorMessage } from '@/lib/api/client';

const REASONS = [ 'Kitchen daily issue','Lunch service', 'Dinner service', 'Breakfast / tea', 'Buffet', 'Event or booking', 'Staff meals'];

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateBulkIssueModal({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200, stock_model: 'bulk' });
  const balances = useLedgerSummary();
  const units = useUnits();
  const create = useCreateBulkIssue();

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      quantity: 0,
      unit_id: '',
      purpose: '',
    },
    validate: {
      stock_item_id: (v) => (v ? null : 'Required'),
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
      purpose: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await create.mutateAsync(values);
      notifications.show({
        color: 'green',
        title: 'Bulk issue recorded',
        message: 'Stock has been issued to the kitchen.',
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

  // Only kitchen supplies the store actually holds: food store or kitchen, active, in stock.
  // Bar items and empty lines stay out of the list.
  const balanceOf = new Map((balances.data ?? []).map((b) => [b.stock_item_id, Number(b.balance)]));
  const itemOptions = (stockItems.data?.data ?? [])
    .filter((s) => s.store_type !== 'bar_store' && s.status !== 'inactive' && (balanceOf.get(s.id) ?? 0) > 0)
    .sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || ''))
    .map((s) => ({
      value: s.id,
      label: `${s.item?.name || s.item?.code || 'Item'} (${formatNumber(balanceOf.get(s.id) ?? 0, 2)} ${s.item?.base_unit?.code ?? ''} in stock)`,
    }));

  const chosen = (stockItems.data?.data ?? []).find((x) => x.id === form.values.stock_item_id);
  const left = chosen ? balanceOf.get(chosen.id) ?? 0 : 0;

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="New Bulk Issue" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Bulk Item"
            placeholder="Select bulk stock item"
            searchable
            nothingFoundMessage="No kitchen supplies in stock"
            data={itemOptions}
            required
            {...form.getInputProps('stock_item_id')}
            onChange={(v) => {
              form.setFieldValue('stock_item_id', v ?? '');
              const si = (stockItems.data?.data ?? []).find((x) => x.id === v);
              if (si?.item?.base_unit?.id) form.setFieldValue("unit_id", si.item.base_unit.id);
            }}
          />
          <Group grow>
            <NumberInput
              label="Quantity"
              placeholder="e.g. 2"
              min={0}
              max={left || undefined}
              decimalScale={3}
              required
              description={chosen ? `${formatNumber(left, 2)} ${chosen.item?.base_unit?.code ?? ''} left in the store` : undefined}
              {...form.getInputProps('quantity')}
            />
            <Select
              label="Unit"
              placeholder="Unit"
              data={unitOptions}
              required
              {...form.getInputProps('unit_id')}
            />
          </Group>
          <ReasonField
            label="Purpose"
            required
            options={REASONS}
            value={form.values.purpose}
            onChange={(v) => form.setFieldValue('purpose', v)}
            error={form.errors.purpose}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Issue
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}