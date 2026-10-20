import { ReactNode, useEffect, useState } from 'react';
import { CloseButton, Group, Select, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

export type DatePreset = 'any' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface ToolbarValue {
  search: string;
  preset: DatePreset;
  range: [string | null, string | null];
  status: string | null;
}

export const emptyToolbar = (preset: DatePreset = 'any'): ToolbarValue => ({
  search: '',
  preset,
  range: [null, null],
  status: null,
});

const D = 'YYYY-MM-DD';
// The trading day starts at 06:00, so 01:30 still belongs to yesterday
const tradingToday = () => dayjs().subtract(6, 'hour');

/** Turn the toolbar value into API params: search, from, to, status. */
export function toolbarParams(v: ToolbarValue) {
  const t = tradingToday();
  let from: string | undefined;
  let to: string | undefined;
  switch (v.preset) {
    case 'today':
      from = to = t.format(D);
      break;
    case 'yesterday':
      from = to = t.subtract(1, 'day').format(D);
      break;
    case 'week':
      from = t.subtract(6, 'day').format(D);
      to = t.format(D);
      break;
    case 'month':
      from = t.startOf('month').format(D);
      to = t.format(D);
      break;
    case 'custom':
      from = v.range[0] || undefined;
      to = v.range[1] || v.range[0] || undefined;
      break;
  }
  return {
    search: v.search.trim() || undefined,
    from,
    to,
    status: v.status || undefined,
  };
}

const PRESETS = [
  { value: 'any', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Pick dates…' },
];

interface Props {
  value: ToolbarValue;
  onChange: (v: ToolbarValue) => void;
  placeholder?: string;
  statusOptions?: { value: string; label: string }[];
  statusLabel?: string;
  showDates?: boolean;
  children?: ReactNode;
}

/**
 * Search box (debounced), date preset and an optional status filter.
 * Pages pass `toolbarParams(value)` to their list hook and reset to page 1 on change.
 */
export function ListToolbar({
  value,
  onChange,
  placeholder = 'Search',
  statusOptions,
  statusLabel = 'All statuses',
  showDates = true,
  children,
}: Props) {
  const isMobile = useIsMobile();
  const [text, setText] = useState(value.search);

  useEffect(() => setText(value.search), [value.search]);
  useEffect(() => {
    if (text === value.search) return;
    const t = setTimeout(() => onChange({ ...value, search: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const w = (desktop: number) => (isMobile ? '100%' : desktop);

  return (
    <Group gap="sm" mb="md" wrap="wrap" align="flex-end">
      <TextInput
        placeholder={placeholder}
        leftSection={<Search size={14} />}
        rightSection={text ? <CloseButton size="sm" onClick={() => setText('')} aria-label="Clear search" /> : null}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        style={{ flex: 1, minWidth: isMobile ? '100%' : 220 }}
      />
      {showDates && (
        <Select
          data={PRESETS}
          value={value.preset}
          allowDeselect={false}
          onChange={(p) => onChange({ ...value, preset: (p as DatePreset) || 'any' })}
          w={w(150)}
          aria-label="Date"
        />
      )}
      {showDates && value.preset === 'custom' && (
        <DatePickerInput
          type="range"
          placeholder="From – to"
          valueFormat="D MMM YYYY"
          value={value.range}
          onChange={(r) => onChange({ ...value, range: r as [string | null, string | null] })}
          allowSingleDateInRange
          clearable
          w={w(230)}
        />
      )}
      {statusOptions && (
        <Select
          placeholder={statusLabel}
          data={statusOptions}
          value={value.status}
          onChange={(s) => onChange({ ...value, status: s })}
          clearable
          w={w(160)}
          aria-label="Status"
        />
      )}
      {children}
    </Group>
  );
}
