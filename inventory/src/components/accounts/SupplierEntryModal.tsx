import { useEffect, useState } from 'react';
import { Button, Group, Modal, NumberInput, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { SupplierPicker } from '@/components/purchasing/SupplierPicker';
import { useProperties } from '@/hooks/useCore';
import { useSupplierEntry } from '@/hooks/useAccounts';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { useIsMobile } from '@/hooks/useIsMobile';
import { tradingToday } from './AccountsParts';

type Kind = 'payment' | 'credit_note' | 'opening_balance';
const HELP: Record<Kind, string> = {
  payment: 'Money we paid the supplier. Lowers what we owe.',
  credit_note: 'The supplier credited us, e.g. for goods returned. Lowers what we owe.',
  opening_balance: 'What we owed this supplier before the system started. Raises what we owe.',
};

/** Pay a supplier, or record a credit note or an opening balance */
export function SupplierEntryModal({ opened, onClose, supplierId, propertyId }: { opened: boolean; onClose: () => void; supplierId?: string; propertyId?: string | null }) {
  const auth = useAuth();
  const isMobile = useIsMobile();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const properties = useProperties(1, 20);
  const { record } = useSupplierEntry();
  const [supplier, setSupplier] = useState<string | null>(supplierId ?? null);
  const [property, setProperty] = useState<string | null>(propertyId ?? null);
  const [kind, setKind] = useState<Kind>('payment');
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState<string | null>('mpesa');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState<string | null>(tradingToday().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (opened) {
      setSupplier(supplierId ?? null);
      setProperty(propertyId ?? null);
      setKind('payment');
      setAmount('');
      setReference('');
      setNotes('');
      setDate(tradingToday().format('YYYY-MM-DD'));
    }
  }, [opened, supplierId, propertyId]);

  const missing = !supplier || !Number(amount) || (groupLevel && !property) || (kind === 'payment' && !method) || !date;

  const save = () =>
    record.mutate(
      {
        supplier_id: supplier!,
        property_id: groupLevel ? property! : undefined,
        kind,
        amount: Number(amount),
        method: kind === 'payment' ? method : null,
        reference: reference.trim() || null,
        paid_on: date!,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', title: 'Saved', message: 'The supplier account is updated.' });
          onClose();
        },
        onError: (err) => notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) }),
      },
    );

  return (
    <Modal opened={opened} onClose={onClose} title="Supplier account entry" fullScreen={isMobile} centered>
      <Stack gap="sm">
        <SegmentedControl
          fullWidth
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          data={[{ value: 'payment', label: 'Payment' }, { value: 'credit_note', label: 'Credit note' }, { value: 'opening_balance', label: 'Opening' }]}
        />
        <Text size="xs" c="#495057">{HELP[kind]}</Text>
        {!supplierId && (
          <SupplierPicker value={supplier} onChange={setSupplier} />
        )}
        {groupLevel && (
          <Select
            label="Property"
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={property}
            onChange={setProperty}
          />
        )}
        <NumberInput label="Amount (KES)" min={0} decimalScale={2} thousandSeparator="," value={amount} onChange={setAmount} />
        {kind === 'payment' && (
          <Select
            label="Paid by"
            data={[{ value: 'mpesa', label: 'M-Pesa' }, { value: 'bank', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }, { value: 'card', label: 'Card' }, { value: 'other', label: 'Other' }]}
            value={method}
            onChange={setMethod}
          />
        )}
        <TextInput label={kind === 'payment' ? 'Reference (M-Pesa code, cheque no.)' : kind === 'credit_note' ? 'Credit note number' : 'Reference'} value={reference} onChange={(e) => setReference(e.currentTarget.value)} />
        <DatePickerInput
          label="Date"
          valueFormat="D MMM YYYY"
          maxDate={new Date()}
          value={date}
          onChange={(v) => setDate(v ? dayjs(v).format('YYYY-MM-DD') : null)}
        />
        <TextInput label="Note" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button color="#1F3A5F" disabled={missing} loading={record.isPending} onClick={save}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
