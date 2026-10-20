import { Modal, Progress, Text, Stack, Group } from '@mantine/core'
import type { UpdateProgress } from '../utils/updater'

interface UpdateModalProps {
  progress: UpdateProgress
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'

  const mb = bytes / 1024 / 1024

  return `${mb.toFixed(1)} MB`
}

export default function UpdateModal({
  progress
}: UpdateModalProps) {
  const opened =
    progress.state === 'downloading' ||
    progress.state === 'installing' ||
    progress.state === 'complete'

  if (!opened) {
    return null
  }

  const isDownloading = progress.state === 'downloading'
  const isInstalling = progress.state === 'installing'

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      size='sm'
      title='Straight OS Update'
    >
      <Stack gap='md'>
        {progress.version && (
          <Text size='sm' c='dimmed'>
            Version {progress.version} is available.
          </Text>
        )}

        {isDownloading && (
          <>
            <Text fw={500}>
              Downloading update...
            </Text>

            <Progress
              value={progress.percentage}
              size='lg'
              radius='xl'
              animated
            />

            <Group justify='space-between'>
              <Text size='sm' c='dimmed'>
                {progress.total > 0
                  ? `${formatBytes(progress.downloaded)} / ${formatBytes(progress.total)}`
                  : 'Preparing download...'}
              </Text>

              <Text size='sm' fw={600}>
                {progress.percentage}%
              </Text>
            </Group>

            <Text size='xs' c='dimmed'>
              Please keep Straight OS open while the update downloads.
            </Text>
          </>
        )}

        {isInstalling && (
          <>
            <Text fw={500}>
              Installing update...
            </Text>

            <Progress
              value={100}
              size='lg'
              radius='xl'
              animated
            />

            <Text size='sm' c='dimmed'>
              The update has finished downloading. Please wait while
              Straight OS installs it.
            </Text>
          </>
        )}

        {progress.state === 'complete' && (
          <Text size='sm' c='dimmed'>
            Update complete. Straight OS is restarting...
          </Text>
        )}
      </Stack>
    </Modal>
  )
}