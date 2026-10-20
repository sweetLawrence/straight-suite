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
import { Info } from 'lucide-react';
import { useConfirmCashDrop } from '@/hooks/usePayments';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { CashDrop } from '@/lib/api/payments';
import { useAuth } from '@/lib/auth/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
  drop: CashDrop | null;
}

export function ConfirmCashDropModal({ opened, onClose, drop }: Props) {
  const confirm = useConfirmCashDrop();
  const auth = useAuth();

  const form = useForm({
    initialValues: {
      notes: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!drop) return;
    try {
      await confirm.mutateAsync({
        id: drop.id,
        data: {
          notes: values.notes || undefined,
        },
      });
      notifications.show({
        color: 'green',
        title: 'Cash drop confirmed',
        message: `${drop.drop_ref} - ${formatCurrency(drop.total_amount)} verified`,
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
    <Modal opened={opened} onClose={onClose} title="Confirm Cash Drop">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            <Stack gap={2}>
              <Text size="sm">
                Drop Ref: <strong>{drop.drop_ref}</strong>
              </Text>
              <Text size="sm">
                Waiter: <strong>{drop.waiter?.full_name || '-'}</strong>
              </Text>
              <Text size="sm">
                Amount: <strong>{formatCurrency(drop.total_amount)}</strong>
              </Text>
            </Stack>
          </Alert>

          <Text size="sm" c="dimmed">
            Confirming as <strong>{auth.user?.full_name}</strong>. Count the cash before confirming: this marks the
            waiter's cash payments as verified.
          </Text>

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
            <Button type="submit" loading={confirm.isPending}>
              Confirm Receipt
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}