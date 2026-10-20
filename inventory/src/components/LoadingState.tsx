import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingStateProps {
  label?: string;
  height?: number | string;
}

export function LoadingState({ label = 'Loading…', height = 200 }: LoadingStateProps) {
  return (
    <Center h={height}>
      <Stack align="center" gap="xs">
        <Loader />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}