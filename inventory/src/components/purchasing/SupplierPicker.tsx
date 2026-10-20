import { useState } from 'react';
import { Select, type SelectProps } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuickSupplier, useSuppliers } from '@/hooks/usePurchasing';
import { getErrorMessage } from '@/lib/api/client';

const NEW = '__new__';

type Props = Omit<SelectProps, 'data' | 'value' | 'onChange'> & {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Let the person type a supplier that is not in the list yet (default on) */
  allowNew?: boolean;
};

/**
 * Pick a supplier, or type a new one and add it on the spot. The list is only a
 * convenience: someone cheaper tomorrow is one tap away.
 */
export function SupplierPicker({ value, onChange, allowNew = true, label = 'Supplier', ...rest }: Props) {
  const suppliers = useSuppliers();
  const quick = useQuickSupplier();
  const [search, setSearch] = useState('');

  const active = (suppliers.data ?? []).filter((s) => s.status === 'active' || s.id === value);
  const data = active.map((s) => ({ value: s.id, label: s.name }));
  const typed = search.replace(/\s+/g, ' ').trim();
  const exists = data.some((d) => d.label.toLowerCase() === typed.toLowerCase());
  if (allowNew && typed.length >= 2 && !exists) data.push({ value: NEW, label: `+ Add "${typed}" as a new supplier` });

  const pick = async (v: string | null) => {
    if (v !== NEW) return onChange(v);
    try {
      const s = await quick.mutateAsync(typed);
      onChange(s.id);
      setSearch('');
      notifications.show({ color: 'green', title: s.existed ? 'Already on your list' : 'Supplier added', message: s.name });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not add supplier', message: getErrorMessage(err) });
    }
  };

  return (
    <Select
      {...rest}
      label={label}
      searchable
      clearable
      data={data}
      value={value}
      onChange={pick}
      searchValue={search}
      onSearchChange={setSearch}
      placeholder={rest.placeholder ?? (allowNew ? 'Pick one, or type a new name' : 'Pick a supplier')}
      nothingFoundMessage={allowNew ? 'Type the name to add it' : 'No supplier with that name'}
    />
  );
}
