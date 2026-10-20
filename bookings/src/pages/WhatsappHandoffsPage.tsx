import { Title, Text, Card, Group, Badge, Button, Stack, Timeline } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { MessageCircle } from 'lucide-react'
import { useOpenHandoffs, useResolveHandoff } from '../features/whatsappHandoffs/hooks'

export default function WhatsappHandoffsPage() {
  const { data: handoffs, isLoading } = useOpenHandoffs()
  const resolve = useResolveHandoff()

  function handleResolve(id: string) {
    resolve.mutate(id, {
      onSuccess: () => notifications.show({ message: 'Handoff resolved - bot resumed for this guest.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} className="text-primary-700 dark:text-primary-200">WhatsApp Handoffs</Title>
        <Text size="sm" c="dimmed">Conversations the bot has paused, waiting on a staff reply.</Text>
      </div>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : !handoffs || handoffs.length === 0 ? (
        <Text c="dimmed">Nothing waiting right now - the bot is handling everything on its own.</Text>
      ) : (
        <Stack gap="md">
          {handoffs.map((h) => (
            <Card key={h.id} withBorder radius="md" padding="md">
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <MessageCircle size={16} className="text-primary-600" />
                  <Text fw={600}>{h.waId}</Text>
                  <Badge color="orange" variant="light">{h.reason}</Badge>
                </Group>
                <Button size="xs" color="green" onClick={() => handleResolve(h.id)} loading={resolve.isPending}>
                  Mark Resolved
                </Button>
              </Group>

              <Timeline active={h.conversationSnapshot.length} bulletSize={16} lineWidth={2}>
                {h.conversationSnapshot.slice(-8).map((msg, i) => (
                  <Timeline.Item key={i} title={msg.role} bullet={msg.role === 'user' ? '💬' : '🤖'}>
                    <Text size="xs" c="dimmed">{msg.content || '[tool interaction]'}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}