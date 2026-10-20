import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, Group, Loader, Stack, Text } from '@mantine/core'
import { CircleAlert, CircleCheck, Download, Info, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { apiClient } from '@/lib/api/client'

export const Route = createFileRoute('/_app/setup-check')({ component: SetupCheckPage })

interface Section { key: string; title: string; severity: 'error' | 'warn' | 'info'; effect: string; count: number; rows: { code: string; name: string; property: string; dishes?: number; stock_model?: string }[] }
interface Result { ok: boolean; errors: number; warnings: number; sections: Section[] }

// Where each problem is fixed
const FIX: Record<string, { to: string; label: string }> = {
  no_recipe: { to: '/menu', label: 'Open menu (recipes)' },
  no_portion_rule: { to: '/stock/portion-rules', label: 'Open portion rules' },
  no_production_recipe: { to: '/production', label: 'Open production' },
  no_stock: { to: '/stock/batches', label: 'Receive stock' },
  no_price: { to: '/menu', label: 'Open menu' },
  bulk_dishes: { to: '/stock/bulk-issues', label: 'Open bulk issues' },
}

// The files that must be loaded, in order, and what each one unlocks
const FILES = [
  ['1. Setup.xlsx: Items', 'Every stock item and menu item. Without it nothing else can reference a code.'],
  ['1. Setup.xlsx: StockItems', 'Which property stocks what, and how (portioned, bulk, packaged, produced). Missing: item cannot be received or counted.'],
  ['1. Setup.xlsx: MenuItems', 'What the waiter can sell and at what price.'],
  ['1. Setup.xlsx: Recipes', 'What a dish takes from stock. Missing: dispatch does not change the stock sheet.'],
  ['1. Setup.xlsx: ProductionRecipes', 'Flour etc per chapati, donut, mandazi. Missing: "No production recipe defined".'],
  ['1. Setup.xlsx: PortionDefinitions', 'Portions per kg or bird. Missing: kg ordering and transfers fall back to raw portions.'],
  ['2. Operations.xlsx: Batches', 'Opening stock in each store (food, bar, supporting items like oil and tomatoes). Missing: "Insufficient stock".'],
  ['2. Operations.xlsx: StandingMenu', 'Staff meal plan per day (optional).'],
]

async function downloadOpeningStock() {
  const res = await apiClient.get('/setup-check/opening-stock.xlsx', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'opening-stock.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

const COLOR = { error: '#C92A2A', warn: '#E8590C', info: '#868E96' } as const

function SetupCheckPage() {
  const q = useQuery({
    queryKey: ['setup-check'],
    queryFn: async () => (await apiClient.get<{ data: Result }>('/setup-check')).data.data,
    refetchInterval: 30000,
  })
  if (q.isLoading) return <Loader m="xl" />
  const d = q.data
  return (
    <>
      <PageHeader title="Setup check" subtitle="What will fail, or silently do nothing, because something is not set up yet" />
      {d && (
        <Group gap="sm" mb="md">
          {d.ok
            ? <Group gap={6}><CircleCheck size={18} color="#2B8A3E" /><Text fw={600} c="#2B8A3E">Everything needed is set up</Text></Group>
            : <>
                <Badge color="red" variant="light" size="lg">{d.errors} will fail</Badge>
                <Badge color="orange" variant="light" size="lg">{d.warnings} to look at</Badge>
              </>}
        </Group>
      )}
      <Stack gap="md">
        {(d?.sections ?? []).filter((s) => s.count > 0).map((s) => (
          <Card key={s.key} withBorder radius="md" padding="md">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Group gap={8} wrap="nowrap" align="flex-start">
                {s.severity === 'error' ? <CircleAlert size={18} color={COLOR.error} style={{ marginTop: 2 }} /> : s.severity === 'warn' ? <TriangleAlert size={18} color={COLOR.warn} style={{ marginTop: 2 }} /> : <Info size={18} color={COLOR.info} style={{ marginTop: 2 }} />}
                <div>
                  <Text fw={600}>{s.title}</Text>
                  <Text size="sm" c="dimmed">{s.effect}</Text>
                </div>
              </Group>
              <Badge color={s.severity === 'error' ? 'red' : s.severity === 'warn' ? 'orange' : 'gray'} variant="filled" circle size="lg">{s.count}</Badge>
            </Group>
            <Stack gap={2} mt="sm">
              {s.rows.slice(0, 40).map((r, i) => (
                <Group key={i} justify="space-between" wrap="nowrap">
                  <Text size="sm" lineClamp={1}>{r.name} <Text span size="xs" c="dimmed">{r.code} · {r.property}</Text></Text>
                  {r.dishes ? <Text size="xs" c="dimmed">{r.dishes} dishes use it</Text> : null}
                </Group>
              ))}
              {s.rows.length > 40 && <Text size="xs" c="dimmed">and {s.rows.length - 40} more</Text>}
            </Stack>
            {s.key === 'no_stock' && (
              <Button mt="sm" size="xs" variant="light" leftSection={<Download size={14} />} onClick={downloadOpeningStock}>
                Download opening-stock sheet (fill and import)
              </Button>
            )}
            <Text size="sm" mt="sm" component={Link} to={FIX[s.key].to} style={{ color: '#1864AB', fontWeight: 600 }}>{FIX[s.key].label}</Text>
          </Card>
        ))}
        <Card withBorder radius="md" padding="md">
          <Text fw={600} mb={6}>Files that must be loaded (Admin, Bulk Import)</Text>
          <Stack gap={6}>
            {FILES.map(([n, why]) => (
              <div key={n}><Text size="sm" fw={600}>{n}</Text><Text size="xs" c="dimmed">{why}</Text></div>
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
