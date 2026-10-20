import { Fragment, ReactNode } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

/**
 * Groups a list under headings like a chat history: Today, Yesterday,
 * Previous 7 days, Previous 30 days, Older.
 *
 * "Today" follows the trading day (06:00 to 06:00), so an order taken at
 * 01:30 still sits under Today with the rest of last night's work.
 */
const DAY_START_HOUR = 6;

const tradingDay = (d: string | Date) => dayjs(d).subtract(DAY_START_HOUR, 'hour').startOf('day');

export function dayGroupLabel(date: string | Date | null | undefined, now = new Date()): string {
  if (!date) return 'Older';
  const diff = tradingDay(now).diff(tradingDay(date), 'day');
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Previous 7 days';
  if (diff < 30) return 'Previous 30 days';
  return 'Older';
}

export function DayGroupedList<T>({
  items,
  getDate,
  keyOf,
  render,
  gap = 'sm',
}: {
  items: T[];
  getDate: (item: T) => string | Date | null | undefined;
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
  gap?: string | number;
}) {
  const now = new Date();
  // Items arrive newest first, so groups come out in order
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = dayGroupLabel(getDate(item), now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <Stack gap="md">
      {groups.map((g, i) => (
        <Fragment key={`${g.label}-${i}`}>
          <Stack gap={gap}>
            <Group justify="space-between" px={2} mb={-2}>
              <Text size="xs" fw={700} tt="uppercase" style={{ color: '#495057', letterSpacing: 0.4 }}>
                {g.label}
              </Text>
              <Text size="xs" style={{ color: '#868E96' }}>
                {g.items.length}
              </Text>
            </Group>
            {g.items.map((item) => (
              <Fragment key={keyOf(item)}>{render(item)}</Fragment>
            ))}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
}
