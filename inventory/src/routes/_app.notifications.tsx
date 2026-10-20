import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Badge, Box, Button, Group, Loader, Pagination, Paper, SegmentedControl, Stack, Text, UnstyledButton } from '@mantine/core';
import dayjs from 'dayjs';
import { CheckCheck, ChevronRight, MessageSquare } from 'lucide-react';
import { notifications as toast } from '@mantine/notifications';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { StatusDot } from '@/components/StatusDot';
import { PushToggle } from '@/components/PushToggle';
import { DayGroupedList } from '@/components/DayGroupedList';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import type { AppNotification, Severity } from '@/lib/api/notifications';

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
});

const SEV: Record<Severity, { color: string; label: string }> = {
  critical: { color: '#E03131', label: 'Critical' },
  warning: { color: '#F08C00', label: 'Needs attention' },
  info: { color: '#228BE6', label: 'For your information' },
};

type Show = 'all' | 'unread' | 'critical';

function NotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const [show, setShow] = useState<Show>('all');
  const [page, setPage] = useState(1);

  const query = useNotifications({
    page,
    limit: 30,
    unread: show === 'unread' || undefined,
    severity: show === 'critical' ? 'critical' : undefined,
  });
  const counts = useUnreadCount();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  // Critical alerts also go to the MD's phone by SMS once the provider key is set on the server
  const testSms = async () => {
    try {
      const res = await apiClient.post('/tools/sms-test', {});
      const r = res.data.data as { configured: boolean; phones: string[]; sent: number; reason?: string };
      toast.show({
        color: r.sent ? 'green' : 'orange',
        title: r.sent ? 'Test SMS sent' : 'SMS not sent',
        message: r.sent ? `To ${r.phones.join(', ')}` : r.configured ? r.reason || 'Not delivered' : 'SMS is not set up on the server yet (AT_USERNAME, AT_API_KEY). Phone on file: ' + (r.phones.join(', ') || 'none'),
      });
    } catch (err) {
      toast.show({ color: 'red', title: 'Could not test', message: getErrorMessage(err) });
    }
  };

  const open = (n: AppNotification) => {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) navigate({ to: n.link });
  };

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const unread = counts.data?.unread ?? 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={
          groupLevel
            ? 'Everything important across both properties, as it happens'
            : 'Everything important at your property, as it happens'
        }
        actions={
          <Group gap="xs">
            {auth.hasRole('md', 'admin') && (
              <Button variant="subtle" size="sm" leftSection={<MessageSquare size={16} />} onClick={testSms}>
                Test SMS
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              leftSection={<CheckCheck size={16} />}
              disabled={!unread}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </Button>
          </Group>
        }
      />

      <PushToggle />

      <Group mb="md" gap="sm" wrap="wrap">
        <SegmentedControl
          value={show}
          onChange={(v) => {
            setShow(v as Show);
            setPage(1);
          }}
          data={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread${unread ? ` (${unread})` : ''}` },
            { value: 'critical', label: 'Critical' },
          ]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load notifications" description={getErrorMessage(query.error)} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={show === 'unread' ? 'All caught up' : 'Nothing yet'}
          description={
            show === 'unread'
              ? 'You have read every notification.'
              : 'Transfers, approvals, disputed cash, discounts and day changes will show here.'
          }
        />
      ) : (
        <DayGroupedList
          items={rows}
          getDate={(n) => n.created_at}
          keyOf={(n) => n.id}
          gap="xs"
          render={(n) => <Row n={n} showProperty={groupLevel} onOpen={() => open(n)} />}
        />
      )}

      {meta && meta.pages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination value={page} onChange={setPage} total={meta.pages} size="sm" siblings={0} />
        </Group>
      )}
    </>
  );
}

function Row({ n, showProperty, onOpen }: { n: AppNotification; showProperty: boolean; onOpen: () => void }) {
  const sev = SEV[n.severity] || SEV.info;
  const unread = !n.read_at;
  return (
    <UnstyledButton onClick={onOpen} w="100%">
      <Paper
        withBorder
        radius="md"
        p="sm"
        style={{ background: unread ? '#F8FBFF' : '#FFFFFF', borderColor: unread ? '#D0EBFF' : undefined }}
      >
        <Group wrap="nowrap" align="flex-start" gap="sm">
          <Box mt={6}>
            <StatusDot color={sev.color} size={9} />
          </Box>
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6} wrap="nowrap" justify="space-between">
              <Text size="sm" fw={unread ? 700 : 500} style={{ color: '#212529' }} truncate>
                {n.title}
              </Text>
              <Text size="xs" style={{ color: '#868E96', whiteSpace: 'nowrap' }}>
                {dayjs(n.created_at).format('HH:mm')}
              </Text>
            </Group>
            {n.body && (
              <Text size="xs" style={{ color: '#495057' }} lineClamp={2}>
                {n.body}
              </Text>
            )}
            <Group gap={6}>
              {n.severity !== 'info' && (
                <Badge size="xs" variant="light" style={{ color: sev.color, backgroundColor: `${sev.color}14` }}>
                  {sev.label}
                </Badge>
              )}
              {showProperty && n.property && (
                <Badge size="xs" variant="outline" color="gray">
                  {n.property.code}
                </Badge>
              )}
            </Group>
          </Stack>
          {n.link && <ChevronRight size={16} color="#ADB5BD" style={{ marginTop: 4, flexShrink: 0 }} />}
        </Group>
      </Paper>
    </UnstyledButton>
  );
}
