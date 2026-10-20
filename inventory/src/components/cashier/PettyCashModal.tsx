import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, NumberInput, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Info } from 'lucide-react';
import { useCreatePettyCash } from '@/hooks/useCashier';
import { useLedgerSummary } from '@/hooks/useStock';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

const CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'airtime', label: 'Airtime / data' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'gas', label: 'Gas / fuel' },
  { value: 'other', label: 'Other' },
];

/**
 * Cash paid out of what the cashier holds.
 * "Stock bought" also receives the stock into the store at that cost.
 */
export function PettyCashModal({ opened, onClose, inHand }: { opened: boolean; onClose: () => void; inHand: number }) {
  const create = useCreatePettyCash();
  const summary = useLedgerSummary();
  const [kind, setKind] = useState<'expense' | 'stock'>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>('transport');
  const [payee, setPayee] = useState('');
  const [receipt, setReceipt] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    if (opened) {
      setKind('expense');
      setAmount(0);
      setDescription('');
      setCategory('transport');
      setPayee('');
      setReceipt('');
      setItemId(null);
      setQty(0);
    }
  }, [opened]);

  // Every stock line at the property, whether or not there is any left
  const items = useMemo(
    () =>
      (summary.data ?? [])
        .map((r) => ({ value: r.stock_item_id, label: r.item?.name || 'Item' }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [summary.data]
  );

  const tooMuch = amount > inHand + 0.009;
  const valid =
    amount > 0 && !tooMuch && description.trim().length >= 3 && (kind === 'expense' || (!!itemId && qty > 0));

  const save = async () => {
    try {
      const r = await create.mutateAsync({
        kind,
        amount,
        description: description.trim(),
        category: kind === 'expense' ? category || 'other' : undefined,
        payee: payee.trim() || undefined,
        receipt_ref: receipt.trim() || undefined,
        stock_item_id: kind === 'stock' ? itemId || undefined : undefined,
        quantity: kind === 'stock' ? qty : undefined,
      });
      notifications.show({
        color: 'green',
        title: r.status === 'pending' ? 'Sent to the manager' : 'Petty cash recorded',
        message: r.status === 'pending' ? `${r.petty_ref} · the cash is paid out once the manager authorises it` : r.batch_ref ? `${r.petty_ref} · received into stock as ${r.batch_ref}` : r.petty_ref,
      });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Pay petty cash">
      <Stack>
        <SegmentedControl
          fullWidth
          value={kind}
          onChange={(v) => setKind(v as 'expense' | 'stock')}
          data={[
            { value: 'expense', label: 'Expense' },
            { value: 'stock', label: 'Stock bought' },
          ]}
        />
        <Text size="xs" c="dimmed">
          Comes out of the {formatCurrency(inHand)} you hold.
          {kind === 'stock' ? ' The stock is also received into the store at this cost.' : ''}
        </Text>

        {kind === 'stock' && (
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
            <Select
              label="Item bought"
              placeholder={summary.isLoading ? 'Loading…' : 'Search stock'}
              searchable
              data={items}
              value={itemId}
              onChange={setItemId}
            />
            <NumberInput
              label="Quantity"
              min={0}
              decimalScale={3}
              value={qty}
              onChange={(v) => setQty(Number(v) || 0)}
            />
          </SimpleGrid>
        )}

        <NumberInput
          label="Amount paid"
          min={0}
          decimalScale={2}
          thousandSeparator=","
          prefix="KES "
          value={amount}
          onChange={(v) => setAmount(Number(v) || 0)}
          error={tooMuch ? `You only hold ${formatCurrency(inHand)}` : undefined}
        />
        <TextInput
          label="What for"
          placeholder={kind === 'stock' ? 'e.g. Tomatoes from the market' : 'e.g. Boda to the bank'}
          required
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
        {kind === 'expense' && <Select label="Category" data={CATEGORIES} value={category} onChange={setCategory} />}
        <Group grow align="flex-start" wrap="wrap">
          <TextInput
            label="Paid to"
            placeholder="Name"
            value={payee}
            onChange={(e) => setPayee(e.currentTarget.value)}
            style={{ minWidth: 150 }}
          />
          <TextInput
            label="Receipt no."
            placeholder="Optional"
            value={receipt}
            onChange={(e) => setReceipt(e.currentTarget.value)}
            style={{ minWidth: 120 }}
          />
        </Group>
        {inHand <= 0 && (
          <Alert variant="light" color="orange" icon={<Info size={16} />}>
            <Text size="sm">You are not holding any cash yet. Confirm waiters' cash drops first.</Text>
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} loading={create.isPending} onClick={save}>
            Pay {amount > 0 ? formatCurrency(amount) : ''}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
