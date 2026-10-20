import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Badge, Button, Group, Loader, Modal, Paper, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { Phone, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useSaveSupplier, useSuppliers } from '@/hooks/usePurchasing';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { Supplier, SupplierInput } from '@/lib/api/purchasing';
import { formatCurrency } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/suppliers')({ component: SuppliersPage });

const EMPTY: SupplierInput = { name: '', contact_person: '', phone: '', email: '', kra_pin: '', supplies: '', payment_terms: '', notes: '' };

function SuppliersPage() {
  const auth = useAuth();
  const canManage = auth.hasPermission('purchase.manage');
  const q = useSuppliers();
  const save = useSaveSupplier();
  const [editing, setEditing] = useState<{ id?: string; data: SupplierInput } | null>(null);

  const submit = async () => {
    if (!editing) return;
    try {
      await save.mutateAsync(editing);
      notifications.show({ color: 'green', title: 'Supplier saved', message: editing.data.name });
      setEditing(null);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    }
  };
  const field = (k: keyof SupplierInput, label: string, placeholder?: string) => (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={(editing?.data[k] as string) || ''}
      onChange={(e) => {
        const v = e.currentTarget.value;
        setEditing((s) => (s ? { ...s, data: { ...s.data, [k]: v } } : s));
      }}
    />
  );

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Who you buy from, and how much in the last 90 days"
        actions={canManage ? <Button leftSection={<Plus size={16} />} onClick={() => setEditing({ data: { ...EMPTY } })}>Add supplier</Button> : undefined}
      />
      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error ? (
        <EmptyState title="Couldn't load suppliers" description={getErrorMessage(q.error)} />
      ) : !q.data?.length ? (
        <EmptyState title="No suppliers yet" description="Add the people you buy stock from." />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
          {q.data.map((s: Supplier) => (
            <Paper key={s.id} withBorder radius="md" p="md" style={{ opacity: s.status === 'active' ? 1 : 0.55, cursor: canManage ? 'pointer' : undefined }}
              onClick={() => canManage && setEditing({ id: s.id, data: { ...s } })}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={700} truncate>{s.name}</Text>
                  {s.supplies && <Text size="xs" c="dimmed" lineClamp={1}>{s.supplies}</Text>}
                  {s.phone && (
                    <Group gap={4}><Phone size={12} color="#868E96" /><Text size="xs" c="dimmed">{s.phone}{s.contact_person ? ` · ${s.contact_person}` : ''}</Text></Group>
                  )}
                </Stack>
                {s.status !== 'active' && <Badge size="xs" color="gray">Inactive</Badge>}
              </Group>
              <Group mt="sm" gap="lg">
                <Stack gap={0}><Text size="xs" c="dimmed">Spent (90 days)</Text><Text fw={700} style={{ color: '#1F3A5F' }}>{formatCurrency(s.spent_90d)}</Text></Stack>
                <Stack gap={0}><Text size="xs" c="dimmed">Deliveries</Text><Text fw={700}>{s.deliveries_90d}</Text></Stack>
                <Stack gap={0}><Text size="xs" c="dimmed">Last</Text><Text size="sm">{s.last_delivery_at ? dayjs(s.last_delivery_at).format('D MMM') : '-'}</Text></Stack>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      )}
      <Modal opened={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit supplier' : 'Add supplier'}>
        <Stack>
          {field('name', 'Name', 'e.g. EABL Distributors')}
          <SimpleGrid cols={2} spacing="sm">
            {field('contact_person', 'Contact person')}
            {field('phone', 'Phone')}
            {field('email', 'Email')}
            {field('kra_pin', 'KRA PIN')}
          </SimpleGrid>
          {field('supplies', 'What they supply', 'e.g. Beer, sodas')}
          {field('payment_terms', 'Payment terms', 'e.g. Cash on delivery, 30 days')}
          <Textarea label="Notes" autosize minRows={2} value={editing?.data.notes || ''}
            onChange={(e) => { const v = e.currentTarget.value; setEditing((s) => (s ? { ...s, data: { ...s.data, notes: v } } : s)); }} />
          <Group justify="space-between">
            {editing?.id ? (
              <Button variant="subtle" color={editing.data.status === 'inactive' ? 'green' : 'gray'}
                onClick={() => setEditing((s) => (s ? { ...s, data: { ...s.data, status: s.data.status === 'inactive' ? 'active' : 'inactive' } } : s))}>
                {editing.data.status === 'inactive' ? 'Mark active' : 'Mark inactive'}
              </Button>
            ) : <span />}
            <Button disabled={(editing?.data.name || '').trim().length < 2} loading={save.isPending} onClick={submit}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
