import { useState } from 'react';
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { Button, Card, Collapse, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { AlertTriangle, ArrowLeft, Home, RotateCw } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/client';

/**
 * Shown when a page fails to open. Plain words and a way out; the technical
 * detail is folded away (and only offered in development builds).
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const message = friendly(error);

  return (
    <Stack align="center" py={48} px="md">
      <Card withBorder radius="md" p="xl" maw={520} w="100%">
        <Stack align="center" gap="sm">
          <ThemeIcon size={52} radius="xl" variant="light" color="orange">
            <AlertTriangle size={26} />
          </ThemeIcon>
          <Title order={3} ta="center">
            This page couldn't open
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            {message}
          </Text>
          <Group mt="sm" justify="center">
            <Button
              leftSection={<RotateCw size={16} />}
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              Try again
            </Button>
            <Button variant="default" leftSection={<ArrowLeft size={16} />} onClick={() => router.history.back()}>
              Go back
            </Button>
            <Button variant="subtle" component={Link} to="/dashboard" leftSection={<Home size={16} />}>
              Dashboard
            </Button>
          </Group>
          {import.meta.env.DEV && (
            <>
              <Button variant="subtle" color="gray" size="xs" onClick={() => setOpen((o) => !o)}>
                {open ? 'Hide' : 'Show'} technical details
              </Button>
              <Collapse expanded={open} w="100%">
                <Text size="xs" ff="monospace" c="dimmed" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </Text>
              </Collapse>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}

export function RouteNotFound() {
  return (
    <Stack align="center" py={48} px="md">
      <Title order={3}>Page not found</Title>
      <Text c="dimmed" size="sm">
        The link may be old or mistyped.
      </Text>
      <Button component={Link} to="/dashboard" leftSection={<Home size={16} />}>
        Go to dashboard
      </Button>
    </Stack>
  );
}

function friendly(error: unknown): string {
  const raw = getErrorMessage(error);
  // Validation dumps (zod / router search params) are not for people
  if (/invalid_format|invalid uuid|zod|\[\s*\{|"code":/i.test(raw)) {
    return 'The link to this page is missing something or is out of date. Open it again from the list.';
  }
  if (/403|permission/i.test(raw)) return "You don't have access to this page. Ask a manager if you need it.";
  if (/404|not found/i.test(raw)) return 'What you were looking for could not be found. It may have been removed.';
  if (/network|timeout|failed to fetch/i.test(raw)) return 'The server could not be reached. Check the connection and try again.';
  return raw.length > 160 ? 'Something unexpected happened. Try again, or go back.' : raw;
}
