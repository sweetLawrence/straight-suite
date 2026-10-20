import { useState } from 'react';
import { Box, Button, Card, Group, Modal, NumberInput, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Droplet, GlassWater } from 'lucide-react';
import { useSetupTots, useWasteTots } from '@/hooks/useBarStock';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { DrinkTots } from '@/lib/api/barStock';
import { formatCurrency } from '@/lib/utils/format';

const WINE = '#862E9C';

/** Tot set-up and the open bottle, at the top of a drink's history drawer */
export function TotsPanel({ drinkId, name, tots }: { drinkId: string; name: string; tots: DrinkTots | null }) {
  const auth = useAuth();
  const canSetup = auth.hasPermission('menu.manage');
  const canSpill = auth.hasPermission('bar.issue');
  const setup = useSetupTots();
  const waste = useWasteTots();
  const [editing, setEditing] = useState(false);
  const [spilling, setSpilling] = useState(false);
  const [per, setPer] = useState<number>(tots?.tots_per_bottle ?? 30);
  const [price, setPrice] = useState<number>(tots?.tot_price ?? 0);
  const [label, setLabel] = useState(tots?.tot_name ?? `${name.replace(/\s*\(bottle\)\s*$/i, '')} (tot)`);
  const [spill, setSpill] = useState<number>(1);
  const [reason, setReason] = useState('');

  if (!tots && !canSetup) return null;

  const save = async () => {
    try {
      await setup.mutateAsync({ stock_item_id: drinkId, tots_per_bottle: per, tot_price: price, name: label.trim() || undefined });
      notifications.show({ color: 'green', title: 'Saved', message: `${label} is on the menu at ${formatCurrency(price)}` });
      setEditing(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };
  const doSpill = async () => {
    try {
      const r = await waste.mutateAsync({ stock_item_id: drinkId, tots: spill, reason: reason.trim() });
      notifications.show({ color: 'orange', title: 'Recorded as waste', message: `${formatCurrency(r.cost)} · ${r.tots_left} tots left` });
      setSpilling(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <Card withBorder radius="md" p="sm" mb="md" style={{ background: '#F8F0FC' }}>
        {tots ? (
          <Stack gap={6}>
            <Group justify="space-between" wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <GlassWater size={16} color={WINE} />
                <Text size="sm" fw={700} style={{ color: WINE }}>
                  {tots.tot_name} · {formatCurrency(tots.tot_price)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">{tots.tots_per_bottle} per bottle</Text>
            </Group>
            <Box h={8} style={{ background: '#E5DBFF', borderRadius: 4, overflow: 'hidden' }}>
              <Box h="100%" style={{ width: `${(tots.open_tots_left / tots.tots_per_bottle) * 100}%`, background: WINE }} />
            </Box>
            <Text size="xs" c="dimmed">
              {tots.open_tots_left > 0
                ? `Open bottle: ${tots.open_tots_left} of ${tots.tots_per_bottle} tots left. A new bottle opens when it runs out.`
                : `No bottle open yet. To sell, add "${tots.tot_name}" to an order (or Sell at the bar), then pour it from Bar Orders. The first tot opens a bottle.`}
            </Text>
            <Group gap="xs">
              {canSpill && tots.open_tots_left > 0 && (
                <Button size="xs" variant="light" color="red" leftSection={<Droplet size={14} />} onClick={() => { setSpill(1); setReason(''); setSpilling(true); }}>
                  Spilled tots
                </Button>
              )}
              {canSetup && <Button size="xs" variant="subtle" onClick={() => setEditing(true)}>Change price</Button>}
            </Group>
          </Stack>
        ) : (
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">Sell this by the tot or glass?</Text>
            <Button size="xs" color="grape" onClick={() => setEditing(true)}>Set up tots</Button>
          </Group>
        )}
      </Card>

      <Modal opened={editing} onClose={() => setEditing(false)} title={`Sell ${name} by the tot`}>
        <Stack>
          <TextInput label="Name on the menu" value={label} onChange={(e) => setLabel(e.currentTarget.value)} />
          <Group grow>
            <NumberInput label="Tots per bottle" description="750 ml ÷ 25 ml = 30" min={2} max={200} allowDecimal={false} value={per} onChange={(v) => setPer(Number(v) || 0)} />
            <NumberInput label="Price per tot" min={0} thousandSeparator="," value={price} onChange={(v) => setPrice(Number(v) || 0)} />
          </Group>
          <Text size="xs" c="dimmed">The bottle stays on the menu as it is. Waiters can now also order single tots.</Text>
          <Button disabled={per < 2 || price <= 0} loading={setup.isPending} onClick={save}>Save</Button>
        </Stack>
      </Modal>

      <Modal opened={spilling} onClose={() => setSpilling(false)} title="Spilled or given away">
        <Stack>
          <NumberInput label="Tots" min={1} max={tots?.open_tots_left} allowDecimal={false} value={spill} onChange={(v) => setSpill(Number(v) || 0)} />
          <TextInput label="Reason" placeholder="e.g. Glass dropped" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          <Button color="red" disabled={spill < 1 || reason.trim().length < 3} loading={waste.isPending} onClick={doSpill}>Record waste</Button>
        </Stack>
      </Modal>
    </>
  );
}
