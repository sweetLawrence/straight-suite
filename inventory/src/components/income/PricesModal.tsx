import { useEffect, useState } from 'react';
import { Badge, Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useIncomePrices, useSetIncomePrice } from '@/hooks/useIncome';
import { useProperties } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import type { IncomePrice } from '@/lib/api/income';

/** Change the fixed price of each income stream. Only the manager, MD and admin can open this. */
export function PricesModal({ opened, onClose, groupLevel }: { opened: boolean; onClose: () => void; groupLevel: boolean }) {
  const properties = useProperties(1, 20);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const prices = useIncomePrices(groupLevel ? propertyId : undefined, opened && (!groupLevel || !!propertyId));
  const save = useSetIncomePrice();
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [group, setGroup] = useState<Record<string, number>>({});

  useEffect(() => {
    if (prices.data) {
      setDraft(Object.fromEntries(prices.data.map((p) => [p.stream, p.price])));
      setGroup(Object.fromEntries(prices.data.map((p) => [p.stream, p.group_price ?? 0])));
    }
  }, [prices.data]);

  const saveOne = async (p: IncomePrice) => {
    try {
      await save.mutateAsync({ stream: p.stream, price: draft[p.stream], group_price: p.can_group && group[p.stream] > 0 ? group[p.stream] : undefined, property_id: groupLevel ? propertyId ?? undefined : undefined });
      notifications.show({ color: 'green', title: 'Price saved', message: `${p.label}: KES ${draft[p.stream].toLocaleString()}` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Income prices" fullScreen={typeof window !== 'undefined' && window.innerWidth < 520}>
      <Stack>
        <Text size="xs" c="dimmed">The price of one session. Staff cannot change it when they record income.</Text>
        {groupLevel && (
          <Select label="Property" data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />
        )}
        {(prices.data ?? []).map((p) => (
          <Group key={p.stream} justify="space-between" wrap="nowrap" align="flex-end">
            <div style={{ minWidth: 0 }}>
              <Group gap={6}>
                <Text size="sm" fw={600}>{p.label}</Text>
                {p.is_default && <Badge size="xs" color="orange" variant="light">Sample price</Badge>}
              </Group>
              <Text size="xs" c="dimmed">per {p.unit}</Text>
              {p.can_group && (
                <NumberInput mt={4} size="xs" w={150} min={1} thousandSeparator="," prefix="KES " label={`Group of ${p.group_min}+ (each)`} value={group[p.stream] ?? 0} onChange={(v) => setGroup((g) => ({ ...g, [p.stream]: Number(v) || 0 }))} />
              )}
            </div>
            <Group gap={6} wrap="nowrap">
              <NumberInput w={120} min={1} thousandSeparator="," prefix="KES " value={draft[p.stream] ?? p.price} onChange={(v) => setDraft((d) => ({ ...d, [p.stream]: Number(v) || 0 }))} />
              <Button size="sm" disabled={!(draft[p.stream] > 0) || (draft[p.stream] === p.price && (group[p.stream] || 0) === (p.group_price ?? 0) && !p.is_default)} loading={save.isPending} onClick={() => saveOne(p)}>Save</Button>
            </Group>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
}
