import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Badge, Box, Button, Group, Loader, Modal, NumberInput, Paper, Select, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ArrowLeftRight, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { useStockItems, useUpdateStockItem } from '@/hooks/useStock'
import { getErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth/useAuth'
import type { StockItem } from '@/lib/api/stock'

export const Route = createFileRoute('/_app/stock/portion-rules')({ component: PortionRulesPage })

const GREEN = '#0f766e'
const LINE = '#E9ECEF'
const SOFT = '#F8F9FA'
const r1 = (n: number) => Math.round(n * 100) / 100
const name = (s: StockItem) => s.item?.name || s.item?.code || 'Item'

/** kg to portions and back, for one item */
function Converter({ rules }: { rules: StockItem[] }) {
  const [id, setId] = useState<string | null>(null)
  const [units, setUnits] = useState<number | string>('')
  const [ports, setPorts] = useState<number | string>('')
  const s = rules.find((r) => r.id === (id ?? rules[0]?.id))
  const per = s?.pack_size ?? 0
  const label = s?.pack_label || 'unit'
  if (!s) return null
  return (
    <Paper radius="md" p="md" style={{ background: SOFT }}>
      <Group gap={8} mb="sm"><ArrowLeftRight size={16} color={GREEN} /><Text fw={600}>Converter</Text></Group>
      <Select data={rules.map((r) => ({ value: r.id, label: `${name(r)}${r.property ? ` · ${r.property.code}` : ''}` }))} value={s.id}
        onChange={(v) => { setId(v); setUnits(''); setPorts('') }} allowDeselect={false} searchable mb="sm" />
      <Group grow align="flex-end" wrap="wrap">
        <NumberInput label={`${label.charAt(0).toUpperCase() + label.slice(1)}s`} min={0} decimalScale={2} value={units}
          onChange={(v) => { setUnits(v); setPorts(v === '' ? '' : r1(Number(v) * per)) }} />
        <NumberInput label="Portions" min={0} decimalScale={2} value={ports}
          onChange={(v) => { setPorts(v); setUnits(v === '' || !per ? '' : r1(Number(v) / per)) }} />
      </Group>
      <Text size="xs" c="dimmed" mt="xs">1 {label} = {per} portions</Text>
    </Paper>
  )
}

function RuleRow({ s, canEdit }: { s: StockItem; canEdit: boolean }) {
  const upd = useUpdateStockItem()
  const [per, setPer] = useState<number | string>(s.pack_size ?? '')
  const [label, setLabel] = useState(s.pack_label ?? '')
  const dirty = Number(per) !== (s.pack_size ?? 0) || label.trim() !== (s.pack_label ?? '')
  const save = async () => {
    try {
      await upd.mutateAsync({ id: s.id, data: { pack_size: Math.round(Number(per)), pack_label: label.trim() } })
      notifications.show({ color: 'green', title: 'Saved', message: `${name(s)}: 1 ${label.trim()} = ${per} portions` })
    } catch (e) {
      notifications.show({ color: 'red', title: 'Not saved', message: getErrorMessage(e) })
    }
  }
  return (
    <Box px="md" py="sm">
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>{name(s)}</Text>
          {s.property && <Badge size="xs" variant="outline" color="gray">{s.property.code}</Badge>}
        </Group>
        <Text size="xs" c="dimmed">counted in {s.item?.base_unit?.name?.toLowerCase() ?? 'units'}s</Text>
      </Group>
      <Group gap="xs" align="flex-end" wrap="wrap">
        <Text size="sm" pb={8}>1</Text>
        <TextInput w={90} aria-label="What you receive" value={label} onChange={(e) => setLabel(e.currentTarget.value)} disabled={!canEdit} />
        <Text size="sm" pb={8}>=</Text>
        <NumberInput w={90} min={1} allowDecimal={false} aria-label="Portions" value={per} onChange={setPer} disabled={!canEdit} />
        <Text size="sm" pb={8}>portions</Text>
        {dirty && canEdit && <Button color={GREEN} size="sm" loading={upd.isPending} disabled={!(Number(per) >= 1) || !label.trim()} onClick={save}>Save</Button>}
      </Group>
    </Box>
  )
}

function PortionRulesPage() {
  const auth = useAuth()
  const canEdit = auth.hasPermission('stock.item.manage')
  const items = useStockItems({ limit: 500, status: 'active' })
  const upd = useUpdateStockItem()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const [label, setLabel] = useState('kg')
  const [per, setPer] = useState<number | string>(1)

  const food = (items.data?.data ?? []).filter((s) => s.store_type !== 'bar_store')
  const rules = food.filter((s) => s.pack_size)
  const without = food.filter((s) => !s.pack_size)
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return rules.filter((s) => !t || name(s).toLowerCase().includes(t))
  }, [rules, q])

  const add = async () => {
    if (!pick) return
    try {
      await upd.mutateAsync({ id: pick, data: { pack_size: Math.round(Number(per)), pack_label: label.trim() } })
      setAdding(false); setPick(null)
    } catch (e) {
      notifications.show({ color: 'red', title: 'Not saved', message: getErrorMessage(e) })
    }
  }

  return (
    <Stack gap="md" maw={760} mx="auto" pb="xl">
      <PageHeader title="Portion rules" subtitle="How many portions come from what you receive. Change a number any time." />
      {items.isLoading && <Loader size="sm" />}
      {rules.length > 0 && <Converter rules={rules} />}
      <Group gap="xs" wrap="nowrap">
        <TextInput style={{ flex: 1 }} leftSection={<Search size={16} />} placeholder="Search items" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
        {canEdit && <Button variant="light" color={GREEN} leftSection={<Plus size={16} />} onClick={() => setAdding(true)}>Add</Button>}
      </Group>
      {!items.isLoading && shown.length === 0 && <EmptyState title="No rules yet" description="Add one for beef, rice and the others you count in portions." />}
      <Paper radius="md" style={{ background: '#fff', border: `1px solid ${LINE}`, overflow: 'hidden' }}>
        {shown.map((s, i) => (
          <Box key={s.id} style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}><RuleRow s={s} canEdit={canEdit} /></Box>
        ))}
      </Paper>
      <Text size="xs" c="dimmed">Deliveries use these rules: receive 12 kg of beef and the store records the portions for you. Items counted in kilograms or packets keep working as before.</Text>

      <Modal opened={adding} onClose={() => setAdding(false)} title="Add a portion rule" centered>
        <Stack>
          <Select label="Item" searchable placeholder="Pick an item" value={pick} onChange={setPick}
            data={without.map((s) => ({ value: s.id, label: `${name(s)}${s.property ? ` · ${s.property.code}` : ''}` }))} />
          <Group grow>
            <TextInput label="You receive in" value={label} onChange={(e) => setLabel(e.currentTarget.value)} placeholder="kg, bird, packet" />
            <NumberInput label="Portions each" min={1} allowDecimal={false} value={per} onChange={setPer} />
          </Group>
          <Text size="xs" c="dimmed">Beef: kg, 2. Kienyeji: bird, 2.</Text>
          <Button color={GREEN} fullWidth disabled={!pick || !label.trim() || !(Number(per) >= 1)} loading={upd.isPending} onClick={add}>Save rule</Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
