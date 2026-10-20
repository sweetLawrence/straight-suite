import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ArrowLeft, Scissors } from 'lucide-react'
import { z } from 'zod'
import { useBatch, useCreatePortioningEvent } from '@/hooks/useStock'
import { usePortionDefinitions } from '@/hooks/useStock'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { getErrorMessage } from '@/lib/api/client'
import { formatNumber } from '@/lib/utils/format'

const searchSchema = z.object({
  batch_id: z.string().uuid()
})

export const Route = createFileRoute('/_app/stock/portion')({
  validateSearch: searchSchema,
  component: PortionPage
})

function PortionPage () {
  const { batch_id } = Route.useSearch()
  const navigate = useNavigate()
  const batch = useBatch(batch_id)
  const createEvent = useCreatePortioningEvent()

  const [portionDefId, setPortionDefId] = useState<string | null>(null)
  const [actualPortions, setActualPortions] = useState<number>(0)
  const [costPerPortion, setCostPerPortion] = useState<number>(0)

  // Portion definitions for this stock item
  const defs = usePortionDefinitions(batch.data?.stock_item?.item_id)

  if (batch.isLoading) return <Loader />
  if (batch.error || !batch.data)
    return (
      <EmptyState
        title='Batch not found'
        description='This batch may have been removed.'
      />
    )

  const b = batch.data

  if (b.total_portions != null) {
    return (
      <>
        <Button
          variant='subtle'
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate({ to: '/stock/batches' })}
          mb='sm'
        >
          Back to batches
        </Button>
        <Alert color='blue' title='Already portioned'>
          This batch was already portioned into {b.total_portions} portions.
        </Alert>
      </>
    )
  }

  const handleSubmit = async () => {
    if (!portionDefId) {
      notifications.show({
        color: 'red',
        title: 'Missing info',
        message: 'Pick a portion definition'
      })
      return
    }
    if (actualPortions <= 0) {
      notifications.show({
        color: 'red',
        title: 'Missing info',
        message: 'Portions must be greater than 0'
      })
      return
    }
    try {
      await createEvent.mutateAsync({
        batch_id: b.id,
        portion_definition_id: portionDefId,
        actual_portions: actualPortions,
        cost_per_portion: costPerPortion
      })
      notifications.show({
        color: 'green',
        title: 'Batch portioned',
        message: `${actualPortions} portions created.`
      })
      navigate({
        to: '/stock/batches/$id',
        params: { id: b.id }
      })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const defOptions =
    defs.data?.data.map(d => ({
      value: d.id,
      label: `${d.portion_name} (${d.portion_size} ${d.portion_unit_id})`
    })) || []

  return (
    <>
      <Button
        variant='subtle'
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate({ to: '/stock/batches' })}
        mb='sm'
      >
        Back to batches
      </Button>

      <PageHeader
        title={`Portion ${b.batch_ref}`}
        subtitle={`${b.stock_item?.item?.name} · ${formatNumber(
          b.received_qty
        )} ${b.received_unit?.code}`}
      />

      <Card withBorder padding='md' radius='md'>
        <Stack>
          <Select
            label='Portion Definition'
            placeholder='Pick a portion size'
            required
            searchable
            data={defOptions}
            value={portionDefId}
            onChange={setPortionDefId}
          />
          <Group grow>
            <NumberInput
              label='Actual Portions'
              placeholder='e.g. 330'
              min={1}
              required
              value={actualPortions}
              onChange={v => setActualPortions(Number(v) || 0)}
            />
            <NumberInput
              label='Cost per Portion (KES)'
              placeholder='e.g. 60.61'
              min={0}
              decimalScale={4}
              required
              value={costPerPortion}
              onChange={v => setCostPerPortion(Number(v) || 0)}
            />
          </Group>
          <Group justify='flex-end' mt='md'>
            <Button
              leftSection={<Scissors size={16} />}
              onClick={handleSubmit}
              loading={createEvent.isPending}
            >
              Portion Batch
            </Button>
          </Group>
        </Stack>
      </Card>
    </>
  )
}
