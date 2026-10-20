import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Badge, Box, Button, Group, Loader, Paper, ScrollArea, Stack, Switch, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { useMenuItems } from '@/hooks/useCore'
import { setMenuItemSoldOut } from '@/lib/api/menu'
import { getErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth/useAuth'
import { formatCurrency } from '@/lib/utils/format'

export const Route = createFileRoute('/_app/menu/sold-out')({ component: SoldOutPage })

const GREEN = '#0f766e'
const RED = '#C92A2A'
const LINE = '#E9ECEF'

function SoldOutPage() {
  const auth = useAuth()
  const qc = useQueryClient()
  const canSwitch = auth.hasPermission('menu.soldout')
  const wide = auth.hasRole('manager', 'supervisor', 'md', 'admin')
  // Bar staff see drinks only, the store sees food only; managers see both
  const only: 'bar' | 'kitchen' | null = wide ? null : auth.hasRole('bar_attendant') ? 'bar' : 'kitchen'
  const [q, setQ] = useState('')
  const [show, setShow] = useState<'all' | 'kitchen' | 'bar' | 'out'>('all')
  const items = useMenuItems(1, 500, undefined, { status: 'active' })
  const flip = useMutation({
    mutationFn: (v: { id: string; sold_out: boolean }) => setMenuItemSoldOut(v.id, v.sold_out),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
    onError: (e) => notifications.show({ color: 'red', title: 'Not changed', message: getErrorMessage(e) })
  })

  const all = (items.data?.data ?? []).filter((m) => !only || (only === 'bar' ? m.station === 'bar' : m.station !== 'bar'))
  const out = all.filter((m) => m.sold_out).length
  const multi = new Set(all.map((m) => m.property_id)).size > 1
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return all.filter((m) => {
      if (show === 'out' && !m.sold_out) return false
      if (show === 'bar' && m.station !== 'bar') return false
      if (show === 'kitchen' && m.station === 'bar') return false
      return !s || m.display_name.toLowerCase().includes(s)
    })
  }, [all, q, show])

  const pills: { v: typeof show; label: string; n?: number }[] = [
    { v: 'all', label: 'All' },
    ...(only ? [] : [{ v: 'kitchen' as const, label: 'Kitchen' }, { v: 'bar' as const, label: 'Bar' }]),
    { v: 'out', label: 'Sold out', n: out }
  ]

  return (
    <Stack gap="md" maw={760} mx="auto" pb="xl">
      <PageHeader title="Sold out" subtitle="Switch off what has run out. Waiters can not order it until it is back on." />
      <TextInput leftSection={<Search size={16} />} placeholder="Search the menu" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      <ScrollArea type="never">
        <Group gap={6} wrap="nowrap">
          {pills.map((p) => (
            <Button key={p.v} size="compact-md" radius="xl" color={GREEN} variant={show === p.v ? 'filled' : 'default'} onClick={() => setShow(p.v)} style={{ flexShrink: 0 }}
              rightSection={p.n ? <Badge size="xs" circle color={show === p.v ? 'white' : 'red'} c={show === p.v ? GREEN : undefined} variant={show === p.v ? 'filled' : 'light'}>{p.n}</Badge> : undefined}>
              {p.label}
            </Button>
          ))}
        </Group>
      </ScrollArea>
      {items.isLoading && <Loader size="sm" />}
      {!items.isLoading && shown.length === 0 && <EmptyState title="Nothing here" description={show === 'out' ? 'Everything is on sale.' : 'No dish matches.'} />}
      <Paper radius="md" style={{ background: '#fff', border: `1px solid ${LINE}`, overflow: 'hidden' }}>
        {shown.map((m, i) => (
          <Box key={m.id} px="md" py="sm" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>
            <Group justify="space-between" wrap="nowrap" gap="md">
              <Box style={{ minWidth: 0 }}>
                <Group gap={8} wrap="nowrap">
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: m.sold_out ? RED : GREEN, flexShrink: 0 }} />
                  <Text fw={500} size="sm" truncate>{m.display_name}</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  {formatCurrency(m.price)} · {m.station === 'bar' ? 'Bar' : 'Kitchen'}{multi && m.property ? ` · ${m.property.code}` : ''}
                </Text>
              </Box>
              <Switch size="md" color="red" disabled={!canSwitch || flip.isPending} checked={!!m.sold_out}
                onChange={(e) => flip.mutate({ id: m.id, sold_out: e.currentTarget.checked })}
                label={<Text size="xs" c="dimmed">{m.sold_out ? 'Sold out' : 'On sale'}</Text>} aria-label={`${m.display_name} sold out`} />
            </Group>
          </Box>
        ))}
      </Paper>
    </Stack>
  )
}
