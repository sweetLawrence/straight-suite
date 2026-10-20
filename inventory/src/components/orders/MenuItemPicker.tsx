import { useMemo, useState } from 'react';
import { Box, Button, CloseButton, Group, Input, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export interface PickerItem {
  id: string;
  display_name: string;
  price: number | string;
  sold_out?: boolean;
}

const C = { ink: '#212529', muted: '#868E96', line: '#F1F3F5', sel: '#E6FCF5', selLine: '#12B886' };

/**
 * Menu item picker for phones and desktop alike: a search box with the matching
 * items listed right under it, inside the page or sheet. No floating dropdown, so
 * nothing can jump or flicker when the phone keyboard opens.
 */
export function MenuItemPicker({
  items,
  value,
  onChange,
  error,
  label = 'Menu Item',
  loading,
}: {
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  error?: React.ReactNode;
  label?: string;
  loading?: boolean;
}) {
  const [q, setQ] = useState('');
  const selected = items.find((i) => i.id === value);

  const matches = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = words.length ? items.filter((i) => words.every((w) => i.display_name.toLowerCase().includes(w))) : items;
    return list.slice(0, 60);
  }, [items, q]);

  // Chosen: show it as one row with a Change button
  if (selected) {
    return (
      <Input.Wrapper label={label} required error={error}>
        <Group
          justify="space-between"
          wrap="nowrap"
          mt={4}
          px="sm"
          py={10}
          style={{ border: `1px solid ${C.selLine}`, background: C.sel, borderRadius: 8 }}
        >
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={600} style={{ color: C.ink }}>
              {selected.display_name}
            </Text>
            <Text size="xs" style={{ color: C.muted }}>
              {formatCurrency(selected.price)}
            </Text>
          </Box>
          <Button size="xs" variant="subtle" style={{ flexShrink: 0 }} onClick={() => onChange('')}>
            Change
          </Button>
        </Group>
      </Input.Wrapper>
    );
  }

  return (
    <Input.Wrapper label={label} required error={error}>
      <Stack gap={6} mt={4}>
        <TextInput
          placeholder="Search item, e.g. beef, soda"
          leftSection={<Search size={16} />}
          rightSection={q ? <CloseButton size="sm" aria-label="Clear" onClick={() => setQ('')} /> : null}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
        <Box
          style={{
            maxHeight: 'min(40dvh, 320px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            border: `1px solid #DEE2E6`,
            borderRadius: 8,
          }}
        >
          {loading ? (
            <Text size="sm" c="dimmed" p="sm">
              Loading menu…
            </Text>
          ) : matches.length === 0 ? (
            <Text size="sm" c="dimmed" p="sm">
              Nothing matches "{q}"
            </Text>
          ) : (
            matches.map((m, i) => (
              <UnstyledButton
                key={m.id}
                onClick={() => {
                  if (m.sold_out) return;
                  onChange(m.id);
                  setQ('');
                }}
                aria-disabled={m.sold_out}
                w="100%"
                px="sm"
                py={10}
                style={{ borderTop: i ? `1px solid ${C.line}` : undefined, opacity: m.sold_out ? 0.55 : 1, cursor: m.sold_out ? 'not-allowed' : undefined }}
              >
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Text size="sm" style={{ color: C.ink, minWidth: 0 }}>
                    {m.display_name}
                  </Text>
                  {m.sold_out ? (
                    <Text size="xs" fw={700} style={{ whiteSpace: 'nowrap', color: '#C92A2A' }}>SOLD OUT</Text>
                  ) : (
                    <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap', color: C.ink }}>
                      {formatCurrency(m.price)}
                    </Text>
                  )}
                </Group>
              </UnstyledButton>
            ))
          )}
        </Box>
      </Stack>
    </Input.Wrapper>
  );
}
