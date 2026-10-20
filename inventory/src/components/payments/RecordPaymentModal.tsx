import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCreatePackage, useCreatePayment, useInHouse } from '@/hooks/usePayments';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

interface Props {
  opened: boolean;
  onClose: () => void;
  billId: string;
  billNetTotal: number;
}

interface Line {
  method: 'cash' | 'mpesa' | 'card' | 'cheque' | 'house' | 'other';
  amount: number;
  transaction_ref: string;
}

export function RecordPaymentModal({
  opened,
  onClose,
  billId,
  billNetTotal,
}: Props) {
  const create = useCreatePayment();
  const createPkg = useCreatePackage();
  const [mode, setMode] = useState<'pay' | 'package'>('pay');
  const [stayId, setStayId] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [covers, setCovers] = useState<number>(1);
  const stays = useInHouse(opened);
  const stay = stays.data?.find((x) => x.id === stayId);
  const mealsLeft = (m: string) => (stay ? stay.guests - (stay.used_today[m] ?? 0) : 0);

  const submitPackage = async () => {
    if (!stayId || !meal) return;
    try {
      const p = await createPkg.mutateAsync({ bill_id: billId, stay_id: stayId, meal, covers });
      notifications.show({ color: 'green', title: 'Covered by the room', message: `Payment ${p.payment_ref} created.` });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Not covered', message: getErrorMessage(err) });
    }
  };

  const form = useForm({
    initialValues: {
      lines: [
        { method: 'cash', amount: billNetTotal, transaction_ref: '' },
      ] as Line[],
    },
    validate: {
      lines: {
        amount: (v) => (v > 0 ? null : 'Must be > 0'),
        method: (v) => (v ? null : 'Required'),
        transaction_ref: (v, values, path) => {
          const idx = parseInt(path.split('.')[1], 10);
          const method = values.lines[idx]?.method;
          if (method === 'cash') return null;
          const ref = (v || '').trim().toUpperCase().replace(/\s+/g, '');
          if (method === 'mpesa')
            return /^[A-Z0-9]{10}$/.test(ref) ? null : 'The M-Pesa code is 10 letters/numbers, e.g. QK12AB34CD';
          if (method === 'card')
            return /^[A-Z0-9-]{4,30}$/.test(ref) ? null : 'Approval code or last 4 digits of the card';
          if (method === 'cheque')
            return /^[A-Z0-9-]{3,30}$/.test(ref) ? null : 'Cheque number, e.g. 000123';
          if (method === 'house')
            return (v || '').trim().length >= 3 ? null : 'Write who signed and why, e.g. MD, guest dinner';
          return (v || '').trim().length >= 3 ? null : 'Say how it was paid, e.g. bank transfer ref';
        },
      },
    },
  });

  // Reset defaults when modal opens or billNetTotal changes
  useEffect(() => {
    if (opened) {
      form.setValues({
        lines: [{ method: 'cash', amount: billNetTotal, transaction_ref: '' }],
      });
      setMode('pay'); setStayId(null); setMeal(null); setCovers(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, billNetTotal]);

  const total = form.values.lines.reduce(
    (sum, l) => sum + (parseFloat(String(l.amount)) || 0),
    0
  );
  const remaining = billNetTotal - total;
  const matches = Math.abs(remaining) < 0.01;

  const handleSubmit = async (values: typeof form.values) => {
    if (!matches) {
      notifications.show({
        color: 'red',
        title: 'Payment mismatch',
        message: `Payment total must equal ${formatCurrency(billNetTotal)}`,
      });
      return;
    }
    try {
      const payment = await create.mutateAsync({
        bill_id: billId,
        payment_lines: values.lines.map((l) => ({
          method: l.method,
          amount: l.amount,
          transaction_ref: l.transaction_ref || undefined,
        })),
      });
      const waiting = (payment.payment_lines ?? []).some(
        (l: { method: string; approval_status?: string | null }) => l.method === 'house' && l.approval_status === 'pending',
      );
      notifications.show(
        waiting
          ? { color: 'orange', title: 'Waiting for the manager', message: 'The signed bill stays open until the branch manager approves it.' }
          : { color: 'green', title: 'Payment recorded', message: `Payment ${payment.payment_ref} created.` },
      );
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
      title="Record Payment"
      size="lg"
    >
      <SegmentedControl
        fullWidth
        mb="sm"
        value={mode}
        onChange={(v) => setMode(v as 'pay' | 'package')}
        data={[{ value: 'pay', label: 'Pay' }, { value: 'package', label: 'Room package' }]}
      />
      {mode === 'package' ? (
        <Stack>
          <Text size="sm" c="dimmed">
            Guest meal covered by the room rate. Bill total {formatCurrency(billNetTotal)} is not collected. Anything the plan does not cover is billed normally.
          </Text>
          <Select
            label="Guest staying in house"
            placeholder={stays.data?.length ? 'Pick the guest' : 'No guests in house'}
            data={(stays.data ?? []).map((x) => ({
              value: x.id,
              label: `${x.guest_name || 'Guest'}${x.room ? ' · ' + x.room : ''} · ${x.room_type ?? ''} · ${x.plan.toUpperCase()}`,
            }))}
            value={stayId}
            onChange={(v) => { setStayId(v); setMeal(null); }}
          />
          {stay && (
            <>
              <Select
                label="Meal"
                data={stay.meals_allowed.map((m) => ({ value: m, label: `${m[0].toUpperCase()}${m.slice(1)} (${mealsLeft(m)} left today)` }))}
                value={meal}
                onChange={setMeal}
              />
              <NumberInput
                label="People eating"
                min={1}
                max={Math.max(1, meal ? mealsLeft(meal) : stay.guests)}
                value={covers}
                onChange={(v) => setCovers(Number(v) || 1)}
              />
            </>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button onClick={submitPackage} loading={createPkg.isPending} disabled={!stayId || !meal}>
              Cover with room
            </Button>
          </Group>
        </Stack>
      ) : (
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            <Stack gap={2}>
              <Text size="sm">
                Bill total: <strong>{formatCurrency(billNetTotal)}</strong>
              </Text>
              <Text size="sm">
                Allocated: <strong>{formatCurrency(total)}</strong>
              </Text>
              <Text size="sm" c={matches ? 'green' : 'red'} fw={500}>
                Remaining: {formatCurrency(remaining)}
              </Text>
            </Stack>
          </Alert>

          {form.values.lines.map((line, idx) => (
            <Card key={idx} withBorder padding="sm">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Line {idx + 1}
                  </Text>
                  {form.values.lines.length > 1 && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      onClick={() => form.removeListItem('lines', idx)}
                      leftSection={<Trash2 size={14} />}
                    >
                      Remove
                    </Button>
                  )}
                </Group>
                <Group grow align="flex-start" wrap="wrap">
                  <Select
                    label="Method"
                    data={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'mpesa', label: 'M-Pesa' },
                      { value: 'card', label: 'Card' },
                      { value: 'cheque', label: 'Cheque' },
                      { value: 'house', label: 'Signed (MD, no bill)' },
                      { value: 'other', label: 'Other' },
                    ]}
                    {...form.getInputProps(`lines.${idx}.method`)}
                    onChange={(v) => {
                      const m = (v || 'cash') as Line['method'];
                      form.setFieldValue(`lines.${idx}.method`, m);
                      if (m === 'house' && !(form.values.lines[idx].transaction_ref || '').trim())
                        form.setFieldValue(`lines.${idx}.transaction_ref`, 'MD signed, not payed');
                    }}
                  />
                  <NumberInput
                    label="Amount"
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps(`lines.${idx}.amount`)}
                  />
                </Group>
                {line.method !== 'cash' && (
                  <TextInput
                    label={
                      line.method === 'cheque'
                        ? 'Cheque number'
                        : line.method === 'house'
                        ? 'Who signed and why'
                        : 'Transaction Reference'
                    }
                    placeholder={
                      line.method === 'mpesa'
                        ? 'M-Pesa code, e.g. QK12AB34CD'
                        : line.method === 'card'
                        ? 'Last 4 digits or terminal ref'
                        : line.method === 'cheque'
                        ? 'e.g. 000123'
                        : line.method === 'house'
                        ? 'e.g. MD, guest dinner'
                        : 'Reference'
                    }
                    {...form.getInputProps(`lines.${idx}.transaction_ref`)}
                  />
                )}
                {line.method === 'cheque' && (
                  <Text size="xs" c="dimmed">
                    Stays pending until the cashier marks it cleared or bounced.
                  </Text>
                )}
                {line.method === 'house' && (
                  <Text size="xs" c="dimmed">
                    Signed: the bill is settled and no money is collected. The MD is notified, and it shows as house use in reports.
                  </Text>
                )}
              </Stack>
            </Card>
          ))}

          <Button
            variant="light"
            leftSection={<Plus size={16} />}
            onClick={() =>
              form.insertListItem('lines', {
                method: 'cash' as const,
                amount: Math.max(0, remaining),
                transaction_ref: '',
              })
            }
          >
            Add another line
          </Button>

          <Divider />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={create.isPending}
              disabled={!matches}
            >
              Record Payment
            </Button>
          </Group>
        </Stack>
      </form>
      )}
    </Modal>
  );
}