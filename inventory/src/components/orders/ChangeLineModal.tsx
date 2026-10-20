import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, NumberInput, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Info } from 'lucide-react';
import { useEditOrderLine, useRemoveOrderLine } from '@/hooks/useOrderEdit';
import { getErrorMessage } from '@/lib/api/client';
import type { StockAction } from '@/lib/api/orderEdit';
import { formatCurrency, formatQty } from '@/lib/utils/format';
import { StockActionPicker } from './StockActionPicker';

export interface ChangeableLine {
  id: string;
  quantity: string;
  unit_price: string;
  station: 'kitchen' | 'bar';
  status: string;
  menu_item?: { display_name: string } | null;
}

/** A line already poured at the bar or sent from the kitchen */
export const isIssued = (l: { status: string }) => !['pending', 'cancelled'].includes(l.status);

/**
 * Lower the quantity of an order line, or take it off. Before billing only.
 * Waiters can change lines nobody has poured or cooked yet; once stock has moved
 * a manager must say whether it goes back on the shelf or is written off.
 */
export function ChangeLineModal({
  orderId,
  line,
  onClose,
}: {
  orderId: string;
  line: ChangeableLine | null;
  onClose: () => void;
}) {
  const edit = useEditOrderLine(orderId);
  const remove = useRemoveOrderLine(orderId);
  const [mode, setMode] = useState<'lower' | 'remove'>('lower');
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [stock, setStock] = useState<StockAction>('return');

  const oldQty = Number(line?.quantity || 0);
  const issued = !!line && isIssued(line);
  const canReturn = line?.station === 'bar';
  const canLower = oldQty > 1;

  useEffect(() => {
    if (!line) return;
    const q = Number(line.quantity);
    setMode(q > 1 ? 'lower' : 'remove');
    setQty(Math.max(1, q - 1));
    setReason('');
    setStock(line.station === 'bar' ? 'return' : 'waste');
  }, [line]);

  const busy = edit.isPending || remove.isPending;
  const valid = reason.trim().length >= 3 && (mode === 'remove' || (qty > 0 && qty < oldQty));

  const save = async () => {
    if (!line) return;
    const stock_action: StockAction = canReturn ? stock : 'waste';
    try {
      if (mode === 'remove') {
        await remove.mutateAsync({ lineId: line.id, reason: reason.trim(), stock_action });
      } else {
        await edit.mutateAsync({ lineId: line.id, quantity: qty, reason: reason.trim(), stock_action });
      }
      notifications.show({
        color: 'green',
        title: mode === 'remove' ? 'Item removed' : 'Quantity changed',
        message: line.menu_item?.display_name || '',
      });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={!!line} onClose={onClose} title={line ? `Change ${line.menu_item?.display_name || 'item'}` : ''}>
      {line && (
        <Stack>
          <Text size="sm" c="dimmed">
            Ordered {formatQty(line.quantity)} × {formatCurrency(line.unit_price)}
          </Text>

          {canLower && (
            <SegmentedControl
              fullWidth
              value={mode}
              onChange={(v) => setMode(v as 'lower' | 'remove')}
              data={[
                { value: 'lower', label: 'Lower quantity' },
                { value: 'remove', label: 'Remove item' },
              ]}
            />
          )}

          {mode === 'lower' && (
            <NumberInput
              label="New quantity"
              description="To add more, add another line instead."
              min={1}
              max={oldQty - 1}
              allowDecimal={false}
              value={qty}
              onChange={(v) => setQty(Number(v) || 0)}
            />
          )}

          <Textarea
            label="Reason"
            placeholder={mode === 'remove' ? 'e.g. Customer changed their mind' : 'e.g. Ordered 3 by mistake, wanted 2'}
            required
            autosize
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />

          {issued && (
            <>
              <Alert variant="light" color="orange" icon={<Info size={16} />}>
                {line.station === 'bar' ? 'This was already poured.' : 'This was already sent from the kitchen.'} The
                MD and the branch manager are notified.
              </Alert>
              <StockActionPicker value={stock} onChange={setStock} canReturn={canReturn} />
            </>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button color={mode === 'remove' ? 'red' : undefined} disabled={!valid} loading={busy} onClick={save}>
              {mode === 'remove' ? 'Remove item' : 'Save'}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
