import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Alert,
  Badge,
  Button,
  Card,
  FileButton,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Lock,
  RotateCcw,
  Upload
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils/format'
import {
  useBulkFiles,
  useBulkStatus,
  useReimportBulkFile,
  useUploadBulkFile
} from '@/hooks/useBulkImport'
import {
  BulkKind,
  BulkResult,
  BulkStep,
  StoredFile,
  downloadExport,
  downloadStoredFile,
  downloadTemplate
} from '@/lib/api/bulkImport'

export const Route = createFileRoute('/_app/admin/bulk-import')({
  component: BulkImportPage
})

const STEP_INFO: Record<
  BulkKind,
  { number: number; file: string; sheets: string }
> = {
  setup: {
    number: 1,
    file: 'Setup.xlsx',
    sheets:
      'Items · StockItems · PortionDefinitions · MenuItems · Recipes · ProductionRecipes'
  },
  operations: {
    number: 2,
    file: 'Operations.xlsx',
    sheets: 'Batches · StandingMenu'
  }
}

const notifyError = (err: unknown) =>
  notifications.show({
    color: 'red',
    title: 'Failed',
    message: getErrorMessage(err)
  })

const runDownload = (fn: () => Promise<void>) => () => {
  fn().catch(notifyError)
}

function BulkImportPage () {
  const status = useBulkStatus()
  const [result, setResult] = useState<BulkResult | null>(null)

  if (status.isLoading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }
  if (status.error || !status.data) {
    return (
      <Alert color='red' title='Could not load import status'>
        {getErrorMessage(status.error)}
      </Alert>
    )
  }

  const steps = status.data.steps
  const step = (key: BulkStep['key']) => steps.find(s => s.key === key)!
  const reference = step('reference')

  return (
    <>
      <PageHeader
        title='Bulk Import'
        subtitle='Load the catalog and opening stock from Excel. Upload Setup.xlsx first, then Operations.xlsx.'
      />

      <Stack gap='md'>
        {!reference.done && (
          <Alert
            color='orange'
            icon={<AlertTriangle size={18} />}
            title='Reference data missing'
          >
            Properties and units must exist before anything can be imported.
            They are created by the reference seeders on first boot.
          </Alert>
        )}

        <StepCard kind='setup' step={step('setup')} onResult={setResult} />
        <StepCard
          kind='operations'
          step={step('operations')}
          onResult={setResult}
          lockedReason={
            step('operations').ready
              ? null
              : status.data.counts.stock_items === 0
              ? 'Import Setup.xlsx first - Operations needs its stock items.'
              : 'Open a business day first - stock receipts are recorded against it.'
          }
        />

        {result && (
          <ResultPanel result={result} onClose={() => setResult(null)} />
        )}

        <StoredFiles onResult={setResult} />

        <CountsCard counts={status.data.counts} />
      </Stack>
    </>
  )
}

// ─── Step card ─────────────────────────────────────────────────────

