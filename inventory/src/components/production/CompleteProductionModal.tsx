import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AlertTriangle } from 'lucide-react';
import { useCompleteProductionBatch } from '@/hooks/useProduction';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
  batchId: string;
  expectedOutput: number;
}

export function CompleteProductionModal({
  opened,
  onClose,
  batchId,
  expectedOutput,
}: Props) {
  const complete = useCompleteProductionBatch(batchId);

  const form = useForm({
    initialValues: {
      actual_output_qty: expectedOutput,
      notes: '',
    },
    validate: {
      actual_output_qty: (v) => (v > 0 ? null : 'Must be > 0'),
    },
  });

  const variance =
    (form.values.actual_output_qty || 0) - expectedOutput;
  const variancePct =
    expectedOutput > 0
      ? parseFloat(((variance / expectedOutput) * 100).toFixed(2))
      : 0;

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await complete.mutateAsync({
        actual_output_qty: values.actual_output_qty,
        notes: values.notes || undefined,
      });
      notifications.show({
        color: 'green',
        title: 'Production completed',
        message:
          Math.abs(variancePct) > 0
            ? `Variance: ${variancePct}%`
            : 'No variance',
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
      title="Complete Production"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<AlertTriangle size={16} />} color="yellow" variant="light">
            <Stack gap={2}>
              <Text size="sm">
                Expected: <strong>{expectedOutput}</strong>
              </Text>
              <Text size="sm" c={Math.abs(variancePct) > 5 ? 'red' : undefined}>
                Current variance: <strong>{variancePct}%</strong>
              </Text>
            </Stack>
          </Alert>

          <NumberInput
            label="Actual Output Quantity"
            min={1}
            required
            {...form.getInputProps('actual_output_qty')}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="e.g. Dough stuck to bowl"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={complete.isPending}>
              Complete
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}