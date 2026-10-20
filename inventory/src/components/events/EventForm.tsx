import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Autocomplete, Button, Card, Checkbox, Group, NumberInput, Select, SegmentedControl, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { Plus, Trash2 } from 'lucide-react';
import { useSaveEvent } from '@/hooks/useEvents';
import { useVenues } from '@/hooks/useIncome';
import { useSettings } from '@/hooks/useSettings';
import { useLedgerSummary } from '@/hooks/useStock';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { EventInput, EventItem } from '@/lib/api/events';
import { formatCurrency } from '@/lib/utils/format';

const TYPES = ['wedding', 'conference', 'party', 'meeting', 'funeral', 'graduation', 'other'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

/** New event or edit: client, date, guests × price per person, extras, menu, stock plan */
export function EventForm({ event }: { event?: EventItem }) {
  const settings = useSettings();
  const auth = useAuth();
  const navigate = useNavigate();
  const groupLevel = auth.hasRole('md', 'admin');
  const save = useSaveEvent(event?.id);
  const properties = useProperties(1, 20);
  const summary = useLedgerSummary();

  const [v, setV] = useState<EventInput>({
    title: '', event_type: 'wedding', client_name: '', client_phone: '', client_email: '', client_kra_pin: '',
    start_at: '', venue: '', guests: 100, price_per_person: 0, goat_plan: 'none', goat_count: 1, goat_fee: 0, goat_cost: 0, vat_enabled: false, notes: '',
    menu: [{ description: '' }], extras: [], stock: [],
  });
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    setV({
      title: event.title, event_type: event.event_type, client_name: event.client.name, client_phone: event.client.phone || '',
      client_email: event.client.email || '', client_kra_pin: event.client.kra_pin || '', start_at: event.start_at,
      end_at: event.end_at, venue: event.venue || '', guests: event.guests, price_per_person: event.price_per_person,
      goat_plan: event.goat_plan, goat_count: event.goat_count || 1, goat_fee: event.goat_fee, goat_cost: event.goat_cost,
      vat_enabled: event.vat_enabled, notes: event.notes || '',
      menu: event.menu.length ? event.menu.map((m) => ({ description: m.description })) : [{ description: '' }],
      extras: event.extras.map((x) => ({ description: x.description, quantity: x.quantity, unit_price: x.unit_price })),
      stock: event.stock.map((s) => ({ stock_item_id: s.stock_item_id, planned_qty: s.planned_qty })),
    });
  }, [event]);

  const halls = useVenues('hall');
  const confs = useVenues('conference');
  const set = (patch: Partial<EventInput>) => setV((s) => ({ ...s, ...patch }));
  const items = useMemo(
    () => (summary.data ?? []).map((r) => ({ value: r.stock_item_id, label: `${r.item?.name || 'Item'}` })).sort((a, b) => a.label.localeCompare(b.label)),
    [summary.data]
  );

  const goat = v.goat_plan === 'none' ? 0 : v.goat_count * v.goat_fee;
  const pkg = v.guests * v.price_per_person + goat;
  const extras = v.extras.reduce((a, x) => a + x.quantity * x.unit_price, 0);
  const subtotal = pkg + extras;
  const vatOn = settings.data?.vat_registered !== false && v.vat_enabled;
  const vat = vatOn ? Math.round(subtotal * 16) / 100 : 0;
  const valid = v.title.trim().length >= 2 && v.client_name.trim().length >= 2 && !!v.start_at && v.guests > 0 && (!groupLevel || !!event || !!propertyId);

  const submit = async () => {
    try {
      const e = await save.mutateAsync({
        ...v,
        property_id: !event && groupLevel ? propertyId || undefined : undefined,
        client_email: v.client_email?.trim() || null,
        menu: v.menu.filter((m) => m.description.trim()),
        extras: v.extras.filter((x) => x.description.trim()),
        stock: v.stock.filter((s) => s.stock_item_id),
      });
      notifications.show({ color: 'green', title: event ? 'Event updated' : 'Event saved as a quote', message: `${e.event_ref} · ${formatCurrency(e.total)}` });
      navigate({ to: `/events/${e.id}` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  return (
    <Stack gap="md" pb={80}>
      <Card withBorder radius="md" p="md">
        <Title order={5} mb="sm">Event</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {groupLevel && !event && (
            <Select label="Property" data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />
          )}
          <TextInput label="Name of the event" placeholder="e.g. Wanjiku & Otieno wedding" value={v.title} onChange={(e) => set({ title: e.currentTarget.value })} required />
          <Select label="Type" data={TYPES} value={v.event_type} onChange={(x) => set({ event_type: x || 'other' })} />
          <DateTimePicker label="Starts" placeholder="Pick date and time" valueFormat="ddd D MMM YYYY, HH:mm" minDate={event ? undefined : dayjs().format('YYYY-MM-DD')} value={v.start_at ? dayjs(v.start_at).format('YYYY-MM-DD HH:mm:ss') : null}
            onChange={(x) => set({ start_at: x ? dayjs(x).toISOString() : '' })} required />
          <Autocomplete label="Venue" placeholder="Pick a hall or type one" data={[...new Set([...(halls.data ?? []), ...(confs.data ?? [])].map((h) => h.name))]} value={v.venue || ''} onChange={(val) => set({ venue: val })} />
        </SimpleGrid>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={5} mb="sm">Client</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput label="Name" value={v.client_name} onChange={(e) => set({ client_name: e.currentTarget.value })} required />
          <TextInput label="Phone" value={v.client_phone || ''} onChange={(e) => set({ client_phone: e.currentTarget.value })} />
          <TextInput label="Email" placeholder="The invoice is sent here" value={v.client_email || ''} onChange={(e) => set({ client_email: e.currentTarget.value })} />
          <TextInput label="KRA PIN" placeholder="Optional" value={v.client_kra_pin || ''} onChange={(e) => set({ client_kra_pin: e.currentTarget.value })} />
        </SimpleGrid>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={5} mb="sm">Price</Title>
        <SimpleGrid cols={2} spacing="sm">
          <NumberInput label="Guests" min={1} allowDecimal={false} thousandSeparator="," value={v.guests} onChange={(x) => set({ guests: Number(x) || 0 })} />
          <NumberInput label="Price per person" min={0} thousandSeparator="," prefix="KES " value={v.price_per_person} onChange={(x) => set({ price_per_person: Number(x) || 0 })} />
        </SimpleGrid>
        <Text size="xs" c="dimmed" mt={6}>{v.guests} × {formatCurrency(v.price_per_person)} = {formatCurrency(v.guests * v.price_per_person)}</Text>

        <Text size="sm" fw={600} mt="md" mb={6}>Goat</Text>
        <SegmentedControl fullWidth size="xs" value={v.goat_plan} onChange={(x) => set({ goat_plan: x as EventInput['goat_plan'] })}
          data={[{ value: 'none', label: 'No goat' }, { value: 'own', label: 'Own goat' }, { value: 'full', label: 'Full goat' }]} />
        {v.goat_plan !== 'none' && (
          <>
            <Text size="xs" c="dimmed" mt={6}>
              {v.goat_plan === 'own' ? 'Client brings their own goat and pays a fee to use the premises and resources.' : 'We choose the goat, cook it and serve it.'}
            </Text>
            <SimpleGrid cols={v.goat_plan === 'full' ? 3 : 2} spacing="sm" mt="xs">
              <NumberInput label="Goats" min={1} allowDecimal={false} value={v.goat_count} onChange={(x) => set({ goat_count: Number(x) || 0 })} />
              <NumberInput label="Fee per goat" min={0} thousandSeparator="," prefix="KES " value={v.goat_fee} onChange={(x) => set({ goat_fee: Number(x) || 0 })} />
              {v.goat_plan === 'full' && (
                <NumberInput label="What we paid" description="Fill in once bought" min={0} thousandSeparator="," prefix="KES " value={v.goat_cost} onChange={(x) => set({ goat_cost: Number(x) || 0 })} />
              )}
            </SimpleGrid>
          </>
        )}

        <Text size="sm" fw={600} mt="md" mb={6}>Extras (tent, decor, cake...)</Text>
        <Stack gap="xs">
          {v.extras.map((x, i) => (
            <Group key={i} gap="xs" wrap="nowrap" align="flex-end">
              <TextInput placeholder="What" value={x.description} style={{ flex: 2 }}
                onChange={(e) => { const d = e.currentTarget.value; set({ extras: v.extras.map((y, k) => (k === i ? { ...y, description: d } : y)) }); }} />
              <NumberInput placeholder="Qty" min={0} w={70} value={x.quantity} onChange={(q) => set({ extras: v.extras.map((y, k) => (k === i ? { ...y, quantity: Number(q) || 0 } : y)) })} />
              <NumberInput placeholder="Price" min={0} thousandSeparator="," style={{ flex: 1 }} value={x.unit_price} onChange={(p) => set({ extras: v.extras.map((y, k) => (k === i ? { ...y, unit_price: Number(p) || 0 } : y)) })} />
              <ActionIcon variant="subtle" color="red" size="lg" onClick={() => set({ extras: v.extras.filter((_, k) => k !== i) })}><Trash2 size={16} /></ActionIcon>
            </Group>
          ))}
          <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} w="fit-content" onClick={() => set({ extras: [...v.extras, { description: '', quantity: 1, unit_price: 0 }] })}>Add extra</Button>
        </Stack>

        {settings.data?.vat_registered !== false ? (
          <Checkbox mt="md" label="Add VAT (16% on top)" checked={v.vat_enabled} onChange={(e) => set({ vat_enabled: e.currentTarget.checked })} />
        ) : (
          <Text size="xs" c="dimmed" mt="md">VAT is off for the business, so no VAT is added.</Text>
        )}
        <Card radius="md" p="sm" mt="sm" style={{ background: '#E7F5FF' }}>
          <Group justify="space-between"><Text size="sm">Subtotal</Text><Text size="sm" fw={600}>{formatCurrency(subtotal)}</Text></Group>
          {vatOn && <Group justify="space-between"><Text size="sm">VAT 16%</Text><Text size="sm" fw={600}>{formatCurrency(vat)}</Text></Group>}
          <Group justify="space-between"><Text fw={700} style={{ color: '#1864AB' }}>Total</Text><Text fw={800} style={{ color: '#1864AB' }}>{formatCurrency(subtotal + vat)}</Text></Group>
        </Card>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={5} mb={4}>Menu</Title>
        <Text size="xs" c="dimmed" mb="sm">What will be served (shown on the invoice)</Text>
        <Stack gap="xs">
          {v.menu.map((m, i) => (
            <Group key={i} gap="xs" wrap="nowrap">
              <TextInput placeholder="e.g. Pilau, beef stew, soda" value={m.description} style={{ flex: 1 }}
                onChange={(e) => { const d = e.currentTarget.value; set({ menu: v.menu.map((y, k) => (k === i ? { description: d } : y)) }); }} />
              <ActionIcon variant="subtle" color="red" size="lg" onClick={() => set({ menu: v.menu.filter((_, k) => k !== i) })}><Trash2 size={16} /></ActionIcon>
            </Group>
          ))}
          <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} w="fit-content" onClick={() => set({ menu: [...v.menu, { description: '' }] })}>Add dish</Button>
        </Stack>
      </Card>

      <Card withBorder radius="md" p="md">
        <Title order={5} mb={4}>Stock needed</Title>
        <Text size="xs" c="dimmed" mb="sm">What the store should set aside. It is issued on the day and leftovers come back.</Text>
        <Stack gap="xs">
          {v.stock.map((s, i) => (
            <Group key={i} gap="xs" wrap="nowrap">
              <Select placeholder="Item" searchable data={items} value={s.stock_item_id || null} style={{ flex: 2 }}
                onChange={(x) => set({ stock: v.stock.map((y, k) => (k === i ? { ...y, stock_item_id: x || '' } : y)) })} />
              <NumberInput placeholder="Qty" min={0} decimalScale={3} style={{ flex: 1 }} value={s.planned_qty}
                onChange={(q) => set({ stock: v.stock.map((y, k) => (k === i ? { ...y, planned_qty: Number(q) || 0 } : y)) })} />
              <ActionIcon variant="subtle" color="red" size="lg" onClick={() => set({ stock: v.stock.filter((_, k) => k !== i) })}><Trash2 size={16} /></ActionIcon>
            </Group>
          ))}
          <Button variant="subtle" size="xs" leftSection={<Plus size={14} />} w="fit-content" onClick={() => set({ stock: [...v.stock, { stock_item_id: '', planned_qty: 0 }] })}>Add item</Button>
        </Stack>
      </Card>

      <Textarea label="Notes" autosize minRows={2} value={v.notes || ''} onChange={(e) => set({ notes: e.currentTarget.value })} />
      <Button size="md" disabled={!valid} loading={save.isPending} onClick={submit}>
        {event ? 'Save changes' : 'Save quote'} · {formatCurrency(subtotal + vat)}
      </Button>
    </Stack>
  );
}
