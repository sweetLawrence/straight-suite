import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateAdjustment } from '@/hooks/useAdmin';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateAdjustmentModal({ opened, onClose }: Props) {
  const create = useCreateAdjustment();

  const form = useForm({
    initialValues: {
      adjustment_type: 'stock_correction' as
        | 'stock_correction'
        | 'cash_correction'
        | 'bill_correction'
        | 'payment_correction',
      original_entity_type: 'stock_ledger',
      original_entity_id: '',
      amount: 0,
      reason: '',
    },
    validate: {
      original_entity_id: (v) => (v ? null : 'Required'),
      reason: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const a = await create.mutateAsync({
        adjustment_type: values.adjustment_type,
        original_entity_type: values.original_entity_type,
        original_entity_id: values.original_entity_id,
        amount: values.amount || null,
        reason: values.reason,
      });
      notifications.show({
        color: 'green',
        title: 'Adjustment requested',
        message: `${a.adjustment_ref} pending approval`,
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
    <Modal
      opened={opened}
      onClose={onClose}
      title="Request Adjustment"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Type"
            data={[
              { value: 'stock_correction', label: 'Stock Correction' },
              { value: 'cash_correction', label: 'Cash Correction' },
              { value: 'bill_correction', label: 'Bill Correction' },
              { value: 'payment_correction', label: 'Payment Correction' },
            ]}
            {...form.getInputProps('adjustment_type')}
          />
          <TextInput
            label="Original Entity Type"
            placeholder="e.g. stock_ledger, cash_drop, bill"
            required
            {...form.getInputProps('original_entity_type')}
          />
          <TextInput
            label="Original Entity ID"
            placeholder="UUID of the entity being corrected"
            required
            {...form.getInputProps('original_entity_id')}
          />
          <NumberInput
            label="Amount (KES, optional)"
            decimalScale={2}
            {...form.getInputProps('amount')}
          />
          <Textarea
            label="Reason"
            placeholder="Why is this correction needed?"
            required
            autosize
            minRows={2}
            {...form.getInputProps('reason')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}