function StepCard ({
  kind,
  step,
  onResult,
  lockedReason = null
}: {
  kind: BulkKind
  step: BulkStep
  onResult: (r: BulkResult) => void
  lockedReason?: string | null
}) {
  const info = STEP_INFO[kind]
  const upload = useUploadBulkFile()
  const [file, setFile] = useState<File | null>(null)
  const [checked, setChecked] = useState<BulkResult | null>(null)
  const [running, setRunning] = useState<'validate' | 'import' | null>(null)
  const locked = !!lockedReason

  const pick = (f: File | null) => {
    setFile(f)
    setChecked(null)
  }

  const run = async (mode: 'validate' | 'import') => {
    if (!file) return
    setRunning(mode)
    try {
      const r = await upload.mutateAsync({ file, expectedKind: kind, mode })
      onResult(r)
      if (mode === 'validate') {
        setChecked(r)
        if (r.ok)
          notifications.show({
            color: 'green',
            title: 'File is valid',
            message: 'Nothing was saved yet - click Import to load it.'
          })
      } else if (r.committed) {
        notifications.show({
          color: 'green',
          title: `${info.file} imported`,
          message: 'A copy was kept under Stored files.'
        })
        pick(null)
      }
    } catch (err) {
      setChecked(null)
      notifyError(err)
    } finally {
      setRunning(null)
    }
  }

  return (
    <Card
      withBorder
      padding='lg'
      radius='md'
      style={locked ? { opacity: 0.7 } : undefined}
    >
      <Group justify='space-between' align='flex-start' wrap='wrap' gap='sm'>
        <Group align='flex-start' gap='md' wrap='nowrap'>
          <ThemeIcon
            size={36}
            radius='xl'
            color={step.done ? 'green' : locked ? 'gray' : 'blue'}
          >
            {step.done ? (
              <CheckCircle2 size={20} />
            ) : locked ? (
              <Lock size={18} />
            ) : (
              <Text fw={700}>{info.number}</Text>
            )}
          </ThemeIcon>
          <Stack gap={2}>
            <Group gap='xs'>
              <Title order={4}>
                Step {info.number} - {info.file}
              </Title>
              {step.done && (
                <Badge color='green' variant='light'>
                  Loaded
                </Badge>
              )}
            </Group>
            <Text size='sm' c='dimmed'>
              {info.sheets}
            </Text>
          </Stack>
        </Group>
        <Group gap='xs'>
          <Button
            variant='subtle'
            size='xs'
            leftSection={<Download size={14} />}
            onClick={runDownload(() => downloadTemplate(kind))}
          >
            Template
          </Button>
          <Button
            variant='subtle'
            size='xs'
            leftSection={<Download size={14} />}
            onClick={runDownload(() => downloadExport(kind))}
          >
            Current data
          </Button>
        </Group>
      </Group>

      {locked ? (
        <Alert mt='md' color='gray' icon={<Lock size={16} />}>
          {lockedReason}
        </Alert>
      ) : (
        <Group mt='md' gap='sm' wrap='wrap'>
          <FileButton
            onChange={pick}
            accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          >
            {props => (
              <Button
                {...props}
                variant='default'
                leftSection={<FileSpreadsheet size={16} />}
              >
                {file ? 'Change file' : `Choose ${info.file}`}
              </Button>
            )}
          </FileButton>
          {file && (
            <Text size='sm' fw={500}>
              {file.name}
            </Text>
          )}
          <Button
            variant='light'
            disabled={!file}
            loading={running === 'validate'}
            onClick={() => run('validate')}
          >
            Check file
          </Button>
          <Button
            leftSection={<Upload size={16} />}
            disabled={!file || !checked?.ok || running !== null}
            loading={running === 'import'}
            onClick={() => run('import')}
          >
            Import
          </Button>
          {file && !checked && (
            <Text size='xs' c='dimmed'>
              Check the file before importing.
            </Text>
          )}
          {checked && !checked.ok && (
            <Text size='xs' c='red'>
              Fix the errors below, then choose the file again.
            </Text>
          )}
        </Group>
      )}
    </Card>
  )
}

// ─── Result panel ──────────────────────────────────────────────────

const MAX_ERRORS = 300

