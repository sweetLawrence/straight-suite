import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useUpdateProperty } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { Property } from '@/lib/api/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  property: Property | null;
}

export function EditPropertyModal({ opened, onClose, property }: Props) {
  const update = useUpdateProperty();

  const form = useForm({
    initialValues: {
      name: '',
      location: '',
      property_type: 'hotel' as 'hotel' | 'lodge' | 'restaurant' | 'bar',
      timezone: 'Africa/Nairobi',
      status: 'active' as 'active' | 'inactive' | 'suspended',
    },
  });

  useEffect(() => {
    if (property) {
      form.setValues({
        name: property.name,
        location: property.location || '',
        property_type: property.property_type as any,
        timezone: property.timezone,
        status: property.status as any,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!property) return;
    try {
      await update.mutateAsync({
        id: property.id,
        data: values,
      });
      notifications.show({
        color: 'green',
        title: 'Property updated',
        message: `${values.name} has been saved.`,
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

  if (!property) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Property" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Name"
            required
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Location"
            {...form.getInputProps('location')}
          />
          <Select
            label="Type"
            data={[
              { value: 'hotel', label: 'Hotel' },
              { value: 'lodge', label: 'Lodge' },
              { value: 'restaurant', label: 'Restaurant' },
              { value: 'bar', label: 'Bar' },
            ]}
            {...form.getInputProps('property_type')}
          />
          <TextInput
            label="Timezone"
            {...form.getInputProps('timezone')}
          />
          <Select
            label="Status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            {...form.getInputProps('status')}
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