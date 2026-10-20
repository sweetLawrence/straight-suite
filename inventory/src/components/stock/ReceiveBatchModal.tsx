import { Link } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useStockItems, useCreateBatch } from '@/hooks/useStock'
import { useUnits } from '@/hooks/useCore'
import { SupplierPicker } from '@/components/purchasing/SupplierPicker'
import { getErrorMessage } from '@/lib/api/client'
import { formatPacks } from '@/lib/utils/format'

interface Props {
  opened: boolean
  onClose: () => void
}

type CountMode = 'packs' | 'pieces'

export function ReceiveBatchModal ({ opened, onClose }: Props) {
  const stockItems = useStockItems({ limit: 200 })
  const units = useUnits()
  const createBatch = useCreateBatch()

  const form = useForm({
    initialValues: {
      stock_item_id: '',
      count_mode: 'pieces' as CountMode,
      // pieces mode
      received_qty: 0,
      received_unit_id: '',
      // packs mode
      packs: 0,
      pack_size: 0,
      loose: 0,
      total_cost: 0,
      purchase_ref: '',
      supplier_id: null as string | null,
      expiry_date: null as Date | null
    },
    validate: {
      stock_item_id: v => (v ? null : 'Required'),
      received_qty: (v, values) =>
        values.count_mode === 'pieces' && !(v > 0) ? 'Must be > 0' : null,
      received_unit_id: (v, values) =>
        values.count_mode === 'pieces' && !v ? 'Required' : null,
      packs: (v, values) =>
        values.count_mode === 'packs' && !(v > 0) && !(values.loose > 0)
          ? 'Enter packs or loose pieces'
          : null,
      pack_size: (v, values) =>
        values.count_mode === 'packs' && !(v > 0) ? 'Must be > 0' : null,
      total_cost: v => (v >= 0 ? null : 'Must be ≥ 0')
    }
  })

  const selected = useMemo(
    () => stockItems.data?.data.find(s => s.id === form.values.stock_item_id),
    [stockItems.data, form.values.stock_item_id]
  )
  const packLabel = selected?.pack_label || 'packet'
  const counted =
    selected?.dispatch_mode === 'by_count' || !!selected?.pack_size

  // The item's own unit (piece, bottle…) - packs are always received in it
  const baseUnitId =
    selected?.item?.base_unit?.id ||
    units.data?.data.find(u => u.code === 'piece')?.id ||
    ''
  const baseUnitName = selected?.item?.base_unit?.name?.toLowerCase() || 'piece'

  // When the item changes, default to packs if it has a pack size
  useEffect(() => {
    if (!selected) return
    form.setValues({
      count_mode: selected.pack_size ? 'packs' : 'pieces',
      pack_size: selected.pack_size || 0,
      packs: 0,
      loose: 0,
      received_qty: 0,
      received_unit_id:
        selected.item?.base_unit?.id || form.values.received_unit_id
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  const v = form.values
  const packTotal =
    (Number(v.packs) || 0) * (Number(v.pack_size) || 0) + (Number(v.loose) || 0)
  const totalPieces =
    v.count_mode === 'packs' ? packTotal : Number(v.received_qty) || 0
  const breakdown =
    v.count_mode === 'pieces' && selected?.pack_size
      ? formatPacks(totalPieces, selected.pack_size, packLabel)
      : null

  const close = () => {
    form.reset()
    onClose()
  }

  const handleSubmit = async (values: typeof form.values) => {
    const inPacks = values.count_mode === 'packs'
    try {
      await createBatch.mutateAsync({
        stock_item_id: values.stock_item_id,
        received_qty: inPacks ? packTotal : values.received_qty,
        received_unit_id: inPacks ? baseUnitId : values.received_unit_id,
        total_cost: values.total_cost,
        purchase_ref: values.purchase_ref || undefined,
        supplier_id: values.supplier_id || undefined,
        expiry_date: values.expiry_date
          ? values.expiry_date.toISOString().slice(0, 10)
          : undefined,
        pack_size: inPacks ? Number(values.pack_size) : undefined,
        packs_received: inPacks ? Number(values.packs) || 0 : undefined
      })
      notifications.show({
        color: 'green',
        title: 'Batch received',
        message: `${totalPieces} ${baseUnitName}${
          totalPieces === 1 ? '' : 's'
        } added to the ledger.`
      })
      close()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const stockItemOptions =
    stockItems.data?.data.map(s => ({
      value: s.id,
      label: `${s.item?.name || s.item?.code || 'Item'}${
        s.pack_size ? ` · ${s.pack_size}/${s.pack_label || 'pack'}` : ''
      }`
    })) || []
  const unitOptions =
    units.data?.data.map(u => ({ value: u.id, label: u.name })) || []

  return (
    <Modal opened={opened} onClose={close} title='Receive Batch' size='md'>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Alert color='blue' variant='light' p='xs'>
            Ordered this from a supplier? Receive it from the <Link to='/purchase-orders' onClick={onClose} style={{ color: '#1864AB', fontWeight: 600 }}>purchase order</Link> so
            the batch is linked to it. Use this form for walk-in or unplanned deliveries.
          </Alert>
          <Select
            label='Stock Item'
            placeholder='Select item'
            searchable
            data={stockItemOptions}
            required
            {...form.getInputProps('stock_item_id')}
          />

          {counted && (
            <Stack gap={4}>
              <Text size='sm' fw={500}>
                Counted in
              </Text>
              <SegmentedControl
                fullWidth
                data={[
                  { value: 'packs', label: `${capitalize(packLabel)}s` },
                  { value: 'pieces', label: `${capitalize(baseUnitName)}s` }
                ]}
                {...form.getInputProps('count_mode')}
              />
            </Stack>
          )}

          {v.count_mode === 'packs' ? (
            <>
              <Group grow align='flex-start'>
                <NumberInput
                  label={`Full ${packLabel}s`}
                  placeholder='e.g. 10'
                  min={0}
                  allowDecimal={false}
                  {...form.getInputProps('packs')}
                />
                <NumberInput
                  label={`${capitalize(baseUnitName)}s per ${packLabel}`}
                  min={1}
                  allowDecimal={false}
                  {...form.getInputProps('pack_size')}
                />
              </Group>
              <NumberInput
                label={`Loose ${baseUnitName}s`}
                description={`From an opened or part ${packLabel}`}
                min={0}
                allowDecimal={false}
                {...form.getInputProps('loose')}
              />
              <Alert color='blue' variant='light' py='xs'>
                <Text size='sm'>
                  Total: <b>{packTotal}</b> {baseUnitName}
                  {packTotal === 1 ? '' : 's'}
                  {v.pack_size &&
                  selected?.pack_size &&
                  Number(v.pack_size) !== selected.pack_size
                    ? ` · this delivery packs ${v.pack_size}, usual is ${selected.pack_size}`
                    : ''}
                </Text>
              </Alert>
            </>
          ) : (
            <Group grow align='flex-start'>
              <NumberInput
                label='Quantity'
                placeholder='e.g. 100'
                min={0}
                decimalScale={3}
                required
                description={breakdown ? `= ${breakdown}` : undefined}
                {...form.getInputProps('received_qty')}
              />
              <Select
                label='Unit'
                placeholder='Unit'
                data={unitOptions}
                required
                {...form.getInputProps('received_unit_id')}
              />
            </Group>
          )}

          <NumberInput
            label='Total Cost (KES)'
            placeholder='e.g. 5000'
            min={0}
            decimalScale={2}
            thousandSeparator=','
            required
            description={
              totalPieces > 0 && v.total_cost > 0
                ? `≈ KES ${(v.total_cost / totalPieces).toFixed(
                    2
                  )} per ${baseUnitName}`
                : undefined
            }
            {...form.getInputProps('total_cost')}
          />
          <SupplierPicker
            label='Bought from (optional)'
            value={form.values.supplier_id}
            onChange={id => form.setFieldValue('supplier_id', id)}
          />
          <TextInput
            label='Purchase Ref'
            placeholder='e.g. INV-2026-001'
            {...form.getInputProps('purchase_ref')}
          />
          <DateInput
            label='Expiry Date (optional)'
            placeholder='Pick date'
            valueFormat='YYYY-MM-DD'
            clearable
            {...form.getInputProps('expiry_date')}
          />

          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={close}>
              Cancel
            </Button>
            <Button type='submit' loading={createBatch.isPending}>
              Receive
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