function ResultPanel ({
  result,
  onClose
}: {
  result: BulkResult
  onClose: () => void
}) {
  const sheets = Object.entries(result.sheets)
  const title = result.committed
    ? 'Imported'
    : result.ok
    ? 'Check passed - nothing saved yet'
    : `${result.errors.length} problem${
        result.errors.length === 1 ? '' : 's'
      } found - nothing was saved`

  return (
    <Card withBorder padding='lg' radius='md'>
      <Group justify='space-between' mb='sm'>
        <Group gap='xs'>
          {result.ok ? (
            <CheckCircle2 size={20} color='#2B8A3E' />
          ) : (
            <AlertTriangle size={20} color='#C92A2A' />
          )}
          <Title order={4}>{title}</Title>
          {result.file_name && (
            <Text size='sm' c='dimmed'>
              {result.file_name}
            </Text>
          )}
        </Group>
        <Button variant='subtle' size='xs' onClick={onClose}>
          Close
        </Button>
      </Group>

      {sheets.length > 0 && (
        <ScrollArea>
          <Table striped withTableBorder fz='sm' miw={560}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Sheet</Table.Th>
                <Table.Th ta='right'>Rows</Table.Th>
                <Table.Th ta='right'>New</Table.Th>
                <Table.Th ta='right'>Updated</Table.Th>
                <Table.Th ta='right'>Unchanged</Table.Th>
                <Table.Th ta='right'>Skipped</Table.Th>
                <Table.Th ta='right'>Errors</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sheets.map(([name, s]) => (
                <Table.Tr key={name}>
                  <Table.Td fw={500}>{name}</Table.Td>
                  <Table.Td ta='right'>{s.rows}</Table.Td>
                  <Table.Td ta='right'>{s.created}</Table.Td>
                  <Table.Td ta='right'>{s.updated}</Table.Td>
                  <Table.Td ta='right'>{s.unchanged}</Table.Td>
                  <Table.Td ta='right'>{s.skipped}</Table.Td>
                  <Table.Td
                    ta='right'
                    c={s.errors ? 'red' : undefined}
                    fw={s.errors ? 600 : undefined}
                  >
                    {s.errors}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      {result.ignored_sheets.length > 0 && (
        <Text size='xs' c='dimmed' mt='xs'>
          Ignored sheets: {result.ignored_sheets.join(', ')}
        </Text>
      )}
      {sheets.some(([, s]) => s.skipped > 0) && (
        <Text size='xs' c='dimmed' mt='xs'>
          Skipped batches already exist (same batch_ref) and were left
          untouched.
        </Text>
      )}

      {result.errors.length > 0 && (
        <Group justify='flex-end' mt='md'>
          <Button
            size='xs'
            variant='default'
            leftSection={<Copy size={14} />}
            onClick={() => {
              const text = [
                `${result.errors.length} problem(s)${result.file_name ? ` in ${result.file_name}` : ''}`,
                ...result.errors.map(
                  e => `${e.sheet}\trow ${e.row ?? '-'}\t${e.column ?? '-'}\t${e.message}`
                )
              ].join('\n')
              navigator.clipboard
                .writeText(text)
                .then(() =>
                  notifications.show({ color: 'green', title: 'Copied', message: `${result.errors.length} problem(s) copied.` })
                )
                .catch(() =>
                  notifications.show({ color: 'red', title: 'Could not copy', message: 'Select the table and copy it instead.' })
                )
            }}
          >
            Copy all errors
          </Button>
        </Group>
      )}

      {result.errors.length > 0 && (
        <ScrollArea.Autosize mah={420} mt='xs'>
          <Table withTableBorder fz='sm' miw={560}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Sheet</Table.Th>
                <Table.Th>Row</Table.Th>
                <Table.Th>Column</Table.Th>
                <Table.Th>Problem</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {result.errors.slice(0, MAX_ERRORS).map((e, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{e.sheet}</Table.Td>
                  <Table.Td>{e.row ?? '-'}</Table.Td>
                  <Table.Td>
                    <Text size='sm' ff='monospace'>
                      {e.column ?? '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>{e.message}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {result.errors.length > MAX_ERRORS && (
            <Text size='xs' c='dimmed' mt='xs'>
              Showing the first {MAX_ERRORS} of {result.errors.length}.
            </Text>
          )}
        </ScrollArea.Autosize>
      )}
    </Card>
  )
}

// ─── Stored files (for re-import after a DB reset) ─────────────────

function StoredFiles ({ onResult }: { onResult: (r: BulkResult) => void }) {
  const files = useBulkFiles()
  const [target, setTarget] = useState<StoredFile | null>(null)

  return (
    <Card withBorder padding='lg' radius='md'>
      <Title order={4}>Stored files</Title>
      <Text size='sm' c='dimmed' mb='md'>
        Every successful import is kept outside the database. After a reset,
        re-import the latest Setup file, then the latest Operations file.
      </Text>

      {files.isLoading ? (
        <Loader size='sm' />
      ) : !files.data?.length ? (
        <Text size='sm' c='dimmed'>
          No files imported yet.
        </Text>
      ) : (
        <ScrollArea>
          <Table striped fz='sm' miw={640}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Step</Table.Th>
                <Table.Th>File</Table.Th>
                <Table.Th>Imported</Table.Th>
                <Table.Th>By</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.data.map(f => (
                <Table.Tr key={f.id}>
                  <Table.Td>
                    <Badge
                      variant='light'
                      color={f.kind === 'setup' ? 'blue' : 'grape'}
                    >
                      {f.upload_order}.{' '}
                      {f.kind === 'setup' ? 'Setup' : 'Operations'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{f.original_name}</Table.Td>
                  <Table.Td>{formatDateTime(f.uploaded_at)}</Table.Td>
                  <Table.Td>{f.uploaded_by?.name || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify='flex-end' wrap='nowrap'>
                      <Button
                        size='xs'
                        variant='subtle'
                        leftSection={<Download size={14} />}
                        onClick={runDownload(() => downloadStoredFile(f))}
                      >
                        Download
                      </Button>
                      <Button
                        size='xs'
                        variant='light'
                        leftSection={<RotateCcw size={14} />}
                        onClick={() => setTarget(f)}
                      >
                        Re-import
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <ReimportModal
        file={target}
        onClose={() => setTarget(null)}
        onResult={onResult}
      />
    </Card>
  )
}

function ReimportModal ({
  file,
  onClose,
  onResult
}: {
  file: StoredFile | null
  onClose: () => void
  onResult: (r: BulkResult) => void
}) {
  const reimport = useReimportBulkFile()
  const [checked, setChecked] = useState<BulkResult | null>(null)
  const [running, setRunning] = useState<'validate' | 'import' | null>(null)

  const close = () => {
    setChecked(null)
    onClose()
  }

  const run = async (mode: 'validate' | 'import') => {
    if (!file) return
    setRunning(mode)
    try {
      const r = await reimport.mutateAsync({ id: file.id, mode })
      onResult(r)
      if (mode === 'validate') setChecked(r)
      else if (r.committed) {
        notifications.show({
          color: 'green',
          title: 'Re-imported',
          message: file.original_name
        })
        close()
      }
    } catch (err) {
      notifyError(err)
    } finally {
      setRunning(null)
    }
  }

  return (
    <Modal
      opened={!!file}
      onClose={close}
      title='Re-import stored file'
      centered
    >
      {file && (
        <Stack gap='sm'>
          <Text size='sm'>
            <b>{file.original_name}</b> imported{' '}
            {formatDateTime(file.uploaded_at)}.
          </Text>
          <Text size='sm' c='dimmed'>
            Existing rows are updated by code and batches that already exist are
            skipped, so this is safe to run on a database that already has data.
          </Text>
          {checked && (
            <Alert color={checked.ok ? 'green' : 'red'}>
              {checked.ok
                ? 'Check passed - ready to import.'
                : `${checked.errors.length} problem(s) - see the results on the page.`}
            </Alert>
          )}
          <Group justify='flex-end'>
            <Button
              variant='light'
              loading={running === 'validate'}
              onClick={() => run('validate')}
            >
              Check
            </Button>
            <Button
              leftSection={<Upload size={16} />}
              disabled={!checked?.ok || running !== null}
              loading={running === 'import'}
              onClick={() => run('import')}
            >
              Import
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}

// ─── Current counts ────────────────────────────────────────────────

const COUNT_LABELS: Record<string, string> = {
  items: 'Items',
  stock_items: 'Stock items',
  portion_definitions: 'Portions',
  menu_items: 'Menu items',
  recipes: 'Recipe lines',
  production_recipes: 'Production recipes',
  batches: 'Batches',
  standing_menu_slots: 'Standing menu slots'
}

function CountsCard ({ counts }: { counts: Record<string, number> }) {
  return (
    <Card withBorder padding='md' radius='md'>
      <Text size='sm' fw={600} mb='xs'>
        In the database now
      </Text>
      <Group gap='xs'>
        {Object.entries(COUNT_LABELS).map(([key, label]) => (
          <Badge key={key} variant='default' size='lg' fw={500}>
            {label}: {counts[key] ?? 0}
          </Badge>
        ))}
      </Group>
    </Card>
  )
}
