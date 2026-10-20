import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, SimpleGrid, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { BedDouble } from 'lucide-react';
import { usePayLaterAction } from '@/hooks/usePayLater';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

/**
 * Leave a bill for the guest to pay later (e.g. sleeping in the hotel).
 * The bill stays open but no longer stops the shift or day from closing;
 * the manager and MD are told, and reminded if it is not paid on time.
 */
export function PayLaterModal({ opened, onClose, billId, amount }: { opened: boolean; onClose: () => void; billId: string; amount: number }) {
  const action = usePayLaterAction(billId);
  const tomorrow = dayjs().subtract(6, 'hour').add(1, 'day').format('YYYY-MM-DD');
  const [guest, setGuest] = useState('');
  const [room, setRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [due, setDue] = useState<string | null>(tomorrow);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (opened) {
      setGuest('');
      setRoom('');
      setPhone('');
      setDue(tomorrow);
      setNote('');
    }
  }, [opened, tomorrow]);

  const save = async () => {
    try {
      await action.mutateAsync({
        kind: 'mark',
        data: { guest_name: guest.trim(), room: room.trim() || undefined, phone: phone.trim() || undefined, due_date: due || undefined, note: note.trim() || undefined },
      });
      notifications.show({ color: 'orange', title: 'Left to pay later', message: `${guest.trim()} · ${formatCurrency(amount)}. The manager has been told.` });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Guest pays later" centered>
      <Stack>
        <Alert variant="light" color="orange" icon={<BedDouble size={16} />}>
          <Text size="sm">
            For a guest who pays later, e.g. sleeping here tonight. The bill of <b>{formatCurrency(amount)}</b> stays unpaid but does not
            stop the shift or day from closing. The manager and MD are told, and reminded if it is not paid by the date.
          </Text>
        </Alert>
        <TextInput label="Guest name" placeholder="e.g. Mr Otieno" required value={guest} onChange={(e) => setGuest(e.currentTarget.value)} />
        <SimpleGrid cols={2} spacing="sm">
          <TextInput label="Room" placeholder="e.g. 12" value={room} onChange={(e) => setRoom(e.currentTarget.value)} />
          <TextInput label="Phone" placeholder="07..." value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
        </SimpleGrid>
        <DatePickerInput
          label="Will pay by"
          valueFormat="ddd D MMM YYYY"
          minDate={new Date()}
          value={due}
          onChange={(v) => setDue(v ? dayjs(v).format('YYYY-MM-DD') : null)}
        />
        <Textarea label="Note" placeholder="e.g. Pays at checkout" autosize minRows={2} value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="orange" disabled={guest.trim().length < 2} loading={action.isPending} onClick={save}>
            Leave to pay later
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
