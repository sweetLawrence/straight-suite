import { useState } from 'react';
import { Select, Stack, TextInput } from '@mantine/core';

const OTHER = 'Other (type it)';

/** A drop-down of common reasons plus a typed one. The value is always the final text. */
export function ReasonField({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: React.ReactNode;
  required?: boolean;
}) {
  const [custom, setCustom] = useState(() => !!value && !options.includes(value));
  const selected = custom ? OTHER : options.includes(value) ? value : null;
  return (
    <Stack gap={6}>
      <Select
        label={label}
        required={required}
        placeholder="Pick a reason"
        data={[...options, OTHER]}
        value={selected}
        error={custom ? undefined : error}
        allowDeselect={false}
        onChange={(v) => {
          if (v === OTHER) {
            setCustom(true);
            onChange('');
          } else {
            setCustom(false);
            onChange(v ?? '');
          }
        }}
      />
      {custom && (
        <TextInput
          placeholder="Type the reason"
          value={value}
          error={error}
          onChange={(e) => onChange(e.currentTarget.value)}
          data-autofocus
        />
      )}
    </Stack>
  );
}
