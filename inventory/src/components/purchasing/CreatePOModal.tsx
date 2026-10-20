import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Card, Group, Modal, NumberInput, Select, SegmentedControl, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { Plus, Trash2 } from 'lucide-react';
import { useCreatePO } from '@/hooks/usePurchasing';
import { SupplierPicker } from './SupplierPicker';
import { useStockItems } from '@/hooks/useStock';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

export interface DraftLine {
  stock_item_id: string;
  quantity: number;
  unit_price: number;
}

/** Order from a supplier. Can be opened pre-filled from the reorder list. */
export function CreatePOModal({
  opened,
  onClose,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  initial?: { supplier_id?: string | null; lines: DraftLine[] };
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const groupLevel = auth.hasRole('md', 'admin');
  const items = useStockItems({ limit: 300 });
  const properties = useProperties(1, 20);
  const create = useCreatePO();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [expected, setExpected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  useEffect(() => {
    if (!opened) return;
    setSupplierId(initial?.supplier_id || null);
    setLines(initial?.lines?.length ? initial.lines : [{ stock_item_id: '', quantity: 0, unit_price: 0 }]);
    setExpected(null);
    setNotes('');
  }, [opened, initial]);

  const [side, setSide] = useState<'food' | 'bar'>('food');
  const itemOptions = useMemo(
    () =>
      (items.data?.data ?? [])
        .filter((s) => (s.store_type === 'bar_store') === (side === 'bar'))
        .filter((s) => !groupLevel || !propertyId || s.property_id === propertyId)
        .map((s) => ({ value: s.id, label: s.item?.name || 'Item' }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [items.data, groupLevel, propertyId, side]
  );
  // Items that arrive in packs (kg, birds) are ordered in packs; stored in portions
  const packOf = (id: string) => {
    const si = items.data?.data.find((x) => x.id === id);
    return si?.pack_size && Number(si.pack_size) > 0 ? { size: Number(si.pack_size), label: si.pack_label || 'pack' } : null;
  };
  const total = lines.reduce((a, l) => a + (l.quantity || 0) * (l.unit_price || 0), 0);
  const valid = !!supplierId && (!groupLevel || !!propertyId) && lines.length > 0 && lines.every((l) => l.stock_item_id && l.quantity > 0);
  const set = (i: number, patch: Partial<DraftLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const save = async () => {
    try {
      const po = await create.mutateAsync({
        supplier_id: supplierId!,
        property_id: groupLevel ? propertyId || undefined : undefined,
        expected_date: expected,
        notes: notes.trim() || undefined,
        lines,
      });
      notifications.show({ color: 'green', title: 'Order placed', message: `${po.po_ref} · ${formatCurrency(po.total)}` });
      onClose();
      navigate({ to: `/purchase-orders/${po.id}` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New purchase order" size="lg">
      <Stack>
        <SimpleGrid cols={{ base: 1, xs: groupLevel ? 3 : 2 }} spacing="sm">
          {groupLevel && (
            <Select
              label="Property"
              data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
              value={propertyId}
              onChange={setPropertyId}
            />
          )}
          <SupplierPicker value={supplierId} onChange={setSupplierId} />
          <DatePickerInput
            label="Expected"
            clearable
            minDate={new Date()}
            valueFormat="D MMM YYYY"
            value={expected}
            onChange={(v) => setExpected(v ? dayjs(v).format('YYYY-MM-DD') : null)}
          />
        </SimpleGrid>

        <SegmentedControl fullWidth value={side} onChange={(v) => setSide(v as 'food' | 'bar')} data={[{ value: 'food', label: 'Food & kitchen' }, { value: 'bar', label: 'Bar' }]} />
        {lines.map((l, i) => (
          <Card key={i} withBorder radius="md" p="sm">
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap" align="flex-end">
                <Select
                  label={i === 0 ? 'Item' : undefined}
                  searchable
                  placeholder="Item"
                  data={itemOptions}
                  value={l.stock_item_id || null}
                  onChange={(v) => set(i, { stock_item_id: v || '' })}
                  style={{ flex: 1 }}
                />
                {lines.length > 1 && (
                  <ActionIcon variant="subtle" color="red" size="lg" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))}>
                    <Trash2 size={16} />
                  </ActionIcon>
                )}
              </Group>
              <SimpleGrid cols={2} spacing="xs">
                {(() => {
                  const pk = packOf(l.stock_item_id);
                  const f = pk ? pk.size : 1;
                  return (
                    <>
                      <NumberInput label={pk ? `Quantity (${pk.label})` : 'Quantity'} min={0} decimalScale={3}
                        value={l.quantity ? Math.round((l.quantity / f) * 1000) / 1000 : 0} onChange={(v) => set(i, { quantity: (Number(v) || 0) * f })} />
                      <NumberInput
                        label={pk ? `Price per ${pk.label}` : 'Price per unit'}
                        min={0}
                        decimalScale={2}
                        thousandSeparator=","
                        value={l.unit_price ? Math.round(l.unit_price * f * 100) / 100 : 0}
                        onChange={(v) => set(i, { unit_price: (Number(v) || 0) / f })}
                      />
                    </>
                  );
                })()}
              </SimpleGrid>
            </Stack>
          </Card>
        ))}
        <Button variant="light" leftSection={<Plus size={16} />} onClick={() => setLines((ls) => [...ls, { stock_item_id: '', quantity: 0, unit_price: 0 }])}>
          Add item
        </Button>
        <TextInput label="Note" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        <Group justify="space-between">
          <Text fw={700}>Total {formatCurrency(total)}</Text>
          <Group gap="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!valid} loading={create.isPending} onClick={save}>
              Place order
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
