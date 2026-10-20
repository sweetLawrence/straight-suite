import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertTriangle } from 'lucide-react';
import { useVoidBill } from '@/hooks/useOrderEdit';
import { getErrorMessage } from '@/lib/api/client';
import type { StockAction } from '@/lib/api/orderEdit';
import { formatCurrency } from '@/lib/utils/format';
import { StockActionPicker } from './StockActionPicker';

/** Branch manager voids an unpaid bill. Stock already out is returned or written off. */
export function VoidBillModal({
  opened,
  onClose,
  billId,
  billRef,
  amount,
  hasBar,
}: {
  opened: boolean;
  onClose: () => void;
  billId: string;
  billRef: string;
  amount: number;
  /** Bill has bar drinks, so "back on the shelf" makes sense */
  hasBar: boolean;
}) {
  const voidBill = useVoidBill(billId);
  const [reason, setReason] = useState('');
  const [stock, setStock] = useState<StockAction>('return');

  useEffect(() => {
    if (opened) {
      setReason('');
      setStock(hasBar ? 'return' : 'waste');
    }
  }, [opened, hasBar]);

  const save = async () => {
    try {
      await voidBill.mutateAsync({ reason: reason.trim(), stock_action: hasBar ? stock : 'waste' });
      notifications.show({ color: 'green', title: 'Bill voided', message: billRef });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not void', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={`Void ${billRef}`}>
      <Stack>
        <Alert variant="light" color="red" icon={<AlertTriangle size={16} />}>
          <Text size="sm">
            {formatCurrency(amount)} will no longer be owed. This can not be undone, and the MD is notified.
          </Text>
        </Alert>
        <Textarea
          label="Reason"
          placeholder="e.g. Customer walked out before being served"
          required
          autosize
          minRows={2}
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
        <StockActionPicker value={stock} onChange={setStock} canReturn={hasBar} />
        {hasBar && (
          <Text size="xs" c="dimmed">
            Food on the bill is always written off.
          </Text>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" disabled={reason.trim().length < 3} loading={voidBill.isPending} onClick={save}>
            Void bill
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
