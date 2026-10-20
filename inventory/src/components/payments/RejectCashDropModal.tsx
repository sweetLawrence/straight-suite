import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AlertTriangle } from 'lucide-react';
import { useRejectCashDrop } from '@/hooks/usePayments';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { CashDrop } from '@/lib/api/payments';

interface Props {
  opened: boolean;
  onClose: () => void;
  drop: CashDrop | null;
}

export function RejectCashDropModal({ opened, onClose, drop }: Props) {
  const reject = useRejectCashDrop();

  const form = useForm({
    initialValues: {
      reason: '',
    },
    validate: {
      reason: (v) => (v.trim() ? null : 'Reason is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!drop) return;
    try {
      await reject.mutateAsync({
        id: drop.id,
        data: { reason: values.reason },
      });
      notifications.show({
        color: 'orange',
        title: 'Cash drop rejected',
        message: `${drop.drop_ref} marked as disputed`,
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

  if (!drop) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Reject Cash Drop">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<AlertTriangle size={16} />} color="red" variant="light">
            <Text size="sm">
              Rejecting {drop.drop_ref} from {drop.waiter?.full_name} for{' '}
              {formatCurrency(drop.total_amount)}.
            </Text>
          </Alert>

          <Textarea
            label="Reason for rejection"
            placeholder="e.g. Amount is short by 100"
            required
            autosize
            minRows={3}
            {...form.getInputProps('reason')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="red" loading={reject.isPending}>
              Reject
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}