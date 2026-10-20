import { Box, Card, Group, ScrollArea, SimpleGrid, Stack, Table, Text, UnstyledButton } from '@mantine/core';
import dayjs from 'dayjs';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { fmtCell, type Report, type Tile } from './reports';

const right = (k?: string) => k === 'money' || k === 'qty';

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm" mb="md">
      {tiles.map((t) => (
        <Card key={t.label} withBorder radius="md" p="sm" style={{ background: t.bg, borderColor: '#DEE2E6' }}>
          <Text size="xs" fw={600} c={t.color}>{t.label}</Text>
          <Text fw={800} fz={{ base: 17, sm: 20 }} c={t.color} style={{ lineHeight: 1.25 }}>
            {t.count ? t.value.toLocaleString('en-KE') : `KES ${fmtCell(t.value, 'money')}`}
          </Text>
          {t.hint && <Text size="xs" c="#495057" mt={2}>{t.hint}</Text>}
        </Card>
      ))}
    </SimpleGrid>
  );
}

/** A report as a table on a wide screen, as cards on a phone */
export function ReportTable({ report, onRow }: { report: Report; onRow?: (id: string) => void }) {
  const isMobile = useIsMobile();
  const { cols, rows, total } = report;
  const [first, ...rest] = cols;
  const clickable = (i: number) => !!onRow && !!report.ids?.[i];

  if (isMobile) {
    return (
      <Stack gap={8}>
        {rows.length === 0 && <Text size="sm" c="dimmed">Nothing in this period.</Text>}
        {rows.map((r, i) => {
          const body = (
            <Card withBorder radius="md" p="sm" style={{ borderColor: '#DEE2E6', background: report.strong?.includes(i) ? '#F1F3F5' : '#FFFFFF' }}>
              <Group justify="space-between" wrap="nowrap" gap={6} mb={4}>
                <Text fw={700} size="sm" style={{ minWidth: 0 }}>{fmtCell(r[first.key], first.kind) || '-'}</Text>
                {clickable(i) && <ChevronRight size={16} color="#868E96" />}
              </Group>
              <SimpleGrid cols={2} spacing={4} verticalSpacing={2}>
                {rest.filter((c) => r[c.key] != null && r[c.key] !== '' && r[c.key] !== 0).map((c) => (
                  <Box key={c.key} style={{ minWidth: 0 }}>
                    <Text size="11px" c="#868E96">{c.label}</Text>
                    <Text size="sm" fw={c.key === 'balance' || c.key === 'amount' || c.key === 'profit' ? 700 : 500} style={{ overflowWrap: 'anywhere' }}>
                      {fmtCell(r[c.key], c.kind)}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Card>
          );
          return clickable(i)
            ? <UnstyledButton key={i} onClick={() => onRow!(report.ids![i])} style={{ display: 'block', width: '100%' }}>{body}</UnstyledButton>
            : <Box key={i}>{body}</Box>;
        })}
        {total && (
          <Card radius="md" p="sm" style={{ background: '#1F3A5F' }}>
            <Text fw={700} size="sm" c="#FFFFFF" mb={4}>{fmtCell(total[first.key]) || 'Total'}</Text>
            <SimpleGrid cols={2} spacing={4} verticalSpacing={2}>
              {rest.filter((c) => total[c.key] != null && total[c.key] !== '').map((c) => (
                <Box key={c.key}>
                  <Text size="11px" c="#CED4DA">{c.label}</Text>
                  <Text size="sm" fw={700} c="#FFFFFF">{fmtCell(total[c.key], c.kind)}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Card>
        )}
      </Stack>
    );
  }

  return (
    <Card withBorder radius="md" p={0} style={{ borderColor: '#DEE2E6' }}>
      <ScrollArea type="auto">
        <Table striped highlightOnHover={!!onRow} verticalSpacing={6} horizontalSpacing="sm" fz={13}>
          <Table.Thead style={{ background: '#F8F9FA' }}>
            <Table.Tr>
              {cols.map((c) => (
                <Table.Th key={c.key} style={{ textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: 'nowrap', fontSize: 12 }}>{c.label}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 && (
              <Table.Tr><Table.Td colSpan={cols.length}><Text size="sm" c="dimmed" py="sm">Nothing in this period.</Text></Table.Td></Table.Tr>
            )}
            {rows.map((r, i) => (
              <Table.Tr
                key={i}
                onClick={clickable(i) ? () => onRow!(report.ids![i]) : undefined}
                style={{ cursor: clickable(i) ? 'pointer' : undefined, fontWeight: report.strong?.includes(i) ? 700 : undefined }}
              >
                {cols.map((c) => (
                  <Table.Td key={c.key} style={{ textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: c.kind === 'date' || right(c.kind) ? 'nowrap' : undefined, color: c.kind === 'money' && Number(r[c.key]) < 0 ? '#C92A2A' : undefined }}>
                    {fmtCell(r[c.key], c.kind)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
          {total && (
            <Table.Tfoot>
              <Table.Tr style={{ background: '#E9ECEF', fontWeight: 700 }}>
                {cols.map((c) => (
                  <Table.Td key={c.key} style={{ textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: c.kind === 'money' ? 'nowrap' : undefined, fontWeight: c.key === first.key && String(total[c.key] ?? '').length > 30 ? 400 : 700, fontSize: c.key === first.key && String(total[c.key] ?? '').length > 30 ? 12 : undefined }}>
                    {fmtCell(total[c.key], c.kind)}
                  </Table.Td>
                ))}
              </Table.Tr>
            </Table.Tfoot>
          )}
        </Table>
      </ScrollArea>
    </Card>
  );
}

/** Plain black-and-white table for printing */
export function PrintTable({ report }: { report: Report }) {
  const cell = { border: '1px solid #ADB5BD', padding: '3px 6px', fontSize: 10.5 };
  return (
    <div style={{ marginBottom: 14, breakInside: 'avoid-page' }}>
      <div style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 4px', color: '#1F3A5F' }}>{report.title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {report.cols.map((c) => (
              <th key={c.key} style={{ ...cell, background: '#E9ECEF', textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r, i) => (
            <tr key={i} style={{ fontWeight: report.strong?.includes(i) ? 700 : 400 }}>
              {report.cols.map((c) => (
                <td key={c.key} style={{ ...cell, textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: right(c.kind) || c.kind === 'date' ? 'nowrap' : undefined }}>{fmtCell(r[c.key], c.kind)}</td>
              ))}
            </tr>
          ))}
          {report.total && (
            <tr style={{ fontWeight: 700, background: '#F1F3F5' }}>
              {report.cols.map((c) => (
                <td key={c.key} style={{ ...cell, textAlign: right(c.kind) ? 'right' : 'left', whiteSpace: right(c.kind) ? 'nowrap' : undefined }}>{fmtCell(report.total?.[c.key], c.kind)}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dates ───────────────────────────────────────────────────────

export type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'year' | 'custom';
export const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Pick dates' },
];
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
export const tradingToday = () => dayjs().subtract(6, 'hour');
export function rangeOf(p: Preset): [string, string] {
  const t = tradingToday();
  if (p === 'yesterday') return [fmt(t.subtract(1, 'day')), fmt(t.subtract(1, 'day'))];
  if (p === 'week') return [fmt(t.subtract((t.day() + 6) % 7, 'day')), fmt(t)];
  if (p === 'month') return [fmt(t.startOf('month')), fmt(t)];
  if (p === 'last_month') { const l = t.subtract(1, 'month'); return [fmt(l.startOf('month')), fmt(l.endOf('month'))]; }
  if (p === 'year') return [fmt(t.startOf('year')), fmt(t)];
  return [fmt(t), fmt(t)];
}

export function Pills<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <ScrollArea type="never">
      <Group gap={6} wrap="nowrap" pb={4}>
        {items.map((p) => (
          <UnstyledButton
            key={p.value}
            onClick={() => onChange(p.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${value === p.value ? '#1F3A5F' : '#DEE2E6'}`,
              background: value === p.value ? '#1F3A5F' : '#FFFFFF',
              color: value === p.value ? '#FFFFFF' : '#212529',
            }}
          >
            {p.label}
          </UnstyledButton>
        ))}
      </Group>
    </ScrollArea>
  );
}

export const periodLabel = (from?: string, to?: string) =>
  !from ? '' : from === to ? dayjs(from).format('dddd D MMM YYYY') : `${dayjs(from).format('D MMM YYYY')} to ${dayjs(to).format('D MMM YYYY')}`;
