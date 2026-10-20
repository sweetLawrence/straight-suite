import { useState } from 'react'
import { Title, Text, Tabs, Table, Badge, Button, Group, Stack, ActionIcon, Card } from '@mantine/core'
import { Plus, Star, Trash2, Percent, Tag } from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useRatePlans, useUpdateRatePlan, useDeleteRatePlan } from '../features/ratePlans/hooks'
import { usePolicies, useSetDefaultPolicy, useDeletePolicy } from '../features/policies/hooks'
import { useRoomTypes } from '../features/roomTypes/hooks'
import RatePlanFormModal from '../features/ratePlans/RatePlanFormModal'
import PolicyFormModal from '../features/policies/PolicyFormModal'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatNumber(n: number) {
  return n.toLocaleString('en-KE')
}

export default function PricingPage() {
  const { data: ratePlans, isLoading: loadingPlans } = useRatePlans()
  const { data: roomTypes } = useRoomTypes()
  const { data: policies, isLoading: loadingPolicies } = usePolicies()
  const updateRatePlan = useUpdateRatePlan()
  const deleteRatePlan = useDeleteRatePlan()
  const setDefaultPolicy = useSetDefaultPolicy()
  const deletePolicy = useDeletePolicy()

  const [ratePlanModalOpen, setRatePlanModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.name ?? '-'

  function toggleRatePlan(id: string, currentlyActive: boolean) {
    updateRatePlan.mutate(
      { id, input: { isActive: !currentlyActive } },
      { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) }
    )
  }

  function removeRatePlan(id: string) {
    if (!confirm('Delete this rate plan?')) return
    deleteRatePlan.mutate(id, { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) })
  }

  function makeDefault(id: string) {
    setDefaultPolicy.mutate(id, {
      onSuccess: () => notifications.show({ message: 'Default policy updated.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  function removePolicy(id: string) {
    if (!confirm('Delete this policy?')) return
    deletePolicy.mutate(id, { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) })
  }

  return (
    <Stack gap="lg">
      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
          Rates & policies
        </span>
        <Title order={2} className="font-serif text-primary-700 mt-1">Pricing</Title>
        <Text size="sm" c="dimmed" mt={2}>
          Rate plans and cancellation policies for this property.
        </Text>
      </div>

      <Tabs defaultValue="ratePlans" variant="outline" radius="sm">
        <Tabs.List>
          <Tabs.Tab value="ratePlans" leftSection={<Tag size={14} />}>Rate plans</Tabs.Tab>
          <Tabs.Tab value="policies" leftSection={<Percent size={14} />}>Cancellation policies</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="ratePlans" pt="md">
          <Stack gap="md">
            <Group justify="flex-end">
              <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setRatePlanModalOpen(true)}>
                New rate plan
              </Button>
            </Group>

            <Card withBorder radius="md" p={0} className="overflow-hidden">
              {loadingPlans ? (
                <Text c="dimmed" p="md">Loading...</Text>
              ) : !ratePlans || ratePlans.length === 0 ? (
                <Text c="dimmed" p="md">No rate plans yet.</Text>
              ) : (
                <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover className="table-responsive">
                  <Table.Thead className="bg-surface-50">
                    <Table.Tr>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Name</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Room type</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Price</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Valid</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Status</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ratePlans.map((rp) => (
                      <Table.Tr key={rp.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{rp.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{roomTypeName(rp.roomTypeId)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatNumber(rp.priceOverride)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(rp.validFrom)}</Text>
                          <Text size="xs" c="dimmed">to {formatDate(rp.validTo)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={rp.isActive ? 'green' : 'gray'} variant="light" radius="sm">
                            {rp.isActive ? 'active' : 'inactive'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button size="xs" variant="light" color="primary" onClick={() => toggleRatePlan(rp.id, rp.isActive)}>
                              {rp.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <ActionIcon color="red" variant="light" radius="sm" onClick={() => removeRatePlan(rp.id)}>
                              <Trash2 size={15} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="policies" pt="md">
          <Stack gap="md">
            <Group justify="flex-end">
              <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setPolicyModalOpen(true)}>
                New policy
              </Button>
            </Group>

            <Card withBorder radius="md" p={0} className="overflow-hidden">
              {loadingPolicies ? (
                <Text c="dimmed" p="md">Loading...</Text>
              ) : !policies || policies.length === 0 ? (
                <Text c="dimmed" p="md">No cancellation policies yet.</Text>
              ) : (
                <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover className="table-responsive">
                  <Table.Thead className="bg-surface-50">
                    <Table.Tr>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Name</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Deposit</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Tiers</Table.Th>
                      <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Default</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {policies.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{p.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.depositPct}%</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} wrap="wrap">
                            {p.tiers.map((t, i) => (
                              <Badge key={i} size="xs" variant="light" color="gray" radius="sm">
                                {t.days_before != null ? `${t.days_before}d` : `${t.hours_before}h`} → {t.refund_pct}%
                              </Badge>
                            ))}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {p.isDefault && (
                            <Badge color="accent" radius="sm">Default</Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {!p.isDefault && (
                              <ActionIcon color="accent" variant="light" radius="sm" onClick={() => makeDefault(p.id)} title="Set as default">
                                <Star size={15} />
                              </ActionIcon>
                            )}
                            <ActionIcon
                              color="red" variant="light" radius="sm"
                              disabled={p.isDefault}
                              title={p.isDefault ? "Can't delete the default policy" : 'Delete'}
                              onClick={() => removePolicy(p.id)}
                            >
                              <Trash2 size={15} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <RatePlanFormModal opened={ratePlanModalOpen} onClose={() => setRatePlanModalOpen(false)} />
      <PolicyFormModal opened={policyModalOpen} onClose={() => setPolicyModalOpen(false)} />
    </Stack>
  )
}