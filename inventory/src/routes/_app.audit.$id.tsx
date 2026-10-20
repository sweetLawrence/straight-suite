import { createFileRoute, Link } from '@tanstack/react-router';
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useAuditEvent } from '@/hooks/useAdmin';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/audit/$id')({
  component: EventDetailPage,
});

function EventDetailPage() {
  const { id } = Route.useParams();
  const query = useAuditEvent(id);

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <EmptyState title="Event not found" />;

  const e = query.data;

  return (
    <>
      <Link to="/audit" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to audit
        </Button>
      </Link>

      <PageHeader
        title={e.event_type}
        subtitle={formatDateTime(e.occurred_at)}
      />

      <Card withBorder mb="lg">
        <Stack>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Entity</Text>
            <Text size="sm">
              {e.entity_type} ({e.entity_id.slice(0, 12)}…)
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Action</Text>
            <Text size="sm">{e.action}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Actor</Text>
            <Text size="sm">
              {e.actor?.full_name || 'system'}{' '}
              {e.actor_role && `(${e.actor_role})`}
            </Text>
          </Group>
          {e.property && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Property</Text>
              <Text size="sm">{e.property.code}</Text>
            </Group>
          )}
          {e.reason && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Reason</Text>
              <Text size="sm">{e.reason}</Text>
            </Group>
          )}
        </Stack>
      </Card>

      {e.before_state && (
        <Card withBorder mb="lg">
          <Title order={5} mb="xs">Before</Title>
          <pre style={{ fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(e.before_state, null, 2)}
          </pre>
        </Card>
      )}

      {e.after_state && (
        <Card withBorder>
          <Title order={5} mb="xs">After</Title>
          <pre style={{ fontSize: 12, overflow: 'auto' }}>
            {JSON.stringify(e.after_state, null, 2)}
          </pre>
        </Card>
      )}
    </>
  );
}