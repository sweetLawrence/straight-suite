import { useEffect, useRef, useState } from 'react';
import { Badge, Box, Card, Drawer, Group, Loader, Stack, Text, UnstyledButton } from '@mantine/core';
import dayjs from 'dayjs';
import { ArrowDownRight, ArrowUpRight, Wine } from 'lucide-react';
import { useBarMovements } from '@/hooks/useBarStock';
import type { BarDrink } from '@/lib/api/barStock';
import { formatPacks } from '@/lib/utils/format';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TotsPanel } from './TotsPanel';

export const BAR = {
  wine: '#862E9C',
  wineSoft: '#F8F0FC',
  navy: '#1F3A5F',
  green: '#2F9E44',
  orange: '#F08C00',
  red: '#E03131',
  muted: '#868E96',
  track: '#E9ECEF',
};

const num = (v: number) => Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 });
export const kes = (v: number) => `KES ${Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
const plural = (unit: string | null, n: number) => {
  const u = unit || 'piece';
  return n === 1 ? u : `${u}s`;
};

const STATUS = {
  ok: { label: 'In stock', color: BAR.green },
  low: { label: 'Running low', color: BAR.orange },
  out: { label: 'Out of stock', color: BAR.red },
};

/**
 * Remembers each drink's last count and reports drops (and top-ups) seen on
 * refresh, so a card can flash "−2 just now" when the bar issues a drink.
 */
export function useStockChanges(drinks: BarDrink[] | undefined, holdMs = 20_000) {
  const prev = useRef<Map<string, number> | null>(null);
  const [changes, setChanges] = useState<Record<string, { delta: number; at: number }>>({});

  useEffect(() => {
    if (!drinks) return;
    const now = Date.now();
    const next = new Map(drinks.map((d) => [d.id, d.balance]));
    if (prev.current) {
      const found: Record<string, { delta: number; at: number }> = {};
      for (const d of drinks) {
        const before = prev.current.get(d.id);
        if (before !== undefined && before !== d.balance) found[d.id] = { delta: d.balance - before, at: now };
      }
      if (Object.keys(found).length) setChanges((c) => ({ ...c, ...found }));
    }
    prev.current = next;
  }, [drinks]);

  // Let the highlight fade after a while
  useEffect(() => {
    const ids = Object.keys(changes);
    if (!ids.length) return;
    const t = setTimeout(() => {
      const cutoff = Date.now() - holdMs;
      setChanges((c) => Object.fromEntries(Object.entries(c).filter(([, v]) => v.at > cutoff)));
    }, holdMs);
    return () => clearTimeout(t);
  }, [changes, holdMs]);

  return changes;
}

// ─── One drink ──────────────────────────────────────────────────────

export function DrinkCard({
  drink,
  isToday,
  change,
  showProperty,
  onOpen,
}: {
  drink: BarDrink;
  isToday: boolean;
  change?: { delta: number };
  showProperty?: boolean;
  onOpen: () => void;
}) {
  const st = STATUS[drink.status];
  const left = isToday ? drink.balance : drink.closing;
  const startOfDay = drink.opening + drink.received;
  const pct = startOfDay > 0 ? Math.max(0, Math.min(100, (left / startOfDay) * 100)) : 0;
  const packs = formatPacks(left, drink.pack_size, drink.pack_label);
  const flashing = !!change;

  return (
    <UnstyledButton onClick={onOpen} style={{ display: 'block', width: '100%' }}>
      <Card
        withBorder
        radius="md"
        p="md"
        style={{
          borderColor: flashing ? (change!.delta < 0 ? BAR.orange : BAR.green) : undefined,
          boxShadow: flashing ? `0 0 0 3px ${change!.delta < 0 ? '#F08C0033' : '#2F9E4433'}` : undefined,
          transition: 'box-shadow 300ms, border-color 300ms',
          height: '100%',
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Box
              w={36}
              h={36}
              style={{
                borderRadius: 8,
                background: BAR.wineSoft,
                color: BAR.wine,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Wine size={18} />
            </Box>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text fw={600} truncate>
                {drink.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {showProperty ? `${drink.property} · ` : ''}
                {drink.last_sold_at ? `Last sold ${dayjs(drink.last_sold_at).format('D MMM, HH:mm')}` : 'Not sold yet'}
              </Text>
            </Stack>
          </Group>
          {flashing ? (
            <Badge
              variant="filled"
              style={{ backgroundColor: change!.delta < 0 ? BAR.orange : BAR.green, flexShrink: 0 }}
            >
              {change!.delta > 0 ? '+' : '−'}
              {num(Math.abs(change!.delta))} just now
            </Badge>
          ) : (
            <Badge variant="light" style={{ color: st.color, backgroundColor: `${st.color}1A`, flexShrink: 0 }}>
              {st.label}
            </Badge>
          )}
        </Group>

        <Group align="baseline" gap={6} mt="sm">
          <Text fw={800} fz={32} lh={1} style={{ color: drink.status === 'ok' ? BAR.navy : st.color }}>
            {num(left)}
          </Text>
          <Text size="sm" c="dimmed">
            {plural(drink.unit, left)} {isToday ? 'left' : 'left at close'}
          </Text>
        </Group>
        {packs && (
          <Text size="xs" c="dimmed" mt={2}>
            {packs}
          </Text>
        )}
        {drink.tots && (
          <Text size="xs" fw={600} mt={2} style={{ color: BAR.wine }}>
            {drink.tots.open_tots_left > 0
              ? `+ open bottle: ${drink.tots.open_tots_left} of ${drink.tots.tots_per_bottle} tots left`
              : `Sold by the tot as "${drink.tots.tot_name}". No bottle open yet.`}
          </Text>
        )}

        <Box h={6} mt="sm" style={{ background: BAR.track, borderRadius: 3, overflow: 'hidden' }}>
          <Box h="100%" style={{ width: `${pct}%`, background: st.color, borderRadius: 3, transition: 'width 400ms' }} />
        </Box>

        <Group gap={6} mt="sm" wrap="wrap">
          <Chip label="Start" value={num(drink.opening)} />
          {drink.received > 0 && <Chip label="In" value={`+${num(drink.received)}`} color={BAR.green} />}
          <Chip label="Sold" value={drink.sold ? `−${num(drink.sold)}` : '0'} color={drink.sold ? BAR.wine : undefined} />
          {drink.waste > 0 && <Chip label="Waste" value={`−${num(drink.waste)}`} color={BAR.red} />}
          {drink.other !== 0 && (
            <Chip label="Other" value={`${drink.other > 0 ? '+' : '−'}${num(Math.abs(drink.other))}`} />
          )}
          {drink.revenue > 0 && <Chip label="Sales" value={kes(drink.revenue)} color={BAR.navy} />}
        </Group>
      </Card>
    </UnstyledButton>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box px={8} py={2} style={{ background: '#F1F3F5', borderRadius: 6 }}>
      <Text size="xs" c="dimmed" span>
        {label}{' '}
      </Text>
      <Text size="xs" fw={700} span style={{ color }}>
        {value}
      </Text>
    </Box>
  );
}

// ─── Movement history for one drink ─────────────────────────────────

export function MovementsDrawer({ drinkId, onClose }: { drinkId: string | null; onClose: () => void }) {
  const isMobile = useIsMobile();
  const q = useBarMovements(drinkId);
  const d = q.data;

  return (
    <Drawer
      opened={!!drinkId}
      onClose={onClose}
      position={isMobile ? 'bottom' : 'right'}
      size={isMobile ? '85%' : 460}
      title={
        <Stack gap={0}>
          <Text fw={700} style={{ color: BAR.navy }}>
            {d?.drink.name || 'Drink'}
          </Text>
          <Text size="xs" c="dimmed">
            Every movement, newest first
          </Text>
        </Stack>
      }
    >
      {d && <TotsPanel drinkId={d.drink.id} name={d.drink.name} tots={d.drink.tots} />}
      {!d ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : d.rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          No movements yet.
        </Text>
      ) : (
        <Stack gap={0}>
          {d.rows.map((m) => {
            const down = m.change < 0;
            const color = m.type === 'waste' ? BAR.red : down ? BAR.wine : BAR.green;
            const packs = formatPacks(m.balance_after, d.drink.pack_size, d.drink.pack_label);
            return (
              <Group
                key={m.id}
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
                py="sm"
                style={{ borderBottom: `1px solid ${BAR.track}` }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                  <Box
                    w={28}
                    h={28}
                    mt={2}
                    style={{
                      borderRadius: 14,
                      background: `${color}1A`,
                      color,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {down ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                  </Box>
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600}>
                      {m.label}
                      {m.menu_item ? ` · ${m.menu_item}` : ''}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dayjs(m.at).format('ddd D MMM, HH:mm')}
                      {m.by ? ` · ${m.by}` : ''}
                    </Text>
                    {(m.order_ref || m.batch_ref) && (
                      <Text size="xs" c="dimmed">
                        {m.order_ref
                          ? `${m.order_ref}${m.table_number ? ` · Table ${m.table_number}` : ''}${m.waiter ? ` · ${m.waiter}` : ''}`
                          : m.batch_ref}
                      </Text>
                    )}
                  </Stack>
                </Group>
                <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                  <Text fw={700} style={{ color }}>
                    {m.change > 0 ? '+' : '−'}
                    {num(Math.abs(m.change))}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {num(m.balance_after)} left
                  </Text>
                  {packs && (
                    <Text size="10px" c="dimmed">
                      {packs}
                    </Text>
                  )}
                </Stack>
              </Group>
            );
          })}
        </Stack>
      )}
    </Drawer>
  );
}
