import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Alert, Badge, Box, Button, Group, Loader, Modal, Paper, ScrollArea, SegmentedControl, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { getErrorMessage } from '@/lib/api/client'
import { useAuth } from '@/lib/auth/useAuth'
import { createRole, deleteRole, getAccess, getPeople, getPerson, resetRole, saveRole, savePerson } from '@/lib/api/access'
import type { AccessOverview } from '@/lib/api/access'

export const Route = createFileRoute('/_app/admin/access')({ component: AccessPage })

const GREEN = '#0f766e'
const ORANGE = '#D9480F'
const LINE = '#E9ECEF'
const SOFT = '#F8F9FA'
const group = (code: string) => code.split('.')[0].replace(/_/g, ' ')
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Perm = AccessOverview['permissions'][number]

/** A row of pill buttons that scrolls sideways on a phone */
function Pills({ items, value, onChange }: { items: { value: string; label: string; count?: number }[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <ScrollArea type="never" offsetScrollbars={false}>
      <Group gap={6} wrap="nowrap" py={2}>
        {items.map((i) => {
          const on = i.value === value
          return (
            <Button key={i.value} size="compact-md" radius="xl" variant={on ? 'filled' : 'default'} color={GREEN}
              onClick={() => onChange(i.value)} style={{ flexShrink: 0 }}
              rightSection={i.count ? <Badge size="xs" circle color={on ? 'white' : 'gray'} c={on ? GREEN : undefined} variant={on ? 'filled' : 'light'}>{i.count}</Badge> : undefined}>
              {i.label}
            </Button>
          )
        })}
      </Group>
    </ScrollArea>
  )
}

/** Search, area pills, then one clean list. Each row is rendered by the caller. */
function PermList({ perms, row, hint }: { perms: Perm[]; row: (p: Perm) => React.ReactNode; hint?: (area: string) => number }) {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('all')
  const areas = useMemo(() => [...new Set(perms.map((p) => group(p.code)))].sort(), [perms])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return perms.filter((p) => (area === 'all' || group(p.code) === area) && (!s || `${p.code} ${p.description ?? ''}`.toLowerCase().includes(s)))
  }, [perms, q, area])
  return (
    <Stack gap="sm">
      <TextInput leftSection={<Search size={16} />} placeholder="Search what someone can do" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      <Pills value={area} onChange={setArea}
        items={[{ value: 'all', label: 'All' }, ...areas.map((a) => ({ value: a, label: title(a), count: hint?.(a) }))]} />
      <Paper radius="md" style={{ background: '#fff', border: `1px solid ${LINE}`, overflow: 'hidden' }}>
        {shown.length === 0 && <Text c="dimmed" size="sm" ta="center" py="lg">Nothing matches</Text>}
        {shown.map((p, i) => (
          <Box key={p.code} px="md" py="sm" style={{ borderTop: i ? `1px solid ${LINE}` : undefined }}>{row(p)}</Box>
        ))}
      </Paper>
    </Stack>
  )
}

/** Appears when there is something to save; sits above the phone tab bar */
function SaveBar({ show, text, onUndo, onSave, saving }: { show: boolean; text: string; onUndo: () => void; onSave: () => void; saving: boolean }) {
  const phone = useMediaQuery('(max-width: 48em)')
  if (!show) return null
  return (
    <Paper shadow="md" radius="lg" p="sm" style={{ position: 'sticky', bottom: phone ? 76 : 12, zIndex: 20, background: '#fff', border: `1px solid ${LINE}` }}>
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="sm" fw={600}>{text}</Text>
        <Group gap="xs" wrap="nowrap">
          <Button variant="subtle" color="gray" size="xs" onClick={onUndo}>Undo</Button>
          <Button color={GREEN} size="sm" loading={saving} onClick={onSave}>Save</Button>
        </Group>
      </Group>
    </Paper>
  )
}

