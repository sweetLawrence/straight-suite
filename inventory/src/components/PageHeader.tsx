import { Group, Title, Text, Stack } from '@mantine/core';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  // subtitle?: string;
  subtitle?: ReactNode; 
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" mb="lg">
      <Stack gap={2}>
        <Title order={2}>{title}</Title>
        {subtitle && (
          // Plain text gets a <p>; anything richer (icons, groups) a <div>, since a <p> can't hold a <div>
          <Text c="dimmed" size="sm" component={typeof subtitle === 'string' || typeof subtitle === 'number' ? 'p' : 'div'}>
            {subtitle}
          </Text>
        )}
      </Stack>
      {actions && <Group>{actions}</Group>}
    </Group>
  );
}