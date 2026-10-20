import {
  Button,
  Group,
  Modal,
  MultiSelect,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateUser, useProperties } from '@/hooks/useCore';
import { useRoles } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateUserModal({ opened, onClose }: Props) {
  const auth = useAuth();
  const properties = useProperties(1, 50);
  const roles = useRoles();
  const create = useCreateUser();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone: '',
      primary_property_id:
        auth.user?.primary_property_id || '',
      role_codes: [] as string[],
    },
    validate: {
      username: (v) => (v.trim() ? null : 'Required'),
      password: (v) => (v.length >= 6 ? null : 'Min 6 characters'),
      full_name: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const u = await create.mutateAsync({
        username: values.username,
        password: values.password,
        full_name: values.full_name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        primary_property_id: values.primary_property_id || undefined,
        role_codes: values.role_codes,
      });
      notifications.show({
        color: 'green',
        title: 'User created',
        message: `${u.full_name} has been added.`,
      });
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const propertyOptions =
    properties.data?.data.map((p) => ({
      value: p.id,
      label: `${p.code} - ${p.name}`,
    })) || [];

  const roleOptions =
    roles.data?.data.map((r) => ({
      value: r.code,
      label: r.name,
    })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Create User" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group grow>
            <TextInput
              label="Username"
              placeholder="e.g. john.w"
              required
              {...form.getInputProps('username')}
            />
            <PasswordInput
              label="Password"
              placeholder="Min 6 characters"
              required
              {...form.getInputProps('password')}
            />
          </Group>
          <TextInput
            label="Full Name"
            required
            {...form.getInputProps('full_name')}
          />
          <Group grow>
            <TextInput
              label="Email (optional)"
              {...form.getInputProps('email')}
            />
            <TextInput
              label="Phone (optional)"
              {...form.getInputProps('phone')}
            />
          </Group>
          <Select
            label="Primary Property"
            description="MD, Auditor and Accountant see both properties whatever you pick here"
            data={propertyOptions}
            searchable
            required
            {...form.getInputProps('primary_property_id')}
          />
          <MultiSelect
            label="Roles"
            placeholder="Assign roles"
            data={roleOptions}
            {...form.getInputProps('role_codes')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}