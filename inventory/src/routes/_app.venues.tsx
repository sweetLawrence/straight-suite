import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ActionIcon, Badge, Button, Card, Group, Loader, Modal, NumberInput, Select, Stack, Tabs, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { RoomTypesPanel } from '@/components/income/RoomTypesPanel';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useSaveVenue, useSaveVenueRates, useVenues } from '@/hooks/useIncome';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import type { Venue, VenueRate } from '@/lib/api/income';

export const Route = createFileRoute('/_app/venues')({
  component: VenuesPage,
});

const KIND: Record<Venue['kind'], string> = { room: 'Rooms', hall: 'Halls', conference: 'Conference rooms' };

function VenuesPage() {
  const auth = useAuth();
  const canEdit = auth.hasPermission('event.manage');
  const groupLevel = auth.hasRole('md', 'admin');
  const [kind, setKind] = useState<Venue['kind'] | 'types'>('room');
  const list = useVenues();
  const props = useProperties(1, 20);
  const save = useSaveVenue();
  const saveRates = useSaveVenueRates();
  const [rateEdit, setRateEdit] = useState<{ venue: Venue; rates: VenueRate[] } | null>(null);
  const [edit, setEdit] = useState<Partial<Venue> & { property_id?: string } | null>(null);

  const rows = (list.data ?? []).filter((v) => v.kind === kind);
  const isTypes = kind === 'types';
  const propOptions = (props.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }));

  const submit = async () => {
    if (!edit?.name?.trim()) return;
    try {
      await save.mutateAsync({
        id: edit.id, kind: edit.id || isTypes ? undefined : (kind as Venue['kind']), name: edit.name.trim(), capacity: edit.capacity || null,
        property_id: edit.id ? undefined : groupLevel ? edit.property_id : undefined,
      });
      notifications.show({ color: 'green', title: 'Saved', message: edit.name });
      setEdit(null);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  const submitRates = async () => {
    if (!rateEdit) return;
    const rates = rateEdit.rates.filter((r) => r.label.trim() && r.price > 0);
    try {
      await saveRates.mutateAsync({ id: rateEdit.venue.id, rates });
      notifications.show({ color: 'green', title: 'Rates saved', message: rateEdit.venue.name });
      setRateEdit(null);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };
  const setRate = (i: number, patch: Partial<VenueRate>) => setRateEdit((e) => (e ? { ...e, rates: e.rates.map((r, j) => (j === i ? { ...r, ...patch } : r)) } : e));

  const retire = async (v: Venue) => {
    if (!window.confirm(`Remove ${v.name} from the list?`)) return;
    try {
      await save.mutateAsync({ id: v.id, status: 'retired' });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not remove', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader
        title="Rooms and halls"
        subtitle="The names used for room charges, function venues and hall hire"
        actions={canEdit && !isTypes ? <Button leftSection={<Plus size={16} />} onClick={() => setEdit({ name: '', capacity: null })}>Add</Button> : undefined}
      />
      <Tabs value={kind} onChange={(v) => setKind((v as Venue['kind'] | 'types') || 'room')} mb="md">
        <Tabs.List>
          {(Object.keys(KIND) as Venue['kind'][]).map((k) => <Tabs.Tab key={k} value={k}>{KIND[k]}</Tabs.Tab>)}
          <Tabs.Tab value="types">Room types</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {isTypes ? <RoomTypesPanel groupLevel={groupLevel} /> : list.isLoading ? <Loader /> : rows.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Add the first one." />
      ) : (
        <Stack gap="xs">
          {rows.map((v) => (
            <Card key={v.id} withBorder radius="md" p="sm">
              <Group justify="space-between" wrap="nowrap">
                <div style={{ minWidth: 0 }}>
                  <Group gap={6}>
                    <Text fw={700} size="sm">{v.name}</Text>
                    {v.is_demo && <Badge size="xs" color="orange" variant="light">Sample name</Badge>}
                    {groupLevel && v.property && <Badge size="xs" variant="outline" color="gray">{v.property.code}</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">{v.capacity ? `Up to ${v.capacity}` : 'No capacity set'}</Text>
                  {v.kind !== 'room' && (
                    <Text size="xs" mt={2}>
                      {(v.rates ?? []).length ? (v.rates ?? []).map((r) => `${r.label} ${formatCurrency(r.price)}`).join(' · ') : 'No hire rates set'}
                    </Text>
                  )}
                </div>
                {canEdit && (
                  <Group gap={4} wrap="nowrap">
                    {v.kind !== 'room' && <Button size="compact-xs" variant="light" onClick={() => setRateEdit({ venue: v, rates: (v.rates ?? []).length ? (v.rates ?? []).map((r) => ({ ...r })) : [{ label: 'Full day', hours: 10, price: 0 }] })}>Rates</Button>}
                    <ActionIcon variant="subtle" size="lg" onClick={() => setEdit(v)}><Pencil size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="lg" onClick={() => retire(v)}><Trash2 size={16} /></ActionIcon>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal opened={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit' : `Add to ${isTypes ? '' : KIND[kind as Venue['kind']].toLowerCase()}`} centered>
        <Stack>
          {groupLevel && !edit?.id && <Select label="Property" data={propOptions} value={edit?.property_id ?? null} onChange={(v) => setEdit({ ...edit, property_id: v || undefined })} />}
          <TextInput label="Name" placeholder={kind === 'room' ? 'Room 101' : 'Garden Hall'} value={edit?.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.currentTarget.value })} />
          <NumberInput label="Capacity (optional)" min={1} allowDecimal={false} value={edit?.capacity ?? ''} onChange={(x) => setEdit({ ...edit, capacity: Number(x) || null })} />
          <Button onClick={submit} loading={save.isPending} disabled={!edit?.name?.trim() || (groupLevel && !edit?.id && !edit?.property_id)}>Save</Button>
        </Stack>
      </Modal>
      <Modal opened={!!rateEdit} onClose={() => setRateEdit(null)} title={`Hire rates: ${rateEdit?.venue.name ?? ''}`} centered>
        <Stack>
          <Text size="xs" c="dimmed">One row for each way it is hired, for example full day, half day, any time.</Text>
          {(rateEdit?.rates ?? []).map((r, i) => (
            <Group key={i} gap={6} wrap="nowrap" align="flex-end">
              <TextInput style={{ flex: 1 }} label={i === 0 ? 'Session' : undefined} placeholder="Full day" value={r.label} onChange={(e) => setRate(i, { label: e.currentTarget.value })} />
              <NumberInput w={70} label={i === 0 ? 'Hours' : undefined} min={1} max={24} allowDecimal={false} value={r.hours ?? ''} onChange={(x) => setRate(i, { hours: Number(x) || null })} />
              <NumberInput w={110} label={i === 0 ? 'Price' : undefined} min={0} thousandSeparator="," value={r.price || ''} onChange={(x) => setRate(i, { price: Number(x) || 0 })} />
              <ActionIcon variant="subtle" color="red" size="lg" onClick={() => setRateEdit((e) => (e ? { ...e, rates: e.rates.filter((_, j) => j !== i) } : e))}><Trash2 size={16} /></ActionIcon>
            </Group>
          ))}
          <Group justify="space-between">
            <Button variant="default" size="xs" leftSection={<Plus size={14} />} disabled={(rateEdit?.rates.length ?? 0) >= 8} onClick={() => setRateEdit((e) => (e ? { ...e, rates: [...e.rates, { label: '', hours: null, price: 0 }] } : e))}>Add a row</Button>
            <Button onClick={submitRates} loading={saveRates.isPending}>Save rates</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
