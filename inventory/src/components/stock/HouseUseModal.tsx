import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Crown } from 'lucide-react';
import { useLedgerSummary } from '@/hooks/useStock';
import { useRecordHouseUse } from '@/hooks/useOrderEdit';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency, formatQty } from '@/lib/utils/format';

/**
 * Stock the MD takes without paying. It leaves stock like a sale, is valued at
 * cost, and the MD and branch manager are notified.
 * `store` limits the list (bar page shows bar stock only).
 */
export function HouseUseModal({
  opened,
  onClose,
  store,
}: {
  opened: boolean;
  onClose: () => void;
  store?: 'bar_store' | 'food_store' | 'kitchen';
}) {
  const summary = useLedgerSummary();
  const save = useRecordHouseUse();
  const [itemId, setItemId] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (opened) {
      setItemId(null);
      setQty(1);
      setNotes('');
    }
  }, [opened]);

  const rows = useMemo(
    () =>
      (summary.data ?? [])
        .filter((r) => Number(r.balance) > 0)
        .filter((r) => !store || (r.stock_item as { store_type?: string } | null)?.store_type === store)
        .sort((a, b) => (a.item?.name || '').localeCompare(b.item?.name || '')),
    [summary.data, store]
  );
  const picked = rows.find((r) => r.stock_item_id === itemId);
  const max = picked ? Number(picked.balance) : undefined;

  const submit = async () => {
    if (!itemId) return;
    try {
      const r = await save.mutateAsync({ stock_item_id: itemId, quantity: qty, notes: notes.trim() || undefined });
      notifications.show({
        color: 'green',
        title: 'House use recorded',
        message: `${r.item} · ${formatQty(r.quantity)} · ${formatCurrency(r.cost)} at cost`,
      });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="House use (MD)">
      <Stack>
        <Alert variant="light" color="pink" icon={<Crown size={16} />}>
          <Text size="sm">Stock the MD takes without paying. It comes off stock and the MD is notified.</Text>
        </Alert>
        <Select
          label="Item"
          placeholder={summary.isLoading ? 'Loading…' : 'Search stock'}
          searchable
          nothingFoundMessage="Nothing in stock"
          data={rows.map((r) => ({
            value: r.stock_item_id,
            label: `${r.item?.name || 'Item'} (${formatQty(r.balance)} in stock)`,
          }))}
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
        <TextInput
          label="Note"
          placeholder="e.g. For the MD's guests"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!itemId || !(qty > 0) || (max != null && qty > max)}
            loading={save.isPending}
            onClick={submit}
          >
            Record
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
