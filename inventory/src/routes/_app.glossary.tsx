import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Box, Card, Group, ScrollArea, SimpleGrid, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import glossary from '@/lib/glossary.json';

export const Route = createFileRoute('/_app/glossary')({
  component: GlossaryPage,
});

interface Term { t: string; m: string; w: string }
interface Section { title: string; terms: Term[] }
const DATA = glossary as Section[];

// One small dot colour per group
const DOTS = ['#1971C2', '#E8590C', '#2B8A3E', '#C92A2A', '#862E9C', '#0B7285', '#5F3DC4', '#E67700', '#495057', '#1F3A5F'];
const NAVY = '#1F3A5F';

function Pill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <UnstyledButton
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: '0 0 auto',
        padding: '7px 12px',
        borderRadius: 999,
        background: active ? NAVY : '#F1F3F5',
        color: active ? '#FFFFFF' : '#343A40',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <Box
        component="span"
        style={{
          marginLeft: 8,
          minWidth: 20,
          padding: '1px 6px',
          borderRadius: 10,
          background: active ? '#FFFFFF' : '#DEE2E6',
          color: active ? NAVY : '#495057',
          fontSize: 11,
          fontWeight: 700,
          display: 'inline-block',
          textAlign: 'center',
        }}
      >
        {count}
      </Box>
    </UnstyledButton>
  );
}

/** Plain-language meanings of the words used across the app. Open to everyone. */
function GlossaryPage() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>('all');
  const [open, setOpen] = useState<string | null>(null);
  const needle = q.trim().toLowerCase();

  // Every term with its group, filtered by the search first so the pill counts follow it
  const matched = useMemo(
    () =>
      DATA.flatMap((s, i) => s.terms.map((x) => ({ ...x, group: s.title, dot: DOTS[i % DOTS.length] }))).filter(
        (x) => !needle || `${x.t} ${x.m} ${x.w}`.toLowerCase().includes(needle),
      ),
    [needle],
  );
  const shown = group === 'all' ? matched : matched.filter((x) => x.group === group);

  return (
    <Stack gap="md">
      <PageHeader title="Glossary" subtitle="What the words and figures in this app mean, in plain language" />
      <TextInput
        placeholder="Search, for example: carried forward"
        leftSection={<Search size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        aria-label="Search the glossary"
      />

      <ScrollArea type="never" offsetScrollbars={false}>
        <Group gap={8} wrap="nowrap" pb={2}>
          <Pill label="All" count={matched.length} active={group === 'all'} onClick={() => setGroup('all')} />
          {DATA.map((s) => {
            const count = matched.filter((x) => x.group === s.title).length;
            if (!count) return null;
            return <Pill key={s.title} label={s.title} count={count} active={group === s.title} onClick={() => setGroup(s.title)} />;
          })}
        </Group>
      </ScrollArea>

      {!shown.length ? (
        <EmptyState title="No match" description="Try another word or pick All." />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {shown.map((x) => {
            const isOpen = open === x.t;
            return (
              <Card
                key={x.group + x.t}
                withBorder
                radius="md"
                p="sm"
                onClick={() => setOpen(isOpen ? null : x.t)}
                style={{ cursor: 'pointer', alignSelf: 'start' }}
              >
                <Group gap={8} wrap="nowrap" align="flex-start">
                  <Box mt={6} style={{ width: 8, height: 8, borderRadius: 4, background: x.dot, flex: '0 0 auto' }} />
                  <Box style={{ minWidth: 0 }}>
                    <Text fw={700} size="sm" style={{ color: NAVY }}>{x.t}</Text>
                    <Text size="sm" mt={2} lineClamp={isOpen ? undefined : 2} style={{ color: '#343A40' }}>{x.m}</Text>
                    {isOpen && x.w && <Text size="xs" mt={6} style={{ color: '#868E96' }}>Where: {x.w}</Text>}
                    {group === 'all' && <Text size="xs" mt={6} style={{ color: '#868E96' }}>{x.group}</Text>}
                  </Box>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
      <Text size="xs" c="dimmed">Tap a card to read the whole meaning.</Text>
    </Stack>
  );
}
