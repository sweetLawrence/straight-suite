import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useUpdatePortionDefinition } from '@/hooks/useMenu';
import { getErrorMessage } from '@/lib/api/client';
import { PortionDefinition } from '@/lib/api/menu';

interface Props {
  opened: boolean;
  onClose: () => void;
  portionDefinition: PortionDefinition | null;
}

export function EditPortionDefinitionModal({
  opened,
  onClose,
  portionDefinition,
}: Props) {
  const update = useUpdatePortionDefinition();

  const form = useForm({
    initialValues: {
      portion_name: '',
      portion_size: 0,
      sell_price: 0,
      status: 'active' as 'active' | 'inactive',
    },
    validate: {
      portion_name: (v) => (v.trim() ? null : 'Required'),
      portion_size: (v) => (v > 0 ? null : 'Must be > 0'),
      sell_price: (v) => (v >= 0 ? null : 'Must be ≥ 0'),
    },
  });

  useEffect(() => {
    if (portionDefinition) {
      form.setValues({
        portion_name: portionDefinition.portion_name,
        portion_size: parseFloat(portionDefinition.portion_size),
        sell_price: parseFloat(portionDefinition.sell_price),
        status: portionDefinition.status as 'active' | 'inactive',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portionDefinition]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!portionDefinition) return;
    try {
      await update.mutateAsync({
        id: portionDefinition.id,
        data: {
          portion_name: values.portion_name,
          portion_size: values.portion_size,
          sell_price: values.sell_price,
          status: values.status,
        },
      });
      notifications.show({
        color: 'green',
        title: 'Portion definition updated',
        message: `${values.portion_name} has been saved.`,
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

  if (!portionDefinition) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Portion Definition">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Portion Name"
            required
            {...form.getInputProps('portion_name')}
          />
          <NumberInput
            label="Portion Size"
            min={0}
            decimalScale={3}
            required
            {...form.getInputProps('portion_size')}
          />
          <NumberInput
            label="Sell Price (KES)"
            min={0}
            decimalScale={2}
            required
            {...form.getInputProps('sell_price')}
          />
          <Select
            label="Status"
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
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