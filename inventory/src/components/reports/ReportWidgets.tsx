import { ReactNode } from 'react';
import { Box, Card, Group, Stack, Table, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { StatusDot } from '@/components/StatusDot';

// Shared palette for the reports pages
export const RC = {
  navy: '#1F3A5F',
  blue: '#228BE6',
  teal: '#15AABF',
  green: '#2F9E44',
  orange: '#F08C00',
  red: '#E03131',
  grape: '#9C36B5',
  muted: '#868E96',
  track: '#E9ECEF',
};

export const kes = (v: number | null | undefined, decimals = 0) =>
  `KES ${Number(v || 0).toLocaleString('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export const num = (v: number | null | undefined, decimals = 0) =>
  Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: decimals });

// ─── KPI card ───────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  color?: string;
}

export function Kpi({ label, value, hint, icon, color = RC.navy }: KpiProps) {
  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" align="flex-start">
            <Box mt={5} style={{ display: 'flex' }}>
              <StatusDot color={color} />
            </Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.3}>
              {label}
            </Text>
          </Group>
          <Text fw={700} fz={{ base: 17, sm: 20 }} style={{ color: RC.navy, lineHeight: 1.25, whiteSpace: 'nowrap' }}>
            {value}
          </Text>
          {hint && (
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
          )}
        </Stack>
        {icon && (
          <ThemeIcon visibleFrom="xl" variant="light" radius="md" size={32} style={{ color, backgroundColor: `${color}1A` }}>
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Card>
  );
}

// ─── Section card ───────────────────────────────────────────────────

export function Section({
  title,
  subtitle,
  right,
  children,
  flush,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <Card withBorder radius="md" p={0}>
      <Group justify="space-between" px="md" py="sm" wrap="wrap" gap="xs" style={{ borderBottom: `1px solid ${RC.track}` }}>
        <Stack gap={0}>
          <Text fw={600} style={{ color: RC.navy }}>
            {title}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        {right}
      </Group>
      <Box p={flush ? 0 : 'md'}>{children}</Box>
    </Card>
  );
}

// ─── Horizontal bar list (no chart library needed) ──────────────────

export interface BarItem {
  label: ReactNode;
  value: number;
  display?: ReactNode;
  sub?: ReactNode;
  color?: string;
}

export function BarList({ items, empty = 'Nothing in this period' }: { items: BarItem[]; empty?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (!items.length || max <= 0) return <Empty text={empty} />;
  return (
    <Stack gap={10}>
      {items.map((it, i) => (
        <Box key={i}>
          <Group justify="space-between" gap="xs" wrap="nowrap" mb={4}>
            <Text size="sm" truncate style={{ minWidth: 0 }}>
              {it.label}
            </Text>
            <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
              {it.display ?? num(it.value)}
            </Text>
          </Group>
          <Box h={8} style={{ background: RC.track, borderRadius: 4, overflow: 'hidden' }}>
            <Box
              h="100%"
              style={{
                width: `${Math.max((it.value / max) * 100, it.value > 0 ? 2 : 0)}%`,
                background: it.color || RC.blue,
                borderRadius: 4,
              }}
            />
          </Box>
          {it.sub && (
            <Text size="xs" c="dimmed" mt={2}>
              {it.sub}
            </Text>
          )}
        </Box>
      ))}
    </Stack>
  );
}

// ─── Vertical columns for a daily trend ─────────────────────────────

export function DayColumns({
  days,
}: {
  days: { day: string; value: number; label: string; tip: string }[];
}) {
  const max = Math.max(...days.map((d) => d.value), 0);
  if (!days.length || max <= 0) return <Empty text="No sales in this period" />;
  const showEvery = days.length > 16 ? Math.ceil(days.length / 10) : 1;
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Group gap={4} align="flex-end" wrap="nowrap" h={170} style={{ minWidth: days.length * 18 }}>
        {days.map((d, i) => (
          <Tooltip key={d.day} label={d.tip} withArrow>
            <Stack gap={4} align="center" justify="flex-end" h="100%" style={{ flex: 1, minWidth: 14 }}>
              <Box
                w="100%"
                maw={42}
                style={{
                  height: `${Math.max((d.value / max) * 140, d.value > 0 ? 3 : 1)}px`,
                  background: d.value > 0 ? RC.blue : RC.track,
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap', visibility: i % showEvery ? 'hidden' : 'visible' }}>
                {d.label}
              </Text>
            </Stack>
          </Tooltip>
        ))}
      </Group>
    </Box>
  );
}

// ─── Simple data table ──────────────────────────────────────────────

export interface Col<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  total?: (rows: T[]) => ReactNode;
}

export function DataTable<T>({
  rows,
  cols,
  minWidth = 560,
  empty = 'No records in this period',
  rowKey,
  maxHeight,
}: {
  maxHeight?: number;
  rows: T[];
  cols: Col<T>[];
  minWidth?: number;
  empty?: string;
  rowKey?: (row: T, i: number) => string;
}) {
  if (!rows.length) return <Empty text={empty} />;
  const hasTotal = cols.some((c) => c.total);
  const table = (
      <Table striped highlightOnHover verticalSpacing={6} fz="sm" stickyHeader={!!maxHeight} miw={maxHeight ? minWidth : undefined}>
        <Table.Thead style={{ background: '#F1F4F8' }}>
          <Table.Tr>
            {cols.map((c) => (
              <Table.Th key={c.key} ta={c.align} style={{ color: RC.navy, whiteSpace: 'nowrap' }}>
                {c.title}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r, i) => (
            <Table.Tr key={rowKey ? rowKey(r, i) : i}>
              {cols.map((c) => (
                <Table.Td key={c.key} ta={c.align}>
                  {c.render(r)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
        {hasTotal && (
          <Table.Tfoot style={maxHeight ? { position: 'sticky', bottom: 0, zIndex: 1 } : undefined}>
            <Table.Tr style={{ background: '#F1F4F8' }}>
              {cols.map((c, i) => (
                <Table.Th key={c.key} ta={c.align}>
                  {c.total ? c.total(rows) : i === 0 ? 'Total' : ''}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Tfoot>
        )}
      </Table>
  );
  // Long lists scroll inside the card so the page stays short
  if (maxHeight) {
    return (
      <Box style={{ maxHeight, overflow: 'auto' }}>
        {table}
      </Box>
    );
  }
  return <Table.ScrollContainer minWidth={minWidth}>{table}</Table.ScrollContainer>;
}

export function Empty({ text }: { text: string }) {
  return (
    <Text size="sm" c="dimmed" ta="center" py="lg">
      {text}
    </Text>
  );
}

// ─── "Needs attention" tile ─────────────────────────────────────────

export function AttentionTile({
  label,
  count,
  amount,
  to,
  color,
}: {
  label: string;
  count: number;
  amount?: number;
  to?: string;
  color: string;
}) {
  const active = count > 0;
  const body = (
    <Card
      withBorder
      radius="md"
      p="sm"
      style={{
        cursor: to ? 'pointer' : undefined,
        height: '100%',
      }}
    >
      <Group gap={6} wrap="nowrap" align="flex-start">
        <Box mt={5} style={{ display: 'flex' }}>
          <StatusDot color={active ? color : '#CED4DA'} />
        </Box>
        <Text size="xs" c="dimmed" fw={600}>
          {label}
        </Text>
      </Group>
      <Group gap={6} align="baseline">
        <Text fw={700} fz="lg" style={{ color: active ? color : RC.muted }}>
          {count}
        </Text>
        {amount != null && amount > 0 && (
          <Text size="xs" c="dimmed">
            {kes(amount)}
          </Text>
        )}
      </Group>
    </Card>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      {body}
    </Link>
  ) : (
    body
  );
}
