import { useState } from 'react';
import { ActionIcon, Button, Card, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus, Trash2 } from 'lucide-react';
import { useProperties } from '@/hooks/useCore';
import { useRoomTypes, useSaveRoomType } from '@/hooks/useRoomTypes';
import { getErrorMessage } from '@/lib/api/client';
import type { RoomType } from '@/lib/api/roomTypes';

type Draft = { id?: string; name: string; bb_price: number; hb_price: number; fb_price: number };

/** Room types and their rates per person per night. Manager, MD and admin edit; everyone else only sees them in the stay form. */
export function RoomTypesPanel({ groupLevel }: { groupLevel: boolean }) {
  const props = useProperties(1, 20);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const list = useRoomTypes(groupLevel ? propertyId : undefined, !groupLevel || !!propertyId);
  const save = useSaveRoomType();
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [adding, setAdding] = useState<Draft | null>(null);

  const row = (r: RoomType): Draft => draft[r.id] ?? { id: r.id, name: r.name, bb_price: r.bb_price, hb_price: r.hb_price, fb_price: r.fb_price };
  const patch = (r: RoomType, p: Partial<Draft>) => setDraft((d) => ({ ...d, [r.id]: { ...row(r), ...p } }));
  const go = async (v: Draft, status?: 'retired') => {
    try {
      await save.mutateAsync({ ...v, status, property_id: groupLevel && !v.id ? propertyId ?? undefined : undefined });
      notifications.show({ color: 'green', title: status ? 'Removed' : 'Saved', message: v.name });
      if (v.id) setDraft((d) => { const n = { ...d }; delete n[v.id!]; return n; });
      else setAdding(null);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };
  const num = (value: number, onChange: (n: number) => void, label: string) => (
    <NumberInput size="xs" label={label} min={0} thousandSeparator="," value={value || ''} onChange={(x) => onChange(Number(x) || 0)} style={{ flex: 1, minWidth: 80 }} />
  );

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">Price per person per night. Children 4 to 12 pay half, 3 and under are free.</Text>
      {groupLevel && <Select label="Property" data={(props.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />}
      {(list.data ?? []).map((r) => {
        const v = row(r);
        const changed = !!draft[r.id];
        return (
          <Card key={r.id} withBorder radius="md" p="sm">
            <Group justify="space-between" wrap="nowrap" mb={6}>
              <TextInput size="xs" value={v.name} onChange={(e) => patch(r, { name: e.currentTarget.value })} style={{ flex: 1 }} />
              <ActionIcon variant="subtle" color="red" onClick={() => window.confirm(`Remove ${r.name}?`) && go(v, 'retired')}><Trash2 size={16} /></ActionIcon>
            </Group>
            <Group gap={6} wrap="wrap" align="flex-end">
              {num(v.bb_price, (n) => patch(r, { bb_price: n }), 'Bed & Breakfast')}
              {num(v.hb_price, (n) => patch(r, { hb_price: n }), 'Half Board')}
              {num(v.fb_price, (n) => patch(r, { fb_price: n }), 'Full Board')}
              <Button size="xs" disabled={!changed || !v.name.trim()} loading={save.isPending} onClick={() => go(v)}>Save</Button>
            </Group>
            {r.note && <Text size="xs" c="dimmed" mt={4}>{r.note}</Text>}
          </Card>
        );
      })}
      {adding ? (
        <Card withBorder radius="md" p="sm">
          <TextInput size="xs" label="Room type" placeholder="e.g. Standard Twin" value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.currentTarget.value })} mb={6} />
          <Group gap={6} wrap="wrap" align="flex-end">
            {num(adding.bb_price, (n) => setAdding({ ...adding, bb_price: n }), 'Bed & Breakfast')}
            {num(adding.hb_price, (n) => setAdding({ ...adding, hb_price: n }), 'Half Board')}
            {num(adding.fb_price, (n) => setAdding({ ...adding, fb_price: n }), 'Full Board')}
            <Button size="xs" disabled={!adding.name.trim() || (groupLevel && !propertyId)} loading={save.isPending} onClick={() => go(adding)}>Add</Button>
            <Button size="xs" variant="default" onClick={() => setAdding(null)}>Cancel</Button>
          </Group>
        </Card>
      ) : (
        <Button variant="default" size="xs" leftSection={<Plus size={14} />} disabled={groupLevel && !propertyId} onClick={() => setAdding({ name: '', bb_price: 0, hb_price: 0, fb_price: 0 })}>Add a room type</Button>
      )}
    </Stack>
  );
}
