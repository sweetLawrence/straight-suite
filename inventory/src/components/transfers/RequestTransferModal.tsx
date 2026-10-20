import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Info, Plus, Trash2 } from 'lucide-react';
import { useCreateTransfer } from '@/hooks/useTransfers';
// import { useProperties } from '@/hooks/useCore';
import { useTransferTargets, useUnits } from '@/hooks/useCore';
import { useStockItems } from '@/hooks/useStock';
// import { useUnits } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { ReasonField } from '@/components/ReasonField';
import { useLedgerSummary } from '@/hooks/useStock';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

interface Line {
  stock_item_id: string;
  requested_qty: number;
  unit_id: string;
  notes: string;
  by_pack?: boolean;
}

export function RequestTransferModal({ opened, onClose }: Props) {
  const auth = useAuth();
  // const properties = useProperties(1, 50);
  const targets = useTransferTargets();
  const stockItems = useStockItems({ limit: 500, status: 'active' });
  const units = useUnits();
  const create = useCreateTransfer();
  const balances = useLedgerSummary();
  const held = new Map((balances.data ?? []).map((b) => [b.stock_item_id, Number(b.balance)]));

  const form = useForm({
    initialValues: {
      destination_type: 'hotel' as 'hotel' | 'external',
      destination_property_id: '',
      destination_name: '',
      destination_contact_name: '',
      destination_contact_phone: '',
      reason: '',
      lines: [
        { stock_item_id: '', requested_qty: 0, unit_id: '', notes: '', by_pack: true },
      ] as Line[],
    },
    validate: {
      reason: (v) => (v.trim() ? null : 'Required'),
      destination_property_id: (v, values) =>
        values.destination_type === 'hotel' && !v ? 'Required' : null,
      destination_name: (v, values) =>
        values.destination_type === 'external' && !v.trim() ? 'Required' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        destination_type: values.destination_type,
        destination_property_id:
          values.destination_type === 'hotel'
            ? values.destination_property_id
            : undefined,
        destination_name:
          values.destination_type === 'external'
            ? values.destination_name
            : undefined,
        destination_contact_name: values.destination_contact_name || undefined,
        destination_contact_phone: values.destination_contact_phone || undefined,
        reason: values.reason,
        lines: values.lines.map((l) =>
          l.by_pack
            ? { stock_item_id: l.stock_item_id, pack_qty: l.requested_qty, notes: l.notes || null }
            : { stock_item_id: l.stock_item_id, requested_qty: l.requested_qty, unit_id: l.unit_id, notes: l.notes || null }
        ),
      };
      const transfer = await create.mutateAsync(payload);
      notifications.show({
        color: 'green',
        title: 'Transfer requested',
        message: `${transfer.transfer_ref} awaiting MD approval`,
      });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  // Only show destinations that are NOT our own property

  const propertyOptions =
  targets.data?.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name}`,
  })) || [];

  // Food and bar stock are kept apart: bar staff see bar items, the store sees food, managers pick
  const barOnly = auth.hasRole('bar_attendant') && !auth.hasRole('store_manager', 'manager', 'supervisor', 'md', 'admin');
  const both = !barOnly && !auth.hasRole('store_manager');
  const [side, setSide] = useState<'food' | 'bar'>(barOnly ? 'bar' : 'food');
  const mySide = barOnly ? 'bar' : both ? side : 'food';
  const stockItemOptions =
    stockItems.data?.data.filter((s) => (s.store_type === 'bar_store') === (mySide === 'bar')).map((s) => ({
      value: s.id,
      label: `${s.item?.name || 'Item'} (${s.stock_model})`,
    })) || [];

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Request Transfer" size="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {both && (
            <SegmentedControl fullWidth value={side} onChange={(v) => { setSide(v as 'food' | 'bar'); form.setFieldValue('lines', [{ stock_item_id: '', requested_qty: 0, unit_id: '', notes: '', by_pack: true }]); }} data={[{ value: 'food', label: 'Food items' }, { value: 'bar', label: 'Bar items' }]} />
          )}
          <Alert icon={<Info size={16} />} color="blue" variant="light">
            <Text size="sm">
              Transfer requests require MD approval before dispatch. In-transit
              stock is owned by the source property.
            </Text>
          </Alert>

          <Select
            label="Destination Type"
            data={[
              { value: 'hotel', label: 'Another hotel (internal)' },
              { value: 'external', label: 'External (charity, loan, etc.)' },
            ]}
            {...form.getInputProps('destination_type')}
          />

          {form.values.destination_type === 'hotel' && (
            <Select
              label="Destination Property"
              placeholder="Select property"
              data={propertyOptions}
              required
              {...form.getInputProps('destination_property_id')}
            />
          )}

          {form.values.destination_type === 'external' && (
            <>
              <TextInput
                label="Destination Name"
                placeholder="e.g. Local Charity"
                required
                {...form.getInputProps('destination_name')}
              />
              <Group grow>
                <TextInput
                  label="Contact Name (optional)"
                  {...form.getInputProps('destination_contact_name')}
                />
                <TextInput
                  label="Contact Phone (optional)"
                  {...form.getInputProps('destination_contact_phone')}
                />
              </Group>
            </>
          )}

          <ReasonField
            label="Reason"
            required
            options={['Short of stock at the destination', 'Event or booking at the destination', 'Stock is expiring here, use it there', 'Rebalancing stock between hotels', 'Loan to another business', 'Donation']}
            value={form.values.reason}
            onChange={(v) => form.setFieldValue('reason', v)}
            error={form.errors.reason}
          />

          <Divider label="Lines" labelPosition="left" />

          {form.values.lines.map((line, idx) => (
            <Card key={idx} withBorder padding="sm">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Line {idx + 1}
                  </Text>
                  {form.values.lines.length > 1 && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      onClick={() => form.removeListItem('lines', idx)}
                      leftSection={<Trash2 size={14} />}
                    >
                      Remove
                    </Button>
                  )}
                </Group>
                <Select
                  label="Stock Item"
                  searchable
                  data={stockItemOptions}
                  {...form.getInputProps(`lines.${idx}.stock_item_id`)}
                />
                {(() => {
                  const si = stockItems.data?.data.find((x) => x.id === line.stock_item_id);
                  const per = si?.pack_size ?? 0;
                  const label = si?.pack_label || 'kg';
                  if (per) {
                    const q = Number(line.requested_qty) || 0;
                  const inStore = held.get(line.stock_item_id) ?? 0;
                  const maxNow = line.by_pack ? Math.floor((inStore / per) * 100) / 100 : inStore;
                    return (
                      <Stack gap={6}>
                        <SegmentedControl
                          size="xs"
                          value={line.by_pack ? 'pack' : 'base'}
                          onChange={(v) => form.setFieldValue(`lines.${idx}.by_pack`, v === 'pack')}
                          data={[{ value: 'pack', label: label }, { value: 'base', label: 'portions' }]}
                        />
                        <NumberInput
                          label={`Quantity in ${line.by_pack ? label : 'portions'}`}
                          min={0}
                          max={maxNow}
                          decimalScale={3}
                          description={`In store: ${Math.round(inStore * 100) / 100} portions (≈ ${Math.round((inStore / per) * 100) / 100} ${label}). You can ask for up to ${maxNow} ${line.by_pack ? label : 'portions'}.`}
                          {...form.getInputProps(`lines.${idx}.requested_qty`)}
                        />
                        <Text size="xs" c="dimmed">
                          {line.by_pack
                            ? `${q} ${label} = ${Math.round(q * per * 100) / 100} portions`
                            : `${q} portions = ${Math.round((q / per) * 100) / 100} ${label}`}
                        </Text>
                      </Stack>
                    );
                  }
                  return (
                    <NumberInput
                      label="Quantity (in the item's own unit)"
                      min={0}
                      decimalScale={3}
                      description={line.stock_item_id ? `In store: ${Math.round((held.get(line.stock_item_id) ?? 0) * 100) / 100}` : undefined}
                      {...form.getInputProps(`lines.${idx}.requested_qty`)}
                    />
                  );
                })()}
                <TextInput
                  label="Notes (optional)"
                  {...form.getInputProps(`lines.${idx}.notes`)}
                />
              </Stack>
            </Card>
          ))}

          <Button
            variant="light"
            leftSection={<Plus size={16} />}
            onClick={() =>
              form.insertListItem('lines', {
                stock_item_id: '',
                requested_qty: 0,
                unit_id: '',
                notes: '',
                by_pack: true,
              })
            }
          >
            Add line
          </Button>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Request Transfer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}