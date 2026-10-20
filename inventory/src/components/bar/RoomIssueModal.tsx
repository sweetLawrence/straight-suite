import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, Group, Modal, NumberInput, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLedgerSummary } from '@/hooks/useStock';
import { useCreateRoomIssue } from '@/hooks/useRoomIssues';
import { useVenues } from '@/hooks/useIncome';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency, formatQty } from '@/lib/utils/format';

/** Send a drink from the bar to a guest room. Stock leaves the bar now. */
export function RoomIssueModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const summary = useLedgerSummary();
  const save = useCreateRoomIssue();
  const rooms = useVenues('room');
  const [itemId, setItemId] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [room, setRoom] = useState('');
  const [guest, setGuest] = useState('');
  const [charge, setCharge] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (opened) {
      setItemId(null);
      setQty(1);
      setRoom('');
      setGuest('');
      setCharge(true);
      setNote('');
    }
  }, [opened]);

  const rows = useMemo(
    () =>
      (summary.data ?? [])
        .filter((r) => Number(r.balance) > 0)
        .filter((r) => (r.stock_item as { store_type?: string } | null)?.store_type === 'bar_store')
        .sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || '')),
    [summary.data]
  );
  const picked = rows.find((r) => r.stock_item_id === itemId);
  const max = picked ? Number(picked.balance) : undefined;
  const valid = !!itemId && qty > 0 && (max == null || qty <= max) && room.trim().length > 0;

  const submit = async () => {
    if (!itemId) return;
    try {
      const r = await save.mutateAsync({
        stock_item_id: itemId,
        quantity: qty,
        room: room.trim(),
        guest_name: guest.trim() || undefined,
        charge_to_room: charge,
        note: note.trim() || undefined,
      });
      notifications.show({
        color: 'green',
        title: `Sent to room ${r.room}`,
        message: `${r.item} · ${formatQty(r.quantity)}${charge && r.sell_amount != null ? ` · ${formatCurrency(r.sell_amount)} to charge` : ''}`,
      });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Send to a room">
      <Stack>
        <Autocomplete label="Room" placeholder="Pick or type the room" required data={(rooms.data ?? []).map((x) => x.name)} value={room} onChange={setRoom} comboboxProps={{ withinPortal: true }} />
        <TextInput label="Guest (optional)" value={guest} onChange={(e) => setGuest(e.currentTarget.value)} />
        <Select
          label="Item"
          placeholder={summary.isLoading ? 'Loading…' : 'Search bar stock'}
          searchable
          nothingFoundMessage="Nothing in stock"
          data={rows.map((r) => ({ value: r.stock_item_id, label: `${r.item?.name || 'Item'} (${formatQty(r.balance)} in stock)` }))}
          value={itemId}
          onChange={setItemId}
          comboboxProps={{ withinPortal: true }}
        />
        <NumberInput
          label="Quantity"
          min={0.001}
          max={max}
          decimalScale={3}
          value={qty}
          onChange={(v) => setQty(Number(v) || 0)}
          error={max != null && qty > max ? `Only ${formatQty(max)} in stock` : undefined}
        />
        <Switch
          checked={charge}
          onChange={(e) => setCharge(e.currentTarget.checked)}
          label="Charge to the room bill"
          description={charge ? 'Reception sees it as "to bill" with the selling price.' : 'Not charged: logged as given free.'}
        />
        <TextInput label="Note (optional)" value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        {!charge && <Text size="xs" c="dimmed">Stock comes off the bar either way.</Text>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} loading={save.isPending} onClick={submit}>Send</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
