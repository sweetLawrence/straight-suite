import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateDispute } from '@/hooks/useOperations';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
  cashDropId?: string;
  paymentLineId?: string;
  defaultAmount?: number;
}

export function CreateDisputeModal({
  opened,
  onClose,
  cashDropId,
  paymentLineId,
  defaultAmount,
}: Props) {
  const create = useCreateDispute();

  const form = useForm({
    initialValues: {
      amount_disputed: defaultAmount || 0,
      waiter_statement: '',
      cashier_statement: '',
    },
    validate: {
      amount_disputed: (v) => (v > 0 ? null : 'Must be > 0'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const d = await create.mutateAsync({
        cash_drop_id: cashDropId || null,
        payment_line_id: paymentLineId || null,
        amount_disputed: values.amount_disputed,
        waiter_statement: values.waiter_statement || null,
        cashier_statement: values.cashier_statement || null,
      });
      notifications.show({
        color: 'green',
        title: 'Dispute raised',
        message: `${d.dispute_ref} awaiting resolution`,
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
    <Modal opened={opened} onClose={onClose} title="Raise Dispute" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput
            label="Amount in Dispute (KES)"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('amount_disputed')}
          />
          <Textarea
            label="Waiter Statement"
            placeholder="What the waiter says"
            autosize
            minRows={2}
            {...form.getInputProps('waiter_statement')}
          />
          <Textarea
            label="Cashier Statement"
            placeholder="What the cashier says"
            autosize
            minRows={2}
            {...form.getInputProps('cashier_statement')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Raise
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}