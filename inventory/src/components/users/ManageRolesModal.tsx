import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Trash2 } from 'lucide-react';
import {
  useAssignUserRole,
  useRevokeUserRole,
  useRoles,
} from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { UserListItem } from '@/lib/api/core';
import { useState } from 'react';

interface Props {
  opened: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

export function ManageRolesModal({ opened, onClose, user }: Props) {
  const roles = useRoles();
  const assign = useAssignUserRole();
  const revoke = useRevokeUserRole();
  const [toAssign, setToAssign] = useState<string[]>([]);

  const form = useForm({ initialValues: {} });

  const handleAssign = async () => {
    if (!user || toAssign.length === 0) return;
    try {
      for (const code of toAssign) {
        await assign.mutateAsync({
          userId: user.id,
          data: { role_code: code },
        });
      }
      notifications.show({
        color: 'green',
        title: 'Roles assigned',
        message: `${toAssign.length} role(s) added.`,
      });
      setToAssign([]);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const handleRevoke = async (roleId: string) => {
    if (!user) return;
    try {
      await revoke.mutateAsync({ userId: user.id, roleId });
      notifications.show({
        color: 'orange',
        title: 'Role revoked',
        message: 'The role has been removed.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  if (!user) return null;

  const roleOptions =
    roles.data?.data.map((r) => ({
      value: r.code,
      label: r.name,
    })) || [];

  const activeRoles = (user.user_roles || []).filter(
    (ur) => !('revoked_at' in ur) || !(ur as any).revoked_at
  );

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Roles" size="md">
      <Stack>
        <Text size="sm" c="dimmed">
          {user.full_name} - {user.username}
        </Text>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Role</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activeRoles.map((ur) => (
              <Table.Tr key={ur.id}>
                <Table.Td>{ur.role.name}</Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-sm"
                    leftSection={<Trash2 size={14} />}
                    onClick={() => handleRevoke(ur.role.id)}
                  >
                    Revoke
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <MultiSelect
          label="Add Roles"
          data={roleOptions}
          value={toAssign}
          onChange={setToAssign}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleAssign} loading={assign.isPending}>
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}