function RolesTab({ data }: { data: AccessOverview }) {
  const qc = useQueryClient()
  const [code, setCode] = useState<string | null>(data.roles.find((r) => r.code === 'cashier')?.code ?? data.roles[0]?.code ?? null)
  const role = data.roles.find((r) => r.code === code)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => { setSel(new Set(role?.permissions ?? [])) }, [role?.code, role?.permissions.join(',')])

  const done = (o: AccessOverview, msg: string) => { qc.setQueryData(['access'], o); notifications.show({ color: 'green', title: msg, message: '' }) }
  const fail = (e: unknown) => notifications.show({ color: 'red', title: 'Not saved', message: getErrorMessage(e) })
  const save = useMutation({ mutationFn: () => saveRole(code!, [...sel]), onSuccess: (o) => done(o, 'Saved'), onError: fail })
  const reset = useMutation({ mutationFn: () => resetRole(code!), onSuccess: (o) => done(o, 'Back to default'), onError: fail })
  const del = useMutation({ mutationFn: () => deleteRole(code!), onSuccess: (o) => { done(o, 'Role deleted'); setCode(o.roles[0]?.code ?? null) }, onError: fail })
  const add = useMutation({
    mutationFn: () => createRole({ name: newName, description: newDesc || undefined, permissions: [] }),
    onSuccess: (o) => { done(o, 'Role created'); setAdding(false); const r = o.roles.find((x) => x.name === newName.trim()); setNewName(''); setNewDesc(''); if (r) setCode(r.code) },
    onError: fail
  })

  const def = role?.default_permissions ? new Set(role.default_permissions) : null
  const diff = role ? data.permissions.filter((p) => sel.has(p.code) !== role.permissions.includes(p.code)).length : 0
  const toggle = (c: string, on: boolean) => setSel((s) => { const n = new Set(s); if (on) n.add(c); else n.delete(c); return n })
  const onByArea = (a: string) => data.permissions.filter((p) => group(p.code) === a && sel.has(p.code)).length

  return (
    <Stack gap="md">
      <Group gap="xs" wrap="nowrap" align="center">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Pills value={code} onChange={setCode} items={data.roles.map((r) => ({ value: r.code, label: r.name }))} />
        </Box>
        <Button variant="light" color={GREEN} radius="xl" size="compact-md" leftSection={<Plus size={16} />} onClick={() => setAdding(true)} style={{ flexShrink: 0 }}>New</Button>
      </Group>

      {role && (
        <>
          <Paper radius="md" p="md" style={{ background: SOFT }}>
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Box style={{ minWidth: 0 }}>
                <Group gap={8}>
                  <Text fw={700} fz="lg">{role.name}</Text>
                  {role.custom && <Badge variant="light" color="gray" size="sm">Custom</Badge>}
                </Group>
                <Text size="sm" c="dimmed">{role.description || 'No description'}</Text>
                <Text size="xs" c="dimmed" mt={4}>{role.people} {role.people === 1 ? 'person has' : 'people have'} this role</Text>
              </Box>
              <Box ta="right" style={{ flexShrink: 0 }}>
                <Text fw={800} fz={26} lh={1} style={{ color: GREEN }}>{sel.size}</Text>
                <Text size="xs" c="dimmed">of {data.permissions.length} on</Text>
              </Box>
            </Group>
            {!role.locked && (role.default_permissions || role.custom) && (
              <Group gap="xs" mt="sm">
                {role.default_permissions && (
                  <Button variant="default" size="compact-sm" leftSection={<RotateCcw size={14} />} loading={reset.isPending}
                    onClick={() => { if (window.confirm(`Put ${role.name} back to its default access?`)) reset.mutate() }}>Reset to default</Button>
                )}
                {role.custom && (
                  <Button variant="default" size="compact-sm" leftSection={<Trash2 size={14} />} loading={del.isPending}
                    onClick={() => { if (window.confirm(`Delete ${role.name}?`)) del.mutate() }}>Delete</Button>
                )}
              </Group>
            )}
          </Paper>

          {role.locked ? (
            <Alert color="gray">The admin role always has everything and can not be changed.</Alert>
          ) : (
            <>
              <PermList perms={data.permissions} hint={onByArea} row={(p) => (
                <Group justify="space-between" wrap="nowrap" gap="md" align="center">
                  <Box style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap" align="center">
                      {def && def.has(p.code) !== sel.has(p.code) && <span style={{ width: 7, height: 7, borderRadius: 4, background: ORANGE, flexShrink: 0 }} />}
                      <Text size="sm" fw={500}>{p.description || p.code}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>{p.code}</Text>
                  </Box>
                  <Switch color={GREEN} size="md" checked={sel.has(p.code)} onChange={(e) => toggle(p.code, e.currentTarget.checked)} aria-label={p.description || p.code} />
                </Group>
              )} />
              <SaveBar show={diff > 0} text={`${diff} change${diff === 1 ? '' : 's'}`} saving={save.isPending}
                onUndo={() => setSel(new Set(role.permissions))} onSave={() => save.mutate()} />
            </>
          )}
        </>
      )}

      <Modal opened={adding} onClose={() => setAdding(false)} title="New role" centered>
        <Stack>
          <TextInput label="Name" placeholder="e.g. Head Chef" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} data-autofocus />
          <TextInput label="What they do (optional)" value={newDesc} onChange={(e) => setNewDesc(e.currentTarget.value)} />
          <Text size="xs" c="dimmed">It starts with no access. Switch on what it can do, then give it to people on the Users page.</Text>
          <Button color={GREEN} fullWidth disabled={newName.trim().length < 2} loading={add.isPending} onClick={() => add.mutate()}>Create role</Button>
        </Stack>
      </Modal>
    </Stack>
  )
}

