import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  Menu,
  Modal,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { CalendarCheck, CalendarX, ChevronDown, Clock, RotateCcw } from 'lucide-react';
import {
  useCloseBusinessDay,
  useCloseShift,
  useDayStatus,
  useReopenBusinessDay,
  useStartNextShift,
} from '@/hooks/useBusinessDay';
import { getErrorMessage } from '@/lib/api/client';
import type { DayStatus } from '@/lib/api/businessDay';

const C = {
  navy: '#1F3A5F',
  green: '#2F9E44',
  red: '#E03131',
  orange: '#F08C00',
  muted: '#868E96',
  line: '#E9ECEF',
  soft: '#F8F9FA',
};

const kes = (v: number) => `KES ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const time = (d?: string | null) => (d ? dayjs(d).format('HH:mm') : '');
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

const ok = (title: string, message?: string) => notifications.show({ color: 'green', title, message });
const fail = (e: unknown) => notifications.show({ color: 'red', title: 'Not done', message: getErrorMessage(e) });

/**
 * Day & shift controls for one property. MD/admin pass a propertyId;
 * managers leave it out and get their own property.
 */
export function DayShiftPanel({ propertyId, propertyName }: { propertyId?: string; propertyName?: string }) {
  const status = useDayStatus(propertyId);
  const nextShift = useStartNextShift();
  const endShift = useCloseShift();
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const s = status.data;
  if (status.isLoading || !s) {
    return (
      <Card withBorder radius="md" p="md">
        {status.isError ? <Text c="red" size="sm">{getErrorMessage(status.error)}</Text> : <Loader size="sm" />}
      </Card>
    );
  }

  const day = s.day;
  const isOpen = day?.status === 'open';
  const canReopen = day?.status === 'closed' && day.business_date === s.trading_date;

  const startShift = (code?: 'day' | 'night') =>
    nextShift.mutate(
      { property_id: propertyId, code },
      { onSuccess: (sh) => ok(`${sh.name} started`, 'The previous shift was closed.'), onError: fail }
    );

  const closeCurrent = () =>
    s.shift &&
    endShift.mutate(
      { id: s.shift.id },
      { onSuccess: () => ok('Shift ended', 'The next shift starts with the next order or payment.'), onError: fail }
    );

  return (
    <Card withBorder radius="md" p={0}>
      {/* Header */}
      <Group justify="space-between" px="md" py="sm" wrap="wrap" gap="xs" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Stack gap={0}>
          <Text fw={600} style={{ color: C.navy }}>
            {propertyName ? `${propertyName} · ` : ''}Business day
          </Text>
          <Text size="xs" c="dimmed">
            Trading day runs {hh(s.start_hour)} to {hh(s.start_hour)} · night shift from {hh(s.night_shift_hour)}
          </Text>
        </Stack>
        {day ? (
          <Badge
            size="lg"
            variant="light"
            style={{ color: isOpen ? C.green : C.red, backgroundColor: isOpen ? '#2F9E441A' : '#E031311A' }}
          >
            {dayjs(day.business_date).format('ddd D MMM')} · {isOpen ? 'Open' : 'Closed'}
          </Badge>
        ) : (
          <Badge size="lg" variant="light" style={{ color: C.muted, backgroundColor: C.soft }}>
            Not started
          </Badge>
        )}
      </Group>

      <Stack gap="sm" p="md">
        {!day && (
          <Text size="sm" c="dimmed">
            Today ({dayjs(s.trading_date).format('ddd D MMM')}) opens automatically with the first order, payment or
            stock entry. Nothing to do.
          </Text>
        )}

        {day && !isOpen && (
          <Alert color="red" variant="light" icon={<CalendarX size={16} />} py="xs">
            Closed at {dayjs(day.closed_at).format('HH:mm')}. Waiters cannot place orders or take payments until the day
            is reopened{canReopen ? '' : ' (a new day opens automatically tomorrow)'}.
          </Alert>
        )}

        {/* Shifts today */}
        {s.shifts.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>
              Shifts
            </Text>
            <Stack gap={4}>
              {s.shifts.map((sh) => (
                <Group key={sh.id} justify="space-between" gap="xs" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Clock size={14} color={sh.status === 'open' ? C.green : C.muted} />
                    <Text size="sm" fw={sh.status === 'open' ? 600 : 400}>
                      {sh.name}
                    </Text>
                    {sh.status === 'open' && (
                      <Badge size="xs" variant="light" style={{ color: C.green, backgroundColor: '#2F9E441A' }}>
                        Now
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" ta="right">
                    {time(sh.opened_at)}–{sh.closed_at ? time(sh.closed_at) : 'now'}
                    {sh.closed_by_user ? ` · ended by ${sh.closed_by_user.full_name}` : sh.closed_at ? ' · auto' : ''}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Box>
        )}

        {/* Checklist */}
        {isOpen && s.checklist && <Checklist items={s.checklist.items} />}

        {/* Actions */}
        <Group gap="xs" mt={4}>
          {isOpen && (
            <>
              <Group gap={0} wrap="nowrap">
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => startShift()}
                  loading={nextShift.isPending}
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                >
                  Start next shift
                </Button>
                <Menu position="bottom-end">
                  <Menu.Target>
                    <Button size="xs" variant="light" px={6} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: '1px solid #D0EBFF' }}>
                      <ChevronDown size={14} />
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => startShift('day')}>Start Day Shift</Menu.Item>
                    <Menu.Item onClick={() => startShift('night')}>Start Night Shift</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              {s.shift && (
                <Button size="xs" variant="default" onClick={closeCurrent} loading={endShift.isPending}>
                  End shift
                </Button>
              )}
              <Button
                size="xs"
                leftSection={<CalendarCheck size={14} />}
                onClick={() => setClosing(true)}
                style={{ backgroundColor: C.navy }}
              >
                Close day
              </Button>
            </>
          )}
          {canReopen && (
            <Button size="xs" variant="light" color="orange" leftSection={<RotateCcw size={14} />} onClick={() => setReopening(true)}>
              Reopen day
            </Button>
          )}
        </Group>
      </Stack>

      {day && <CloseDayModal opened={closing} onClose={() => setClosing(false)} status={s} />}
      {day && <ReopenDayModal opened={reopening} onClose={() => setReopening(false)} dayId={day.id} />}
    </Card>
  );
}

function Checklist({ items }: { items: NonNullable<DayStatus['checklist']>['items'] }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>
        Before closing
      </Text>
      <Stack gap={4}>
        {items.map((i) => {
          const color = i.count === 0 ? C.green : i.blocking ? C.red : C.orange;
          return (
            <Group key={i.key} justify="space-between" gap="xs" wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <Box w={8} h={8} style={{ borderRadius: 4, background: color, flexShrink: 0 }} />
                <Text size="sm">{i.label}</Text>
              </Group>
              <Text size="sm" fw={600} style={{ color, whiteSpace: 'nowrap' }}>
                {i.count === 0 ? 'None' : `${i.count}${i.amount ? ` · ${kes(i.amount)}` : ''}`}
              </Text>
            </Group>
          );
        })}
      </Stack>
    </Box>
  );
}

function CloseDayModal({ opened, onClose, status }: { opened: boolean; onClose: () => void; status: DayStatus }) {
  const close = useCloseBusinessDay();
  const [notes, setNotes] = useState('');
  const [force, setForce] = useState(false);
  const ready = status.checklist?.ready ?? true;
  const day = status.day!;

  const submit = () =>
    close.mutate(
      { id: day.id, force: !ready && force, notes: notes || undefined },
      {
        onSuccess: () => {
          ok('Business day closed', dayjs(day.business_date).format('dddd D MMMM'));
          setNotes('');
          setForce(false);
          onClose();
        },
        onError: fail,
      }
    );

  return (
    <Modal opened={opened} onClose={onClose} title={`Close ${dayjs(day.business_date).format('dddd D MMM')}`} centered>
      <Stack gap="sm">
        {status.checklist && <Checklist items={status.checklist.items} />}
        <Text size="sm" c="dimmed">
          Closing ends all open shifts. Waiters cannot order or take payments until a manager reopens the day. The next
          day opens by itself at {hh(status.start_hour)}.
        </Text>
        {!ready && (
          <Alert color="red" variant="light" py="xs">
            <Checkbox
              checked={force}
              onChange={(e) => setForce(e.currentTarget.checked)}
              label="Close anyway. Unpaid bills stay open and can be paid tomorrow."
            />
          </Alert>
        )}
        <Textarea
          label={!ready && force ? 'Reason (required)' : 'Notes (optional)'}
          placeholder={!ready && force ? 'e.g. Table 4 will settle in the morning' : ''}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          autosize
          minRows={2}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={close.isPending}
            disabled={!ready && (!force || !notes.trim())}
            style={{ backgroundColor: C.navy }}
          >
            Close day
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function ReopenDayModal({ opened, onClose, dayId }: { opened: boolean; onClose: () => void; dayId: string }) {
  const reopen = useReopenBusinessDay();
  const [notes, setNotes] = useState('');
  const submit = () =>
    reopen.mutate(
      { id: dayId, notes: notes || undefined },
      {
        onSuccess: (r) => {
          ok('Business day reopened', `${r.shift.name} started`);
          setNotes('');
          onClose();
        },
        onError: fail,
      }
    );
  return (
    <Modal opened={opened} onClose={onClose} title="Reopen today" centered>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Trading resumes and a new shift starts. This is recorded in the activity log.
        </Text>
        <Textarea label="Reason" placeholder="e.g. Late group arrived" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} autosize minRows={2} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="orange" onClick={submit} loading={reopen.isPending}>
            Reopen
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
