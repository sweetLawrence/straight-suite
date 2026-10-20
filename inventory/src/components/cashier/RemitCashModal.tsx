import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, Group, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertTriangle, Info } from 'lucide-react';
import { useCreateRemittance } from '@/hooks/useCashier';
import { getErrorMessage } from '@/lib/api/client';
import type { Holding, PayMethod } from '@/lib/api/cashier';
import { formatCurrency } from '@/lib/utils/format';
import { METHOD_OF } from './CashParts';

type Pick = { on: boolean; amount: number };

/**
 * Hand money to the MD. Tick one method to hand it over on its own, or several
 * to combine them in one handover. Amounts start at what the system says you hold.
 */
export function RemitCashModal({
  opened,
  onClose,
  holdings,
  only,
}: {
  opened: boolean;
  onClose: () => void;
  holdings: Holding[];
  /** Open with just this method ticked */
  only?: PayMethod | null;
}) {
  const create = useCreateRemittance();
  const held = useMemo(() => holdings.filter((h) => h.in_hand > 0.009), [holdings]);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (opened) {
      setPicks(Object.fromEntries(held.map((h) => [h.method, { on: only ? h.method === only : true, amount: h.in_hand }])));
      setNotes('');
    }
  }, [opened, held, only]);

  const set = (m: string, patch: Partial<Pick>) => setPicks((p) => ({ ...p, [m]: { ...p[m], ...patch } }));
  const chosen = held.filter((h) => picks[h.method]?.on && picks[h.method].amount > 0);
  const total = Math.round(chosen.reduce((a, h) => a + picks[h.method].amount, 0) * 100) / 100;
  const over = held.filter((h) => picks[h.method]?.on && picks[h.method].amount > h.in_hand + 0.009);
  const kept = chosen.reduce((a, h) => a + Math.max(0, h.in_hand - picks[h.method].amount), 0);

  const save = async () => {
    try {
      const r = await create.mutateAsync({
        lines: chosen.map((h) => ({ method: h.method, amount: picks[h.method].amount })),
        notes: notes.trim() || undefined,
      });
      notifications.show({ color: 'green', title: 'Handed over', message: `${r.remit_ref} is waiting for the MD to confirm` });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Hand money to the MD">
      <Stack>
        {held.length === 0 ? (
          <Alert variant="light" color="gray">You are not holding anything right now.</Alert>
        ) : (
          <>
            <Alert variant="light" color="blue" icon={<Info size={16} />}>
              <Text size="sm">
                Tick what you are handing over now. One method on its own, or several together. Cash is counted; for M-Pesa,
                card and the rest the MD checks the account or statement.
              </Text>
            </Alert>
            <Group gap="xs">
              <Button size="compact-xs" variant="light" onClick={() => setPicks(Object.fromEntries(held.map((h) => [h.method, { on: true, amount: h.in_hand }])))}>
                Everything
              </Button>
              {held.map((h) => (
                <Button
                  key={h.method}
                  size="compact-xs"
                  variant="default"
                  onClick={() => setPicks(Object.fromEntries(held.map((x) => [x.method, { on: x.method === h.method, amount: x.in_hand }])))}
                >
                  {METHOD_OF[h.method].label} only
                </Button>
              ))}
            </Group>
            <Stack gap="xs">
              {held.map((h) => {
                const m = METHOD_OF[h.method];
                const p = picks[h.method] || { on: false, amount: 0 };
                const tooMuch = p.on && p.amount > h.in_hand + 0.009;
                return (
                  <Box key={h.method} p="sm" style={{ border: `1px solid ${p.on ? m.color : '#DEE2E6'}`, borderRadius: 8, background: p.on ? m.bg : '#FFFFFF' }}>
                    <Group justify="space-between" wrap="nowrap" gap="sm">
                      <Checkbox
                        checked={p.on}
                        onChange={(e) => set(h.method, { on: e.currentTarget.checked })}
                        label={<Text fw={700} style={{ color: m.color }}>{m.label}</Text>}
                        description={`You hold ${formatCurrency(h.in_hand)}`}
                      />
                      <NumberInput
                        w={150}
                        disabled={!p.on}
                        min={0}
                        decimalScale={2}
                        thousandSeparator=","
                        prefix="KES "
                        value={p.amount}
                        onChange={(v) => set(h.method, { amount: Number(v) || 0 })}
                        error={tooMuch ? 'More than you hold' : undefined}
                      />
                    </Group>
                  </Box>
                );
              })}
            </Stack>
            {kept > 0.009 && over.length === 0 && (
              <Alert variant="light" color="orange" icon={<AlertTriangle size={16} />}>
                <Text size="sm">{formatCurrency(kept)} of the ticked methods stays with you and shows as still held.</Text>
              </Alert>
            )}
            <Textarea
              label="Note"
              placeholder="e.g. End of day, counted with the supervisor"
              autosize
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
          </>
        )}
        <Stack gap="xs">
          <Button fullWidth size="md" disabled={!(total > 0) || over.length > 0} loading={create.isPending} onClick={save}>
            Hand over {total > 0 ? formatCurrency(total) : ''}
          </Button>
          {chosen.length > 1 && <Text size="xs" c="dimmed" ta="center">{chosen.length} methods in one handover</Text>}
          <Button fullWidth variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
