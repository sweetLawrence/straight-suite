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
import { useCreateException } from '@/hooks/useAdmin';
import { getErrorMessage } from '@/lib/api/client';

const EXCEPTION_TYPES = [
  { value: 'manual_review', label: 'Needs manual review' },
  { value: 'cash_variance', label: 'Cash short or over' },
  { value: 'unverified_mpesa', label: 'M-Pesa not verified' },
  { value: 'unverified_card', label: 'Card payment not verified' },
  { value: 'disputed_payment', label: 'Disputed payment' },
  { value: 'unpaid_bill', label: 'Unpaid bill' },
  { value: 'overdue_drop', label: 'Cash drop overdue' },
  { value: 'stock_variance', label: 'Stock count difference' },
  { value: 'negative_stock', label: 'Negative stock' },
  { value: 'production_variance', label: 'Production variance' },
  { value: 'transfer_short_receipt', label: 'Transfer received short' },
  { value: 'transfer_overdue', label: 'Transfer overdue' },
  { value: 'other', label: 'Other' },
];

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateExceptionModal({ opened, onClose }: Props) {
  const create = useCreateException();

  const form = useForm({
    initialValues: {
      exception_type: 'manual_review',
      severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
      reference_type: '',
      reference_id: '',
      description: '',
      amount: 0,
    },
    validate: {
      exception_type: (v) => (v ? null : 'Required'),
      description: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const e = await create.mutateAsync({
        exception_type: values.exception_type,
        severity: values.severity,
        reference_type: values.reference_type || null,
        reference_id: values.reference_id || null,
        description: values.description,
        amount: values.amount || null,
      });
      notifications.show({
        color: 'green',
        title: 'Exception created',
        message: e.exception_ref,
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
    <Modal opened={opened} onClose={onClose} title="Create Exception" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Exception Type"
            placeholder="What kind of problem is it?"
            required
            searchable
            data={EXCEPTION_TYPES}
            allowDeselect={false}
            {...form.getInputProps('exception_type')}
          />
          <Select
            label="Severity"
            data={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            {...form.getInputProps('severity')}
          />
          <TextInput
            label="Reference Type (optional)"
            placeholder="e.g. cash_drop"
            {...form.getInputProps('reference_type')}
          />
          <TextInput
            label="Reference ID (optional)"
            {...form.getInputProps('reference_id')}
          />
          <NumberInput
            label="Amount (optional)"
            decimalScale={2}
            {...form.getInputProps('amount')}
          />
          <Textarea
            label="Description"
            placeholder="Describe the exception"
            required
            autosize
            minRows={3}
            {...form.getInputProps('description')}
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