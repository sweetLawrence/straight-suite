import { Card, Group, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sublabel?: string;
}

export function SummaryCard({ label, value, sublabel }: Props) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
      {sublabel && (
        <Text size="xs" c="dimmed" mt={2}>
          {sublabel}
        </Text>
      )}
    </Card>
  );
}