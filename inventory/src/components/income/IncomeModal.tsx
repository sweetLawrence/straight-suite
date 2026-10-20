import { useEffect, useState } from 'react';
import { Button, Card, Group, Modal, NumberInput, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCreateIncome, useIncomePrices, useVenues } from '@/hooks/useIncome';
import { useRoomTypes } from '@/hooks/useRoomTypes';
import { PLAN_LABEL, type MealPlan } from '@/lib/api/roomTypes';
import { STREAM_CARD } from './streams';
import { parkingLookup, STREAM_LABEL, type IncomeStream } from '@/lib/api/income';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

type D = Record<string, string>;

/** One payment taken for one stream. The price is fixed (set by the manager); the person only fills the details and how it was paid. */
export function IncomeModal({ opened, onClose, stream: picked }: { opened: boolean; onClose: () => void; stream: IncomeStream | null }) {
  const stream: IncomeStream = picked ?? 'other';
  const roomTypes = useRoomTypes(undefined, opened && stream === 'accommodation');
  // A stay is priced from the room rates; with no rates set yet it is typed by hand
  const stayMode = stream === 'accommodation' && (roomTypes.data?.length ?? 0) > 0;
  const manual = stream === 'other' || (stream === 'accommodation' && !stayMode);
  const save = useCreateIncome();
  const halls = useVenues('hall');
  const confs = useVenues('conference');
  const prices = useIncomePrices();
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState('cash');
  const [ref, setRef] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [desc, setDesc] = useState('');
  const [d, setD] = useState<D>({});
  const [venueId, setVenueId] = useState<string | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [plan, setPlan] = useState<MealPlan>('bb');
  const [nights, setNights] = useState(1);
  const [adults, setAdults] = useState(1);
  const [kidsHalf, setKidsHalf] = useState(0);
  const [kidsFree, setKidsFree] = useState(0);
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setAmount(0);
      setMethod('cash');
      setRef('');
      setQty(1);
      setDesc('');
      setD({});
      setVenueId(null);
      setRateId(null);
      setTypeId(null);
      setPlan('bb');
      setNights(1);
      setAdults(1);
      setKidsHalf(0);
      setKidsFree(0);
      setSeen(null);
    }
  }, [opened, stream]);

  const set = (k: string, v: string) => setD((p) => ({ ...p, [k]: v }));

  // Parking: a plate seen before brings back the owner
  const lookup = async () => {
    const plate = (d.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (plate.length < 4) return;
    try {
      const r = await parkingLookup(plate);
      if (r.found) {
        setD((p) => ({ ...p, owner_name: p.owner_name || r.owner_name || '', owner_phone: p.owner_phone || r.owner_phone || '', vehicle: p.vehicle || r.vehicle || '' }));
        setSeen(`Seen ${r.visits} time${r.visits === 1 ? '' : 's'} before: ${r.owner_name}`);
      } else setSeen(null);
    } catch {
      setSeen(null);
    }
  };

  const card = STREAM_CARD[stream];
  const Icon = card.icon;
  const priceRow = manual ? undefined : prices.data?.find((x) => x.stream === stream);
  const hallOptions = [...(halls.data ?? []), ...(confs.data ?? [])];
  const rates = hallOptions.find((h) => h.id === venueId)?.rates ?? [];
  const rate = stream === 'hall_hire' ? rates.find((r) => r.id === rateId) : undefined;
  const quantity = stream === 'parking' || rate ? 1 : qty;
  // A group (10 or more people) pays the group price each where one is set
  const grouped = !!priceRow && priceRow.group_price != null && priceRow.group_price > 0 && quantity >= priceRow.group_min;
  const fixed = manual ? null : rate ? rate.price : grouped ? priceRow!.group_price! : priceRow?.price ?? 0;
  const roomType = stayMode ? roomTypes.data?.find((r) => r.id === typeId) : undefined;
  const planPrice = roomType ? roomType[`${plan}_price` as 'bb_price'] : 0;
  const stayTotal = planPrice * (adults + kidsHalf * 0.5) * nights;
  const total = stayMode ? stayTotal : fixed == null ? amount : fixed * quantity;
  const valid =
    total > 0 &&
    (stayMode || fixed == null || fixed > 0) &&
    (!stayMode || ((d.guest_name || '').trim().length > 0 && !!roomType)) &&
    (method === 'cash' || ref.trim().length >= 3) &&
    (stream !== 'parking' || ((d.plate || '').replace(/[^A-Za-z0-9]/g, '').length >= 4 && (d.owner_name || '').trim().length > 0)) &&
    (stream !== 'bus_hire' || ((d.bus_reg || '').trim().length > 0 && (d.hirer_name || '').trim().length > 0)) &&
    (stream !== 'hall_hire' || (d.hirer_name || '').trim().length > 0) &&
    (stream !== 'hall_hire' || rates.length === 0 || !!rate) &&
    (!manual || desc.trim().length > 0);

  const submit = async () => {
    try {
      const details: Record<string, unknown> = { ...d };
      if (stream === 'hall_hire' && d.hours) details.hours = Number(d.hours);
      if (stayMode) Object.assign(details, { room_type_id: typeId, plan, nights, adults, kids_half: kidsHalf, kids_free: kidsFree });
      const r = await save.mutateAsync({
        stream,
        amount: manual ? amount : undefined,
        ...(stayMode ? { quantity: undefined } : {}),
        method,
        transaction_ref: method === 'cash' ? undefined : ref.trim(),
        quantity: manual || stayMode ? undefined : quantity,
        description: desc.trim() || undefined,
        venue_id: stream === 'hall_hire' && venueId ? venueId : undefined,
        rate_id: stream === 'hall_hire' && rate?.id ? rate.id : undefined,
        details: ['parking', 'bus_hire', 'hall_hire'].includes(stream) || stayMode ? details : undefined,
      });
      notifications.show({ color: 'green', title: `${r.stream_label} recorded`, message: `${r.entry_ref} · ${formatCurrency(r.amount)}` });
      onClose();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };

  const text = (k: string, label: string, props: { placeholder?: string; required?: boolean; onBlur?: () => void } = {}) => (
    <TextInput label={label} value={d[k] || ''} onChange={(e) => set(k, e.currentTarget.value)} {...props} />
  );

  return (
    <Modal opened={opened} onClose={onClose} title={STREAM_LABEL[stream]} fullScreen={typeof window !== 'undefined' && window.innerWidth < 520}>
      <Stack>
        <Card radius="md" p="sm" style={{ background: card.bg }}>
          <Group gap="sm" wrap="nowrap">
            <Icon size={28} color={card.color} />
            <div>
              <Text fw={700} style={{ color: card.color }}>{STREAM_LABEL[stream]}</Text>
              <Text size="xs" c="dimmed">
                {stayMode ? 'Priced from the room rates' : fixed == null ? 'Type the amount' : fixed > 0 ? `${formatCurrency(fixed)} per ${card.unit}${grouped ? ' (group price)' : priceRow?.group_price ? ` · ${formatCurrency(priceRow.group_price)} each from ${priceRow.group_min} people` : ''}` : 'Price not set. Ask the manager.'}
              </Text>
            </div>
          </Group>
        </Card>

        {stream === 'parking' && (
          <>
            {text('plate', 'Number plate', { placeholder: 'e.g. KDA 123A', required: true, onBlur: lookup })}
            {seen && <Text size="xs" c="teal">{seen}</Text>}
            {text('vehicle', 'Vehicle', { placeholder: 'e.g. White Toyota Probox' })}
            {text('owner_name', 'Owner name', { required: true })}
            {text('owner_phone', 'Owner phone', { placeholder: '07...' })}
          </>
        )}

        {stream === 'bus_hire' && (
          <>
            {text('bus_reg', 'Bus registration', { placeholder: 'e.g. KCB 456X', required: true })}
            {text('driver', 'Driver')}
            {text('hirer_name', 'Hired by', { required: true })}
            {text('hirer_phone', 'Hirer phone')}
            {text('destination', 'Destination / trip')}
            <Group grow>
              <TextInput label="From" type="date" value={d.date_from || ''} onChange={(e) => set('date_from', e.currentTarget.value)} />
              <TextInput label="To" type="date" value={d.date_to || ''} onChange={(e) => set('date_to', e.currentTarget.value)} />
            </Group>
            <Group grow>
              <TextInput label="Odometer out (km)" type="number" value={d.odometer_start || ''} onChange={(e) => set('odometer_start', e.currentTarget.value)} />
              <TextInput label="Odometer back (km)" type="number" value={d.odometer_end || ''} onChange={(e) => set('odometer_end', e.currentTarget.value)} />
            </Group>
          </>
        )}

        {stream === 'hall_hire' && (
          <>
            <Select
              label="Hall"
              placeholder="Pick a hall or conference room"
              clearable
              data={hallOptions.map((h) => ({ value: h.id, label: h.name }))}
              value={venueId}
              onChange={(v) => { setVenueId(v); setRateId(null); }}
              comboboxProps={{ withinPortal: true }}
            />
            {rates.length > 0 && (
              <Select
                label="Session"
                placeholder="Full day, half day..."
                data={rates.map((r) => ({ value: r.id ?? '', label: `${r.label} · ${formatCurrency(r.price)}` }))}
                value={rateId}
                onChange={setRateId}
                comboboxProps={{ withinPortal: true }}
              />
            )}
            {text('hirer_name', 'Hired by', { required: true })}
            {text('hirer_phone', 'Hirer phone')}
            <Group grow>
              <TextInput label="Date" type="date" value={d.hire_date || ''} onChange={(e) => set('hire_date', e.currentTarget.value)} />
              <TextInput label="Hours" type="number" value={d.hours || ''} onChange={(e) => set('hours', e.currentTarget.value)} />
            </Group>
          </>
        )}

        {stayMode && (
          <>
            {text('guest_name', 'Guest name', { required: true })}
            {text('guest_phone', 'Guest phone')}
            <Select label="Room type" placeholder="Pick the room type" data={(roomTypes.data ?? []).map((r) => ({ value: r.id, label: r.name }))} value={typeId} onChange={setTypeId} comboboxProps={{ withinPortal: true }} />
            <div>
              <Text size="sm" fw={500} mb={4}>Meal plan</Text>
              <SegmentedControl fullWidth value={plan} onChange={(v) => setPlan(v as MealPlan)} data={(Object.keys(PLAN_LABEL) as MealPlan[]).map((k) => ({ value: k, label: k === 'bb' ? 'B&B' : k === 'hb' ? 'Half board' : 'Full board' }))} />
              {roomType && <Text size="xs" c="dimmed" mt={4}>{PLAN_LABEL[plan]}: {formatCurrency(planPrice)} per person per night</Text>}
            </div>
            <Group grow align="flex-start">
              <NumberInput label="Nights" min={1} allowDecimal={false} value={nights} onChange={(v) => setNights(Math.max(1, Number(v) || 1))} />
              <NumberInput label="Adults" min={1} allowDecimal={false} value={adults} onChange={(v) => setAdults(Math.max(1, Number(v) || 1))} />
            </Group>
            <Group grow align="flex-start">
              <NumberInput label="Children 4 to 12 (half price)" min={0} allowDecimal={false} value={kidsHalf} onChange={(v) => setKidsHalf(Math.max(0, Number(v) || 0))} />
              <NumberInput label="Children 3 and under (free)" min={0} allowDecimal={false} value={kidsFree} onChange={(v) => setKidsFree(Math.max(0, Number(v) || 0))} />
            </Group>
            {text('room', 'Room number (optional)', { placeholder: 'e.g. 101' })}
          </>
        )}

        {card.qtyLabel && fixed != null && !rate && (
          <NumberInput label={card.qtyLabel} min={1} allowDecimal={false} value={qty} onChange={(v) => setQty(Math.max(1, Number(v) || 1))} />
        )}

        {(manual || ['pool', 'pool_kids', 'train', 'washroom', 'playground'].includes(stream)) && (
          <TextInput label={manual ? (stream === 'accommodation' ? 'Room and guest' : 'What is it for?') : 'Note (optional)'} required={manual} value={desc} onChange={(e) => setDesc(e.currentTarget.value)} />
        )}

        {fixed == null && !stayMode ? (
          <NumberInput label="Amount (KES)" min={0} decimalScale={2} thousandSeparator="," value={amount} onChange={(v) => setAmount(Number(v) || 0)} />
        ) : (
          <Card withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed">To collect{stayMode ? ` (${nights} night${nights === 1 ? '' : 's'}, ${adults + kidsHalf * 0.5} paying)` : quantity > 1 && fixed != null ? ` (${quantity} × ${formatCurrency(fixed)})` : ''}</Text>
            <Text fw={800} fz={24} style={{ color: '#1F3A5F' }}>{formatCurrency(total)}</Text>
          </Card>
        )}
        <div>
          <Text size="sm" fw={500} mb={4}>Paid by</Text>
          <SegmentedControl fullWidth data={METHODS} value={method} onChange={setMethod} />
        </div>
        {method !== 'cash' && (
          <TextInput
            label={method === 'mpesa' ? 'M-Pesa code' : method === 'cheque' ? 'Cheque number' : 'Reference'}
            placeholder={method === 'mpesa' ? 'e.g. QK12AB34CD' : ''}
            value={ref}
            onChange={(e) => setRef(e.currentTarget.value)}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} loading={save.isPending} onClick={submit}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
