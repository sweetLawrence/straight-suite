// import { useState } from 'react'
// import { Title, Text, Table, Badge, Button, Group, Stack, Select, ActionIcon, Card, Tabs } from '@mantine/core'
// import { Plus, Trash2, Mail, UserCheck, UserX } from 'lucide-react'
// import { notifications } from '@mantine/notifications'
// import { useAuthStore } from '../stores/authStore'
// import { useStaff, useUpdateStaff, useDeactivateStaff, usePendingApplicants, useInvitePendingApplicant, useRejectPendingApplicant } from '../features/staff/hooks'
// // import { PROPERTIES } from '../features/staff/PROPERTIES'
// import { PROPERTIES } from '../constants/properties'
// import CreateStaffModal from '../features/staff/CreateStaffModal'

// export default function StaffPage() {
//   const role = useAuthStore((s) => s.role)

//   if (role !== 'superadmin') {
//     return <Text c="dimmed">Only superadmin accounts can manage staff.</Text>
//   }

//   return (
//     <Stack gap="lg">
//       <div>
//         <Title order={2} className="text-primary-700">Staff Accounts</Title>
//         <Text size="sm" c="dimmed">Manage who has access, and review new applicants.</Text>
//       </div>
//       <Tabs defaultValue="active">
//         <Tabs.List>
//           <Tabs.Tab value="active">Active Accounts</Tabs.Tab>
//           <Tabs.Tab value="pending" leftSection={<Mail size={14} />}>Pending Applicants</Tabs.Tab>
//         </Tabs.List>
//         <Tabs.Panel value="active" pt="md"><ActiveStaffTab /></Tabs.Panel>
//         <Tabs.Panel value="pending" pt="md"><PendingApplicantsTab /></Tabs.Panel>
//       </Tabs>
//     </Stack>
//   )
// }

// function ActiveStaffTab() {
//   const { data: staff, isLoading } = useStaff()
//   const updateStaff = useUpdateStaff()
//   const deactivateStaff = useDeactivateStaff()
//   const [formOpen, setFormOpen] = useState(false)

//   const propertyName = (id: string | null) => PROPERTIES.find((p) => p.value === id)?.label ?? '-'

//   function handleDeactivate(id: string, name: string) {
//     if (!confirm(`Deactivate ${name}'s account?`)) return
//     deactivateStaff.mutate(id, {
//       onSuccess: () => notifications.show({ message: 'Account deactivated.', color: 'green' }),
//       onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//     })
//   }

//   function handleReactivate(id: string, name: string) {
//     if (!confirm(`Reactivate ${name}'s account?`)) return
//     updateStaff.mutate(
//       { id, input: { isActive: true } },
//       {
//         onSuccess: () => notifications.show({ message: 'Account reactivated.', color: 'green' }),
//         onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//       }
//     )
//   }