function PersonPanel({ id, perms, onClose }: { id: string; perms: Perm[]; onClose: () => void }) {
  const qc = useQueryClient()
  const phone = useMediaQuery('(max-width: 48em)')
  const q = useQuery({ queryKey: ['access-person', id], queryFn: () => getPerson(id) })
  const [mode, setMode] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!q.data) return
    const m: Record<string, string> = {}
    q.data.grants.forEach((c) => (m[c] = 'give'))
    q.data.blocks.forEach((c) => (m[c] = 'block'))
    setMode(m)
  }, [q.data])
  const save = useMutation({
    mutationFn: () => savePerson(id, Object.keys(mode).filter((c) => mode[c] === 'give'), Object.keys(mode).filter((c) => mode[c] === 'block')),
    onSuccess: (r) => { qc.setQueryData(['access-person', id], r); notifications.show({ color: 'green', title: 'Saved', message: 'Applies at their next sign-in or refresh' }); onClose() },
    onError: (e) => notifications.show({ color: 'red', title: 'Not saved', message: getErrorMessage(e) })
  })
  const fromRole = new Set(q.data?.from_roles ?? [])
  const saved = new Set([...(q.data?.grants ?? []), ...(q.data?.blocks ?? [])])
  const set = Object.entries(mode).filter(([, v]) => v === 'give' || v === 'block')
  const dirty = set.length !== saved.size || set.some(([c, v]) => !(v === 'give' ? q.data?.grants : q.data?.blocks)?.includes(c))
  return (
    <Modal opened onClose={onClose} fullScreen={!!phone} size="lg" centered={!phone} title={q.data ? q.data.person.full_name : 'Access'}>
      {q.isLoading ? <Loader size="sm" /> : (
        <Stack gap="md">
          <Paper radius="md" p="sm" style={{ background: SOFT }}>
            <Text size="sm">Their roles already give <b>{fromRole.size}</b> permissions. Use <b>Give</b> or <b>Block</b> only for exceptions.</Text>
            <Text size="xs" c="dimmed" mt={2}>{set.length} exception{set.length === 1 ? '' : 's'} set</Text>
          </Paper>
          <PermList perms={perms} hint={(a) => perms.filter((p) => group(p.code) === a && (mode[p.code] === 'give' || mode[p.code] === 'block')).length}
            row={(p) => (
              <Stack gap={6}>
                <Box>
                  <Text size="sm" fw={500}>{p.description || p.code}</Text>
                  <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>{p.code} · {fromRole.has(p.code) ? 'from their role' : 'not in their role'}</Text>
                </Box>
                <SegmentedControl size="xs" fullWidth value={mode[p.code] ?? 'role'} onChange={(v) => setMode((m) => ({ ...m, [p.code]: v }))}
                  color={mode[p.code] === 'block' ? 'red' : GREEN}
                  data={[{ value: 'role', label: 'As role' }, { value: 'give', label: 'Give' }, { value: 'block', label: 'Block' }]} />
              </Stack>
            )} />
          <Group grow>
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button color={GREEN} disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}

function PeopleTab({ perms }: { perms: Perm[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const people = useQuery({ queryKey: ['access-people', q], queryFn: () => getPeople(q) })
  return (
    <Stack gap="sm">
      <TextInput leftSection={<Search size={16} />} placeholder="Find a person" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      {people.isLoading && <Loader size="sm" />}
      {people.data?.length === 0 && <EmptyState title="No one found" description="Try another name." />}
      <Paper radius="md" style={{ background: '#fff', border: `1px solid ${LINE}`, overflow: 'hidden' }}>
        {people.data?.map((p, i) => (
          <Box key={p.id} px="md" py="sm" onClick={() => setOpen(p.id)} style={{ cursor: 'pointer', borderTop: i ? `1px solid ${LINE}` : undefined }}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Box style={{ minWidth: 0 }}>
                <Text fw={600} truncate>{p.full_name}</Text>
                <Text size="xs" c="dimmed" truncate>@{p.username} · {p.roles.join(', ') || 'No role'}</Text>
              </Box>
              <ChevronRight size={18} color="#868E96" style={{ flexShrink: 0 }} />
            </Group>
          </Box>
        ))}
      </Paper>
      {open && <PersonPanel id={open} perms={perms} onClose={() => setOpen(null)} />}
    </Stack>
  )
}

function AccessPage() {
  const auth = useAuth()
  const [tab, setTab] = useState('roles')
  const q = useQuery({ queryKey: ['access'], queryFn: getAccess, enabled: auth.hasRole('admin') })
  if (!auth.hasRole('admin')) return <EmptyState title="Admins only" description="Access is managed by the system admin." />
  return (
    <Stack gap="md" maw={860} mx="auto" pb="xl">
      <PageHeader title="Access" subtitle="Who can do what. Changes apply straight away." />
      <SegmentedControl fullWidth value={tab} onChange={setTab} data={[{ value: 'roles', label: 'Roles' }, { value: 'people', label: 'People' }]} />
      {q.isLoading && <Loader size="sm" />}
      {q.error && <EmptyState title="Could not load" description={getErrorMessage(q.error)} />}
      {q.data && (tab === 'roles' ? <RolesTab data={q.data} /> : <PeopleTab perms={q.data.permissions} />)}
    </Stack>
  )
}
