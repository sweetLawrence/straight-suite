import { Select } from '@mantine/core';
import { Building2 } from 'lucide-react';
import { useProperties } from '@/hooks/useCore';
import { getActing, setActing } from '@/lib/auth/acting';
import { useAuth } from '@/lib/auth/useAuth';

/** Administrator only: work at one property as its staff would (orders, income, cash, stock), or look at both. */
export function ActingProperty() {
  const auth = useAuth();
  const properties = useProperties(1, 20);
  if (!auth.hasRole('admin')) return null;

  const data = [{ value: 'all', label: 'Both properties' }, ...(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))];
  return (
    <Select
      size="xs"
      w={{ base: 130, sm: 190 }}
      leftSection={<Building2 size={14} />}
      aria-label="Working at"
      allowDeselect={false}
      data={data}
      value={getActing() ?? 'all'}
      onChange={(v) => {
        setActing(v && v !== 'all' ? v : null);
        window.location.reload();
      }}
    />
  );
}
