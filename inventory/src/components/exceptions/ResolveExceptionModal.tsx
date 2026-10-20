import { Button, Group, Modal, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useResolveException } from '@/hooks/useAdmin';
import { getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
  exceptionId: string;
}

export function ResolveExceptionModal({
  opened,
  onClose,
  exceptionId,
}: Props) {
  const resolve = useResolveException(exceptionId);

  const form = useForm({
    initialValues: {
      resolution: '',
    },
    validate: {
      resolution: (v) => (v.trim() ? null : 'Required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await resolve.mutateAsync(values);
      notifications.show({
  color: 'green',
  title: 'Exception resolved',
  message: 'The exception has been resolved.',
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

  return (
    <Modal opened={opened} onClose={onClose} title="Resolve Exception" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea
            label="Resolution"
            placeholder="What was decided?"
            required
            autosize
            minRows={3}
            {...form.getInputProps('resolution')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={resolve.isPending}>
              Resolve
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}