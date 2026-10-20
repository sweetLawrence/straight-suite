import { createFileRoute } from '@tanstack/react-router';
import { Box, Button, Paper, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api/client';
import { appPath, pagePath } from '@/lib/utils/basePath';

export const Route = createFileRoute('/admin-login')({
  component: AdminLoginPage,
});

const C = { ink: '#12202F', bg: '#0F1A26', card: '#FFFFFF', line: '#2A3A4D', muted: '#8FA3B8', accent: '#1F3A5F' };

/** Sign-in for the system administrator only. Other accounts are turned away. */
function AdminLoginPage() {
  const auth = Route.useRouteContext().auth;
  const [loading, setLoading] = useState(false);
  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: { username: (v) => (v ? null : 'Required'), password: (v) => (v ? null : 'Required') },
  });

  const submit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const user = await auth.login(values.username.trim(), values.password);
      if (!user.roles?.some((r) => r.code === 'admin')) {
        auth.logout();
        notifications.show({ color: 'red', title: 'Not an administrator', message: 'This sign-in is for the system administrator only. Use the normal sign-in.' });
        setLoading(false);
        return;
      }
      window.location.replace(appPath('/dashboard'));
    } catch (err) {
      notifications.show({ color: 'red', title: 'Sign-in failed', message: getErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: C.bg, padding: '24px 16px calc(24px + env(safe-area-inset-bottom))' }}>
      <Box w="100%" maw={380} mx="auto">
        <Stack align="center" gap={6} mb={24}>
          <ThemeIcon size={52} radius="md" style={{ backgroundColor: C.accent }}>
            <ShieldCheck size={26} color="#FFFFFF" />
          </ThemeIcon>
          <Title order={3} fw={700} style={{ color: '#FFFFFF', letterSpacing: '-0.01em' }}>Administrator</Title>
          <Text size="sm" style={{ color: C.muted }}>System setup and configuration</Text>
        </Stack>
        <Paper radius="lg" p="xl" style={{ background: C.card }}>
          <form onSubmit={form.onSubmit(submit)}>
            <Stack gap="md">
              <TextInput label="Username" size="md" radius="md" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} {...form.getInputProps('username')} />
              <PasswordInput label="Password" size="md" radius="md" autoComplete="current-password" {...form.getInputProps('password')} />
              <Button type="submit" loading={loading} fullWidth size="md" radius="md" mt={4} style={{ backgroundColor: C.ink }}>Sign in</Button>
            </Stack>
          </form>
        </Paper>
        <Text size="xs" ta="center" mt="lg" style={{ color: C.muted }}>Staff sign in at /login</Text>
      </Box>
    </Box>
  );
}
