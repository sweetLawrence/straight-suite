import { Group, SegmentedControl, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DatePreset, DateRange } from '@/lib/api/reports';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];

function computePresetRange(preset: DatePreset): DateRange {
  const today = dayjs();
  switch (preset) {
    case 'today':
      return {
        from: today.format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
      };
    case 'yesterday': {
      const y = today.subtract(1, 'day');
      return { from: y.format('YYYY-MM-DD'), to: y.format('YYYY-MM-DD') };
    }
    case 'last7':
      return {
        from: today.subtract(6, 'day').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
      };
    case 'last30':
      return {
        from: today.subtract(29, 'day').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
      };
    case 'thisMonth':
      return {
        from: today.startOf('month').format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
      };
    default:
      return {
        from: today.format('YYYY-MM-DD'),
        to: today.format('YYYY-MM-DD'),
      };
  }
}

export function DateRangeSelector({ value, onChange }: Props) {
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState<string | null>(
    dayjs().format('YYYY-MM-DD')
  );
  const [customTo, setCustomTo] = useState<string | null>(
    dayjs().format('YYYY-MM-DD')
  );

  useEffect(() => {
    if (preset !== 'custom') {
      onChange(computePresetRange(preset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo });
    }
  };

  return (
    <Group align="flex-end" gap="sm">
      <SegmentedControl
        value={preset}
        onChange={(v) => setPreset(v as DatePreset)}
        data={presets}
        size="xs"
      />
      {preset === 'custom' && (
        <>
          <DatePickerInput
            label="From"
            value={customFrom}
            onChange={setCustomFrom}
            valueFormat="YYYY-MM-DD"
            size="xs"
            w={140}
          />
          <DatePickerInput
            label="To"
            value={customTo}
            onChange={setCustomTo}
            valueFormat="YYYY-MM-DD"
            size="xs"
            w={140}
          />
          <Button size="xs" onClick={applyCustom}>
            Apply
          </Button>
        </>
      )}
    </Group>
  );
}