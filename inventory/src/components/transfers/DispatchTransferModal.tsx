import { Alert, Button, Card, Group, Modal, NumberInput, Stack, Text, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatchTransfer } from '@/hooks/useTransfers';
import { useLedgerSummary } from '@/hooks/useStock';
import { getErrorMessage } from '@/lib/api/client';
import { Transfer } from '@/lib/api/transfers';

interface Props {
  opened: boolean;
  onClose: () => void;
  transfer: Transfer | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function DispatchTransferModal({ opened, onClose, transfer }: Props) {
  const dispatch = useDispatchTransfer();
  const balances = useLedgerSummary();
  const held = new Map((balances.data ?? []).filter((b) => !transfer || b.property_id === transfer.source_property_id).map((b) => [b.stock_item_id, Number(b.balance)]));

  const form = useForm({ initialValues: { lines: [] as { transfer_line_id: string; dispatched_qty: number; notes: string }[] } });

  // Start each line at the most the store can really send
  useEffect(() => {
    if (!opened || !transfer) return;
    form.setValues({
      lines: (transfer.transfer_lines || []).map((l) => ({
        transfer_line_id: l.id,
        dispatched_qty: Math.max(0, Math.min(parseFloat(l.requested_qty), held.get(l.stock_item_id) ?? parseFloat(l.requested_qty))),
        notes: '',
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, transfer?.id, balances.data]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!transfer) return;
    try {
      await dispatch.mutateAsync({
        id: transfer.id,
        data: { lines: values.lines.map((l) => ({ transfer_line_id: l.transfer_line_id, dispatched_qty: l.dispatched_qty, notes: l.notes || null })) },
      });
      notifications.show({ color: 'green', title: 'Dispatched', message: 'Stock is now on its way' });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Failed', message: getErrorMessage(err) });
    }
  };

  if (!transfer) return null;
  const anyShort = (transfer.transfer_lines || []).some((l) => (held.get(l.stock_item_id) ?? Infinity) < parseFloat(l.requested_qty));
  const sendingNothing = form.values.lines.every((l) => !(l.dispatched_qty > 0));

  return (
    <Modal opened={opened} onClose={onClose} title="Dispatch transfer" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            <Text size="sm">Count what actually leaves the store. It comes off your stock now.</Text>
          </Alert>
          {anyShort && (
            <Alert icon={<AlertTriangle size={16} />} color="orange" variant="light">
              <Text size="sm">The store holds less than was asked for on some lines. Quantities are set to what you can send.</Text>
            </Alert>
          )}
          {form.values.lines.map((line, idx) => {
            const tl = transfer.transfer_lines?.[idx];
            const req = parseFloat(tl?.requested_qty || '0');
            const have = held.get(tl?.stock_item_id || '');
            const max = have == null ? req : Math.min(req, have);
            const per = tl?.stock_item?.pack_size || 0;
            const unit = tl?.unit?.code || '';
            return (
              <Card key={line.transfer_line_id} withBorder padding="sm">
                <Stack gap="xs">
                  <Text size="sm" fw={600}>{tl?.stock_item?.item?.name || 'Item'}</Text>
                  <Group gap="md">
                    <Text size="xs" c="dimmed">Asked for: {req} {unit}{per ? ` (≈ ${r2(req / per)} ${tl?.stock_item?.pack_label})` : ''}</Text>
                    <Text size="xs" c={have != null && have < req ? 'orange' : 'dimmed'}>In store: {have == null ? '…' : `${r2(have)} ${unit}`}{per && have != null ? ` (≈ ${r2(have / per)} ${tl?.stock_item?.pack_label})` : ''}</Text>
                  </Group>
                  <NumberInput
                    label={`Quantity to send (most you can send: ${r2(max)})`}
                    min={0}
                    max={max}
                    decimalScale={3}
                    description={per ? `≈ ${r2((form.values.lines[idx].dispatched_qty || 0) / per)} ${tl?.stock_item?.pack_label}` : undefined}
                    {...form.getInputProps(`lines.${idx}.dispatched_qty`)}
                  />
                  <Textarea label="Notes (optional)" autosize minRows={1} {...form.getInputProps(`lines.${idx}.notes`)} />
                </Stack>
              </Card>
            );
          })}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={dispatch.isPending} disabled={sendingNothing}>Dispatch</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
