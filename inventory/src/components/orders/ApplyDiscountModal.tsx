import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useApplyDiscount } from '@/hooks/useOrders';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  opened: boolean;
  onClose: () => void;
  billId: string;
  maxAmount: number;
}

export function ApplyDiscountModal({
  opened,
  onClose,
  billId,
  maxAmount,
}: Props) {
  const apply = useApplyDiscount(billId);

  const form = useForm({
    initialValues: {
      amount: 0,
      reason: '',
    },
    validate: {
      amount: (v) =>
        v > 0 ? (v <= maxAmount ? null : `Max is ${formatCurrency(maxAmount)}`) : 'Must be > 0',
      reason: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await apply.mutateAsync(values);
      notifications.show({
        color: 'green',
        title: 'Discount applied',
        message: `Discount of ${formatCurrency(values.amount)} applied.`,
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

  return (
    <Modal opened={opened} onClose={onClose} title="Apply Discount" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput
            label="Discount Amount (KES)"
            placeholder="e.g. 100"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('amount')}
          />
          <TextInput
            label="Reason"
            placeholder="e.g. Loyal customer"
            required
            {...form.getInputProps('reason')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={apply.isPending}>
              Apply
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}