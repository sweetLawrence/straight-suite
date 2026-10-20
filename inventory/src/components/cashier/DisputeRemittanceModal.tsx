import { useEffect, useState } from 'react';
import { Button, Group, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDecideRemittance } from '@/hooks/useCashier';
import { getErrorMessage } from '@/lib/api/client';
import type { Remittance } from '@/lib/api/cashier';
import { formatCurrency } from '@/lib/utils/format';
import { METHOD_OF } from './CashParts';

/** MD counted (or saw in the account) something different from what the cashier said, per method */
export function DisputeRemittanceModal({ remittance, onClose }: { remittance: Remittance | null; onClose: () => void }) {
  const decide = useDecideRemittance();
  const [counted, setCounted] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (remittance) {
      setCounted(Object.fromEntries(remittance.lines.map((l) => [l.method, l.amount])));
      setReason('');
    }
  }, [remittance]);

  const lines = remittance?.lines ?? [];
  const total = Math.round(lines.reduce((a, l) => a + (counted[l.method] ?? l.amount), 0) * 100) / 100;
  const short = remittance ? Math.round((remittance.amount - total) * 100) / 100 : 0;

  const save = async () => {
    if (!remittance) return;
    try {
      await decide.mutateAsync({
        id: remittance.id,
        decision: 'dispute',
        received_amount: total,
        lines: lines.map((l) => ({ method: l.method, received_amount: counted[l.method] ?? l.amount })),
        reason: reason.trim(),
      });
      notifications.show({ color: 'orange', title: 'Disputed', message: remittance.remit_ref });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={!!remittance} onClose={onClose} title={remittance ? `Dispute ${remittance.remit_ref}` : ''}>
      {remittance && (
        <Stack>
          <Text size="sm" c="dimmed">
            {remittance.cashier?.full_name} says they handed over {formatCurrency(remittance.amount)}. Enter what you got for each.
          </Text>
          {lines.map((l) => (
            <NumberInput
              key={l.method}
              label={`${METHOD_OF[l.method]?.label ?? l.method}: handed ${formatCurrency(l.amount)}`}
              min={0}
              decimalScale={2}
              thousandSeparator=","
              prefix="KES "
              value={counted[l.method] ?? l.amount}
              onChange={(v) => setCounted((c) => ({ ...c, [l.method]: Number(v) || 0 }))}
            />
          ))}
          {short !== 0 && (
            <Text size="sm" fw={600} style={{ color: short > 0 ? '#C92A2A' : '#2B8A3E' }}>
              {short > 0 ? `Short by ${formatCurrency(short)}` : `Over by ${formatCurrency(-short)}`}
            </Text>
          )}
          <Textarea
            label="What was wrong"
            placeholder="e.g. Counted twice, KES 500 missing"
            required
            autosize
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button color="red" disabled={reason.trim().length < 3} loading={decide.isPending} onClick={save}>
              Dispute
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
