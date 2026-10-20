import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useUpdateUser } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { UserListItem } from '@/lib/api/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

export function EditUserModal({ opened, onClose, user }: Props) {
  const update = useUpdateUser();

  const form = useForm({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      status: 'active' as 'active' | 'inactive' | 'suspended',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        full_name: user.full_name,
        email: user.email || '',
        phone: user.phone || '',
        status: user.status as any,
        password: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    try {
      await update.mutateAsync({
        id: user.id,
        data: {
          full_name: values.full_name,
          email: values.email || null,
          phone: values.phone || null,
          status: values.status,
          password: values.password || undefined,
        },
      });
      notifications.show({
        color: 'green',
        title: 'User updated',
        message: `${values.full_name} has been saved.`,
      });
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  if (!user) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit User" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Full Name"
            required
            {...form.getInputProps('full_name')}
          />
          <Group grow>
            <TextInput
              label="Email"
              {...form.getInputProps('email')}
            />
            <TextInput
              label="Phone"
              {...form.getInputProps('phone')}
            />
          </Group>
          <Select
            label="Status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            {...form.getInputProps('status')}
          />
          <PasswordInput
            label="New Password (leave empty to keep current)"
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}