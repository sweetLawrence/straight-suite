import { Center, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Inbox } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs" maw={400}>
        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
          <Inbox size={32} />
        </ThemeIcon>
        <Title order={4} ta="center">
          {title}
        </Title>
        {description && (
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}