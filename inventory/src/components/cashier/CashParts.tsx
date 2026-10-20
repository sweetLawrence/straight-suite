import { Box, Card, Group, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { formatCurrency } from '@/lib/utils/format';

export const C = {
  navy: '#1F3A5F',
  navyText: '#D0DCEB',
  green: '#2B8A3E',
  orange: '#F08C00',
  red: '#E03131',
  muted: '#868E96',
  line: '#F1F3F5',
};

/** Payment methods: label and colour, in the order they are shown */
export const METHODS = [
  { key: 'cash', label: 'Cash', color: '#2B8A3E', bg: '#EBFBEE' },
  { key: 'mpesa', label: 'M-Pesa', color: '#0CA678', bg: '#E6FCF5' },
  { key: 'card', label: 'Card', color: '#1971C2', bg: '#E7F5FF' },
  { key: 'cheque', label: 'Cheque', color: '#7048E8', bg: '#F3F0FF' },
  { key: 'bank', label: 'Bank', color: '#1F3A5F', bg: '#EDF2F7' },
  { key: 'other', label: 'Other', color: '#868E96', bg: '#F1F3F5' },
] as const;
export const METHOD_OF = Object.fromEntries(METHODS.map((m) => [m.key, m])) as Record<string, (typeof METHODS)[number]>;

export const REMIT_STATUS: Record<string, { color: string; label: string }> = {
  pending: { color: C.orange, label: 'Waiting for MD' },
  received: { color: C.green, label: 'Confirmed' },
  disputed: { color: C.red, label: 'Disputed' },
};

export function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Text fw={600} size="sm">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {count}
        </Text>
      </Group>
      {count === 0 ? (
        <Text size="sm" c="dimmed" px="md" py="md">
          {empty}
        </Text>
      ) : (
        children
      )}
    </Card>
  );
}

export function Row({ children, to }: { children: React.ReactNode; to?: string }) {
  const inner = (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm" px="md" py="sm" style={{ borderBottom: `1px solid ${C.line}` }}>
      {children}
    </Group>
  );
  return to ? (
    <Box component={Link} to={to} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
      {inner}
    </Box>
  ) : (
    inner
  );
}

export function Money({ value }: { value: number | null }) {
  const v = Number(value || 0);
  return (
    <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: v < 0 ? C.red : C.navy }}>
      {v < 0 ? `−${formatCurrency(-v)}` : formatCurrency(v)}
    </Text>
  );
}