//   return (
//     <Stack>
//       <Group justify="flex-end">
//         <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setFormOpen(true)}>New Staff/Admin</Button>
//       </Group>
//       {isLoading ? (
//         <Text c="dimmed">Loading...</Text>
//       ) : !staff || staff.length === 0 ? (
//         <Text c="dimmed">No staff accounts yet.</Text>
//       ) : (
//         <Table striped highlightOnHover className="table-responsive">
//           <Table.Thead>
//             <Table.Tr>
//               <Table.Th>Name</Table.Th>
//               <Table.Th>Email</Table.Th>
//               <Table.Th>Role</Table.Th>
//               <Table.Th>Property</Table.Th>
//               <Table.Th>Status</Table.Th>
//               <Table.Th />
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             {staff.map((u) => (
//               <Table.Tr key={u.id}>
//                 <Table.Td>{u.firstName} {u.lastName}</Table.Td>
//                 <Table.Td>{u.email}</Table.Td>
//                 <Table.Td className="capitalize">{u.role}</Table.Td>
//                 <Table.Td>{propertyName(u.propertyId)}</Table.Td>
//                 <Table.Td><Badge color={u.isActive ? 'green' : 'gray'} variant="light">{u.isActive ? 'active' : 'inactive'}</Badge></Table.Td>
//                 <Table.Td>
//                   {u.isActive ? (
//                     <ActionIcon color="red" variant="light" onClick={() => handleDeactivate(u.id, `${u.firstName} ${u.lastName}`)}>
//                       <UserX size={15} />
//                     </ActionIcon>
//                   ) : (
//                     <ActionIcon color="green" variant="light" onClick={() => handleReactivate(u.id, `${u.firstName} ${u.lastName}`)}>
//                       <UserCheck size={15} />
//                     </ActionIcon>
//                   )}
//                 </Table.Td>
//               </Table.Tr>
//             ))}
//           </Table.Tbody>
//         </Table>
//       )}
//       <CreateStaffModal opened={formOpen} onClose={() => setFormOpen(false)} />
//     </Stack>
//   )
// }



// function PendingApplicantsTab() {
//   const { data: applicants, isLoading } = usePendingApplicants()
//   const invite = useInvitePendingApplicant()
//   const reject = useRejectPendingApplicant()
//   const [assignments, setAssignments] = useState<Record<string, { propertyId: string; role: 'staff' | 'admin' }>>({})

//   function setAssignment(id: string, field: 'propertyId' | 'role', value: string) {
//     setAssignments((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } as any }))
//   }

//   function handleInvite(id: string) {
//     const assignment = assignments[id]
//     if (!assignment?.propertyId) {
//       notifications.show({ message: 'Pick a property before inviting.', color: 'red' })
//       return
//     }
//     invite.mutate(
//       { id, propertyId: assignment.propertyId, role: assignment.role ?? 'admin' },
//       {
//         onSuccess: () => notifications.show({ message: 'Invite sent.', color: 'green' }),
//         onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
//       }
//     )
//   }

//   function handleReject(id: string) {
//     if (!confirm('Discard this application?')) return
//     reject.mutate(id, { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) })
//   }

//   if (isLoading) return <Text c="dimmed">Loading...</Text>
//   if (!applicants || applicants.length === 0) return <Text c="dimmed">No pending applicants right now.</Text>

//   return (
//     <Stack gap="sm">
//       {applicants.map((a) => (
//         <Card key={a.id} withBorder radius="md" padding="sm">
//           <Group justify="space-between" align="flex-end" wrap="wrap">
//             <div>
//               <Text fw={600}>{a.firstName} {a.lastName}</Text>
//               <Text size="sm" c="dimmed">{a.email}{a.phone ? ` · ${a.phone}` : ''}</Text>
//             </div>
//             <Group gap="xs">
//               <Select
//                 placeholder="Role"
//                 data={['staff', 'admin']}
//                 value={assignments[a.id]?.role ?? 'admin'}
//                 onChange={(v) => v && setAssignment(a.id, 'role', v)}
//                 w={110}
//                 size="sm"
//               />
//               <Select
//                 placeholder="Assign property"
//                 data={PROPERTIES}
//                 value={assignments[a.id]?.propertyId ?? ''}
//                 onChange={(v) => v && setAssignment(a.id, 'propertyId', v)}
//                 w={190}
//                 size="sm"
//               />
//               <Button size="xs" color="green" leftSection={<UserCheck size={14} />} loading={invite.isPending} onClick={() => handleInvite(a.id)}>
//                 Invite
//               </Button>
//               <ActionIcon color="red" variant="light" onClick={() => handleReject(a.id)}>
//                 <Trash2 size={15} />
//               </ActionIcon>
//             </Group>
//           </Group>
//         </Card>
//       ))}
//     </Stack>
//   )
// }




















import { useState } from 'react'
import { Title, Text, Table, Badge, Button, Group, Stack, Select, ActionIcon, Card, Tabs } from '@mantine/core'
import { Plus, Trash2, Mail, UserCheck, UserX } from 'lucide-react'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../stores/authStore'
import { useStaff, useUpdateStaff, useDeactivateStaff, usePendingApplicants, useInvitePendingApplicant, useRejectPendingApplicant } from '../features/staff/hooks'
import { PROPERTIES } from '../constants/properties'
import CreateStaffModal from '../features/staff/CreateStaffModal'

export default function StaffPage() {
  const role = useAuthStore((s) => s.role)

  if (role !== 'superadmin') {
    return <Text c="dimmed">Only superadmin accounts can manage staff.</Text>
  }

  return (
    <Stack gap="lg">
      <div>
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50">
          Access
        </span>
        <Title order={2} className="font-serif text-primary-700 mt-1">Staff accounts</Title>
        <Text size="sm" c="dimmed" mt={2}>
          Manage who has access, and review new applicants.
        </Text>
      </div>

      <Tabs defaultValue="active" variant="outline" radius="sm">
        <Tabs.List>
          <Tabs.Tab value="active">Active accounts</Tabs.Tab>
          <Tabs.Tab value="pending" leftSection={<Mail size={14} />}>Pending applicants</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="active" pt="md"><ActiveStaffTab /></Tabs.Panel>
        <Tabs.Panel value="pending" pt="md"><PendingApplicantsTab /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

function ActiveStaffTab() {
  const { data: staff, isLoading } = useStaff()
  const updateStaff = useUpdateStaff()
  const deactivateStaff = useDeactivateStaff()
  const [formOpen, setFormOpen] = useState(false)

  const propertyName = (id: string | null) => PROPERTIES.find((p) => p.value === id)?.label ?? '-'

  function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate ${name}'s account?`)) return
    deactivateStaff.mutate(id, {
      onSuccess: () => notifications.show({ message: 'Account deactivated.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  function handleReactivate(id: string, name: string) {
    if (!confirm(`Reactivate ${name}'s account?`)) return
    updateStaff.mutate(
      { id, input: { isActive: true } },
      {
        onSuccess: () => notifications.show({ message: 'Account reactivated.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button leftSection={<Plus size={16} />} color="accent" onClick={() => setFormOpen(true)}>
          New staff / admin
        </Button>
      </Group>

      <Card withBorder radius="md" p={0} className="overflow-hidden">
        {isLoading ? (
          <Text c="dimmed" p="md">Loading...</Text>
        ) : !staff || staff.length === 0 ? (
          <Text c="dimmed" p="md">No staff accounts yet.</Text>
        ) : (
          <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover className="table-responsive">
            <Table.Thead className="bg-surface-50">
              <Table.Tr>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Name</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Email</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Role</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Property</Table.Th>
                <Table.Th className="font-mono text-[11px] tracking-wider uppercase text-surface-500">Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {staff.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{u.firstName} {u.lastName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{u.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" className="capitalize">{u.role}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{propertyName(u.propertyId)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={u.isActive ? 'green' : 'gray'} variant="light" radius="sm">
                      {u.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {u.isActive ? (
                      <ActionIcon color="red" variant="light" radius="sm" onClick={() => handleDeactivate(u.id, `${u.firstName} ${u.lastName}`)}>
                        <UserX size={15} />
                      </ActionIcon>
                    ) : (
                      <ActionIcon color="green" variant="light" radius="sm" onClick={() => handleReactivate(u.id, `${u.firstName} ${u.lastName}`)}>
                        <UserCheck size={15} />
                      </ActionIcon>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <CreateStaffModal opened={formOpen} onClose={() => setFormOpen(false)} />
    </Stack>
  )
}

function PendingApplicantsTab() {
  const { data: applicants, isLoading } = usePendingApplicants()
  const invite = useInvitePendingApplicant()
  const reject = useRejectPendingApplicant()
  const [assignments, setAssignments] = useState<Record<string, { propertyId: string; role: 'staff' | 'admin' }>>({})

  function setAssignment(id: string, field: 'propertyId' | 'role', value: string) {
    setAssignments((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } as any }))
  }

  function handleInvite(id: string) {
    const assignment = assignments[id]
    if (!assignment?.propertyId) {
      notifications.show({ message: 'Pick a property before inviting.', color: 'red' })
      return
    }
    invite.mutate(
      { id, propertyId: assignment.propertyId, role: assignment.role ?? 'admin' },
      {
        onSuccess: () => notifications.show({ message: 'Invite sent.', color: 'green' }),
        onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
      }
    )
  }

  function handleReject(id: string) {
    if (!confirm('Discard this application?')) return
    reject.mutate(id, { onError: (err: any) => notifications.show({ message: err.message, color: 'red' }) })
  }

  if (isLoading) return <Text c="dimmed">Loading...</Text>
  if (!applicants || applicants.length === 0) {
    return (
      <Card withBorder radius="md" p="xl">
        <Text c="dimmed" ta="center" size="sm">No pending applicants right now.</Text>
      </Card>
    )
  }

  return (
    <Stack gap="sm">
      {applicants.map((a) => (
        <Card key={a.id} withBorder radius="md" p="md" className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: '#C9A227' }} />
          <Stack gap="sm">
            <div>
              <Text fw={600} size="sm">{a.firstName} {a.lastName}</Text>
              <Text size="xs" c="dimmed">{a.email}{a.phone ? ` · ${a.phone}` : ''}</Text>
            </div>

            <Group gap="xs" wrap="wrap" align="flex-end">
              <Select
                label="Role"
                data={['staff', 'admin']}
                value={assignments[a.id]?.role ?? 'admin'}
                onChange={(v) => v && setAssignment(a.id, 'role', v)}
                w={130}
                size="sm"
                radius="sm"
              />
              <Select
                label="Property"
                placeholder="Assign property"
                data={PROPERTIES}
                value={assignments[a.id]?.propertyId ?? ''}
                onChange={(v) => v && setAssignment(a.id, 'propertyId', v)}
                w={200}
                size="sm"
                radius="sm"
              />
              <Button
                size="sm"
                color="green"
                leftSection={<UserCheck size={14} />}
                loading={invite.isPending}
                onClick={() => handleInvite(a.id)}
              >
                Invite
              </Button>
              <ActionIcon color="red" variant="light" radius="sm" size="lg" onClick={() => handleReject(a.id)}>
                <Trash2 size={15} />
              </ActionIcon>
            </Group>
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}