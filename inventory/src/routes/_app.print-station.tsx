import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge, Box, Button, Card, Group, Loader, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core'
import dayjs from 'dayjs'
import { ClipboardList, FileText, Printer, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { apiClient } from '@/lib/api/client'
import { openPrint } from '@/lib/print'
import { formatCurrency } from '@/lib/utils/format'

export const Route = createFileRoute('/_app/print-station')({ component: PrintStationPage })

interface Person { id: string; full_name: string; open_orders: number; open_bills: number; slips: number }
interface Detail {
  orders: { id: string; order_ref: string; table_number: string | null; customer_code: string; status: string; created_at: string; lines: number }[]
  bills: { id: string; bill_ref: string; customer_code: string; net_total: string; status: string; outlet: string; opened_at: string; table_number: string | null }[]
  slips: { id: string; slip_ref: string; created_at: string; order_ref: string; table_number: string | null; customer_code: string }[]
}

const NAVY = '#1F3A5F'
const LINE = '#E9ECEF'

/** One computer, one thermal printer: tap a name, print what is waiting. */
function PrintStationPage() {
  const [who, setWho] = useState<Person | null>(null)
  const people = useQuery({
    queryKey: ['print-station', 'people'],
    queryFn: async () => (await apiClient.get<{ data: Person[] }>('/print-station/waiters')).data.data,
    refetchInterval: 6000,
  })
  const detail = useQuery({
    queryKey: ['print-station', 'one', who?.id],
    enabled: !!who,
    queryFn: async () => (await apiClient.get<{ data: Detail }>(`/print-station/waiters/${who!.id}`)).data.data,
    refetchInterval: 6000,
  })
  const list = people.data ?? []
  const waiting = (p: Person) => p.open_orders + p.open_bills

  return (
    <>
      <PageHeader title="Print station" subtitle="Tap your name, then print your slips and bills" />
      {people.isLoading && <Loader m="md" />}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm" mb="lg">
        {list.map((p) => {
          const on = who?.id === p.id
          return (
            <UnstyledButton key={p.id} onClick={() => setWho(p)}>
              <Card withBorder radius="md" p="md" style={{ background: on ? NAVY : '#fff', borderColor: on ? NAVY : LINE, minHeight: 84 }}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Text fw={700} fz="lg" style={{ color: on ? '#fff' : NAVY, lineHeight: 1.2 }}>{p.full_name}</Text>
                  {waiting(p) > 0 && <Badge color="red" variant="filled" circle size="lg">{waiting(p)}</Badge>}
                </Group>
                <Text size="xs" mt={6} style={{ color: on ? '#CBD5E1' : '#868E96' }}>{p.open_orders} orders · {p.open_bills} open bills</Text>
              </Card>
            </UnstyledButton>
          )
        })}
      </SimpleGrid>

      {who && (
        <Stack gap="md">
          <Text fw={700} fz="xl" style={{ color: NAVY }}>{who.full_name}</Text>
          {detail.isLoading && <Loader />}
          <Section title="Orders" icon={<ClipboardList size={16} />} empty="No orders" count={detail.data?.orders.length ?? 0}>
            {(detail.data?.orders ?? []).map((o) => (
              <Row key={o.id} title={`Table ${o.table_number || '-'} · ${o.customer_code || o.order_ref}`}
                sub={`${o.order_ref} · ${o.lines} items · ${o.status.replace('_', ' ')} · ${dayjs(o.created_at).format('HH:mm')}`}
                dot={o.status === 'open' || o.status === 'in_progress' ? '#F59F00' : '#2F9E44'} onPrint={() => openPrint(`/order/${o.id}`, 'Order')} />
            ))}
          </Section>
          <Section title="Issue slips" icon={<FileText size={16} />} empty="No slips from the last 20 hours" count={detail.data?.slips.length ?? 0}>
            {(detail.data?.slips ?? []).map((s) => (
              <Row key={s.id} title={`Table ${s.table_number || '-'} · ${s.customer_code || s.order_ref}`} sub={`${s.slip_ref} · ${dayjs(s.created_at).format('HH:mm')}`}
                onPrint={() => openPrint(`/slip/${s.id}`, 'Issue slip')} />
            ))}
          </Section>
          <Section title="Bills" icon={<Receipt size={16} />} empty="No bills" count={detail.data?.bills.length ?? 0}>
            {(detail.data?.bills ?? []).map((b) => (
              <Row key={b.id} title={`${b.bill_ref} · ${formatCurrency(Number(b.net_total))}`}
                sub={`Table ${b.table_number || '-'} · ${b.customer_code || ''} · ${b.status} · ${dayjs(b.opened_at).format('HH:mm')}`}
                dot={b.status === 'open' ? '#E03131' : '#2F9E44'} onPrint={() => openPrint(`/bill/${b.id}`, 'Bill')} />
            ))}
          </Section>
        </Stack>
      )}
    </>
  )
}

function Section({ title, icon, count, empty, children }: { title: string; icon: React.ReactNode; count: number; empty: string; children: React.ReactNode }) {
  return (
    <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group gap={8} px="md" py="sm" style={{ background: '#F8F9FA', borderBottom: `1px solid ${LINE}` }}>
        {icon}<Text fw={600}>{title}</Text>
        {count > 0 && <Badge color="gray" variant="filled" circle>{count}</Badge>}
      </Group>
      {count === 0 ? <Text size="sm" c="dimmed" p="md">{empty}</Text> : <Box>{children}</Box>}
    </Card>
  )
}

function Row({ title, sub, dot, onPrint }: { title: string; sub: string; dot?: string; onPrint: () => void }) {
  return (
    <Group justify="space-between" wrap="nowrap" px="md" py="sm" style={{ borderBottom: `1px solid ${LINE}` }}>
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 4, background: dot, flexShrink: 0 }} />}
        <Box style={{ minWidth: 0 }}>
          <Text size="sm" fw={600} lineClamp={1}>{title}</Text>
          <Text size="xs" c="dimmed" lineClamp={1}>{sub}</Text>
        </Box>
      </Group>
      <Button size="sm" color="#0f766e" leftSection={<Printer size={15} />} onClick={onPrint}>Print</Button>
    </Group>
  )
}
