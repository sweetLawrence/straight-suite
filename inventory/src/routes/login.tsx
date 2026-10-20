import { createFileRoute } from '@tanstack/react-router';
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api/client';
import { appPath, pagePath } from '@/lib/utils/basePath';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const C = {
  navy: '#1F3A5F',
  bg: '#F4F6F9',
  line: '#E9ECEF',
  muted: '#868E96',
  amber: '#E67700',
  amberBg: '#FFF9DB',
};

// Seeded test accounts. Shown only in `pnpm dev`, never in a production build.
const DEV_PASSWORD = 'password123';
const DEV_ACCOUNTS = [
  { username: 'john.w', role: 'Waiter' },
  { username: 'mary.w', role: 'Waiter' },
  { username: 'james.b', role: 'Bar' },
  { username: 'alice.c', role: 'Cashier' },
  { username: 'peter.s', role: 'Store' },
  { username: 'david.m', role: 'Manager' },
  { username: 'md', role: 'MD' },
];

function LoginPage() {
  const auth = Route.useRouteContext().auth;
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v ? null : 'Username is required'),
      password: (v) => (v ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await auth.login(values.username.trim(), values.password);
      window.location.replace(appPath('/dashboard'));
    } catch (err) {
      notifications.show({ color: 'red', title: 'Login failed', message: getErrorMessage(err) });
      setLoading(false);
    }
  };

  const pickAccount = (username: string) => {
    form.setValues({ username, password: DEV_PASSWORD });
    form.clearErrors();
  };

  return (
    <Box
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: C.bg,
        padding: '24px 16px calc(24px + env(safe-area-inset-bottom))',
      }}
    >
      <Box w="100%" maw={400} mx="auto">
        {/* Brand */}
        <Stack align="center" gap={6} mb={24}>
          <ThemeIcon size={48} radius="md" style={{ backgroundColor: C.navy }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </ThemeIcon>
          <Title order={3} fw={700} style={{ color: C.navy, letterSpacing: '-0.01em' }}>
            Straight Group
          </Title>
          <Text size="sm" c="dimmed">
            Sign in to Straight Inventory
          </Text>
        </Stack>

        {/* Sign-in card */}
        <Paper withBorder radius="lg" p={{ base: 'lg', sm: 'xl' }} shadow="xs" style={{ borderColor: C.line }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Username"
                placeholder="e.g. john.w"
                size="md"
                radius="md"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...form.getInputProps('username')}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                size="md"
                radius="md"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="md"
                radius="md"
                mt={4}
                style={{ backgroundColor: C.navy }}
              >
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Dev only: tap an account to fill the form */}
        {import.meta.env.DEV && (
          <Paper
            radius="lg"
            p="md"
            mt="md"
            style={{ border: `1px dashed ${C.amber}`, backgroundColor: C.amberBg }}
          >
            <Group justify="space-between" mb={10} wrap="nowrap">
              <Text size="xs" fw={700} tt="uppercase" style={{ color: C.amber, letterSpacing: 0.4 }}>
                Test accounts
              </Text>
              <Badge size="xs" variant="outline" style={{ color: C.amber, borderColor: C.amber }}>
                Dev only
              </Badge>
            </Group>
            <SimpleGrid cols={2} spacing={8} verticalSpacing={8}>
              {DEV_ACCOUNTS.map((a) => {
                const active = form.values.username === a.username;
                return (
                  <UnstyledButton
                    key={a.username}
                    onClick={() => pickAccount(a.username)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${active ? C.navy : C.line}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      minWidth: 0,
                    }}
                  >
                    <Text size="sm" fw={600} truncate style={{ color: C.navy }}>
                      {a.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {a.role}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
            <Text size="xs" mt={10} style={{ color: C.muted }}>
              Password for all: <b>{DEV_PASSWORD}</b>. Tap one, then Sign in.
            </Text>
          </Paper>
        )}

        <Text size="xs" ta="center" mt="lg" style={{ color: C.muted }}>
          Mums' Garden · Centurion
        </Text>
      </Box>
    </Box>
  );
}