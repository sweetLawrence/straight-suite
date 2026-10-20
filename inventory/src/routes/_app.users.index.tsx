import { createFileRoute } from '@tanstack/react-router';
import { ActionIcon, Badge, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Pencil, Plus, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useUsers } from '@/hooks/useCore';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { ManageRolesModal } from '@/components/users/ManageRolesModal';
import { UserListItem } from '@/lib/api/core';

export const Route = createFileRoute('/_app/users/')({
  component: UsersPage,
});

function UsersPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UserListItem | null>(null);

  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [editOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [rolesOpen, { open: openRoles, close: closeRoles }] =
    useDisclosure(false);

  const query = useUsers(page, 20);
  const canManage = auth.hasPermission('user.manage');

  const columns: Column<UserListItem>[] = [
    {
      key: 'full_name',
      header: 'Name',
      render: (r) => <Text fw={500}>{r.full_name}</Text>,
    },
    {
      key: 'username',
      header: 'Username',
      render: (r) => (
        <Text size="sm" c="dimmed">
          {r.username}
        </Text>
      ),
    },
    { key: 'email', header: 'Email', render: (r) => r.email || '-' },
    {
      key: 'roles',
      header: 'Roles',
      render: (r) => (
        <Group gap={4}>
          {r.user_roles && r.user_roles.length > 0 ? (
            r.user_roles.map((ur) => (
              <Badge key={ur.id} variant="light" size="sm">
                {ur.role.code}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Group>
      ),
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
          <Group gap={4} justify="flex-end">
            <ActionIcon
              variant="subtle"
              title="Roles"
              onClick={() => {
                setSelected(r);
                openRoles();
              }}
            >
              <Shield size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              title="Edit"
              onClick={() => {
                setSelected(r);
                openEdit();
              }}
            >
              <Pencil size={16} />
            </ActionIcon>
          </Group>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Staff accounts and role assignments"
        actions={
          canManage ? (
            <Button leftSection={<Plus size={16} />} onClick={openCreate}>
              Create User
            </Button>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load users' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No users"
        emptyDescription="Create staff users to get started."
      />
      <CreateUserModal opened={createOpen} onClose={closeCreate} />
      <EditUserModal
        opened={editOpen}
        onClose={closeEdit}
        user={selected}
      />
      <ManageRolesModal
        opened={rolesOpen}
        onClose={closeRoles}
        user={selected}
      />
    </>
  );
}