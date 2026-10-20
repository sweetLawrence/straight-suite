    import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useCreateCashDrop, usePayments } from '@/hooks/usePayments';
import { useToDrop } from '@/hooks/useIncomeDrops';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import { useAuth } from '@/lib/auth/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
}

interface DropLine {
  bill_id: string;
  payment_line_id: string;
  amount: number;
}

export function RecordCashDropModal({ opened, onClose }: Props) {
  const auth = useAuth();
  const create = useCreateCashDrop();

  const toDrop = useToDrop(opened);
  const payments = usePayments({
    waiter_id: auth.user?.id,
    limit: 100,
  });

  const cashLineOptions = useMemo(() => {
    const opts: Array<{
      value: string;
      label: string;
      billId: string;
      amount: number;
    }> = [];
    payments.data?.data.forEach((p) => {
      p.payment_lines?.forEach((l) => {
        // Only cash not yet handed over: lines already in a drop are left out
        if (l.method === 'cash' && l.verification_status !== 'verified' && (toDrop.data?.cash_line_ids ?? []).includes(l.id)) {
          opts.push({
            value: l.id,
            label: `${p.bill?.bill_ref || p.payment_ref} - ${formatCurrency(l.amount)}`,
            billId: p.bill_id,
            amount: parseFloat(l.amount),
          });
        }
      });
    });
    return opts;
  }, [payments.data, toDrop.data]);

  const form = useForm({
    initialValues: {
      receiver_role: 'cashier' as 'cashier' | 'supervisor' | 'manager',
      notes: '',
      lines: [] as DropLine[],
    },
    validate: {
      lines: {
        payment_line_id: (v) => (v ? null : 'Required'),
        amount: (v) => (v > 0 ? null : 'Must be > 0'),
      },
    },
  });

  // Auto-add the first line when options become available
  useEffect(() => {
    if (opened && cashLineOptions.length > 0 && form.values.lines.length === 0) {
      const first = cashLineOptions[0];
      form.setValues({
        receiver_role: 'cashier',
        notes: '',
        lines: [
          {
            bill_id: first.billId,
            payment_line_id: first.value,
            amount: first.amount,
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, cashLineOptions.length]);

  const total = form.values.lines.reduce(
    (sum, l) => sum + (parseFloat(String(l.amount)) || 0),
    0
  );

  const handleSubmit = async (values: typeof form.values) => {
    if (values.lines.length === 0) {
      notifications.show({
        color: 'red',
        title: 'No lines',
        message: 'Add at least one cash line to drop.',
      });
      return;
    }

    // Sanity check: no empty payment_line_id
    const invalid = values.lines.find((l) => !l.payment_line_id);
    if (invalid) {
      notifications.show({
        color: 'red',
        title: 'Incomplete line',
        message: 'Each line must reference a cash payment line.',
      });
      return;
    }

    try {
      const drop = await create.mutateAsync({
        receiver_role: values.receiver_role,
        notes: values.notes || undefined,
        cash_drop_lines: values.lines.map((l) => ({
          bill_id: l.bill_id,
          payment_line_id: l.payment_line_id,
          amount: l.amount,
        })),
      });
      notifications.show({
        color: 'green',
        title: 'Cash drop recorded',
        message: `${drop.drop_ref} - ${formatCurrency(drop.total_amount)} pending confirmation`,
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
    <Modal opened={opened} onClose={onClose} title="Record Cash Drop" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            <Text size="sm">
              You are dropping cash to the cashier. The drop will be pending
              until the receiver confirms. Each line must reference an
              unverified cash payment line.
            </Text>
          </Alert>

          <Select
            label="Received By Role"
            data={[
              { value: 'cashier', label: 'Cashier' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'manager', label: 'Manager' },
            ]}
            {...form.getInputProps('receiver_role')}
          />

          {form.values.lines.map((line, idx) => (
            <Card key={idx} withBorder padding="sm">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Line {idx + 1}
                  </Text>
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-sm"
                    onClick={() => form.removeListItem('lines', idx)}
                    leftSection={<Trash2 size={14} />}
                  >
                    Remove
                  </Button>
                </Group>

                <Select
                  label="Cash Payment Line"
                  placeholder="Select a payment line"
                  searchable
                  data={cashLineOptions}
                  value={line.payment_line_id || ''}
                  onChange={(v) => {
                    const opt = cashLineOptions.find((o) => o.value === v);
                    if (opt) {
                      form.setFieldValue(
                        `lines.${idx}.payment_line_id`,
                        opt.value
                      );
                      form.setFieldValue(`lines.${idx}.bill_id`, opt.billId);
                      form.setFieldValue(`lines.${idx}.amount`, opt.amount);
                    } else {
                      form.setFieldValue(`lines.${idx}.payment_line_id`, '');
                      form.setFieldValue(`lines.${idx}.bill_id`, '');
                      form.setFieldValue(`lines.${idx}.amount`, 0);
                    }
                  }}
                  error={
                    (form.errors as Record<string, unknown>)[
                      `lines.${idx}.payment_line_id`
                    ] as string | undefined
                  }
                />

                <NumberInput
                  label="Amount"
                  min={0}
                  decimalScale={2}
                  {...form.getInputProps(`lines.${idx}.amount`)}
                />
              </Stack>
            </Card>
          ))}

          {cashLineOptions.length > 0 && (
            <Button
              variant="light"
              leftSection={<Plus size={16} />}
              onClick={() =>
                form.insertListItem('lines', {
                  bill_id: '',
                  payment_line_id: '',
                  amount: 0,
                })
              }
            >
              Add line
            </Button>
          )}

          {cashLineOptions.length === 0 && (
            <Alert color="yellow" variant="light">
              <Text size="sm">
                You have no unverified cash payment lines to drop.
              </Text>
            </Alert>
          )}

          <Divider />

          <Text fw={600} size="sm">
            Total: {formatCurrency(total)}
          </Text>

          <TextInput
            label="Notes (optional)"
            placeholder="Any remarks"
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={create.isPending}
              disabled={form.values.lines.length === 0}
            >
              Record Drop
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}