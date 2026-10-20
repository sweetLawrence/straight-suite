import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useUpdateRecipe, useUnitsList } from '@/hooks/useMenu';
import { getErrorMessage } from '@/lib/api/client';
import { Recipe } from '@/lib/api/menu';

interface Props {
  opened: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

export function EditRecipeModal({ opened, onClose, recipe }: Props) {
  const units = useUnitsList();
  const update = useUpdateRecipe();

  const form = useForm({
    initialValues: {
      quantity: 1,
      unit_id: '',
    },
    validate: {
      quantity: (v) => (v > 0 ? null : 'Must be > 0'),
      unit_id: (v) => (v ? null : 'Required'),
    },
  });

  useEffect(() => {
    if (recipe) {
      form.setValues({
        quantity: parseFloat(recipe.quantity),
        unit_id: recipe.unit_id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!recipe) return;
    try {
      await update.mutateAsync({
        id: recipe.id,
        data: {
          quantity: values.quantity,
          unit_id: values.unit_id,
        },
      });
      notifications.show({
        color: 'green',
        title: 'Recipe updated',
        message: 'The ingredient quantity has been updated.',
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

  if (!recipe) return null;

  const unitOptions =
    units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Recipe Line">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" c="dimmed">
            Recipe for line {recipe.id.slice(0, 8)}
          </Text>
          <Group grow>
            <NumberInput
              label="Quantity"
              min={0}
              decimalScale={3}
              required
              {...form.getInputProps('quantity')}
            />
            <Select
              label="Unit"
              data={unitOptions}
              required
              {...form.getInputProps('unit_id')}
            />
          </Group>
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