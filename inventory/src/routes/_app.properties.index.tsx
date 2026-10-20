import { createFileRoute } from '@tanstack/react-router';
import { ActionIcon, Badge, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useProperties } from '@/hooks/useCore';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { EditPropertyModal } from '@/components/properties/EditPropertyModal';
import { Property } from '@/lib/api/core';

export const Route = createFileRoute('/_app/properties/')({
  component: PropertiesPage,
});

function PropertiesPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Property | null>(null);
  const [editOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);

  const query = useProperties(page, 20);
  const canManage = auth.hasRole('md', 'admin');

  const columns: Column<Property>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (r) => <Text fw={500}>{r.code}</Text>,
      width: 100,
    },
    { key: 'name', header: 'Name', render: (r) => r.name },
    {
      key: 'location',
      header: 'Location',
      render: (r) => r.location || '-',
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <Text size="sm">{r.property_type}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge
          color={r.status === 'active' ? 'green' : 'gray'}
          variant="light"
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        canManage ? (
          <ActionIcon
            variant="subtle"
            onClick={() => {
              setSelected(r);
              openEdit();
            }}
          >
            <Pencil size={16} />
          </ActionIcon>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="All properties in the group"
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load properties' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No properties"
      />
      <EditPropertyModal
        opened={editOpen}
        onClose={closeEdit}
        property={selected}
      />
    </>
  );
}