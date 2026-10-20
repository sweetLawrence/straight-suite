import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Collapse,
  Group,
  Loader,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage } from '@/lib/api/client'
import { useCreateProducts, useProductOptions } from '@/hooks/useBulkImport'
import { ProductInput, ProductKind, RowError } from '@/lib/api/bulkImport'

export const Route = createFileRoute('/_app/menu/new-product')({
  component: NewProductPage
})

const KINDS: {
  value: ProductKind
  label: string
  help: string
  unit: string
}[] = [
  {
    value: 'produced',
    label: 'Made in kitchen',
    help: 'The kitchen makes it from ingredients (chapati, doughnut). Sold by the piece.',
    unit: 'piece'
  },
  {
    value: 'packaged',
    label: 'Bought ready',
    help: 'Bought and sold as-is (soda, beer, juice packet).',
    unit: 'bottle'
  },
  {
    value: 'portioned',
    label: 'Portioned',
    help: 'Received in bulk and cut into portions (beef, fish). Sold per portion.',
    unit: 'kg'
  },
  {
    value: 'ingredient',
    label: 'Ingredient only',
    help: 'Kept in stock and used in cooking, not sold (yeast, spices).',
    unit: 'kg'
  }
]

interface Ingredient {
  code: string | null
  qty: number | string
  unit: string | null
}

const emptyForm = {
  code: '',
  name: '',
  unit: 'piece',
  properties: [] as string[],
  price: '' as number | string,
  category: '',
  station: 'kitchen',
  store_type: null as string | null,
  reorder_level: '' as number | string,
  portion_name: '',
  portion_size: '' as number | string,
  portion_unit: 'g'
}

const num = (v: number | string) => (v === '' || v === null ? null : Number(v))

function NewProductPage () {
  const options = useProductOptions()
  const create = useCreateProducts()
  const [kind, setKind] = useState<ProductKind>('produced')
  const [form, setForm] = useState(emptyForm)
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { code: null, qty: '', unit: null }
  ])
  const [errors, setErrors] = useState<RowError[]>([])
  const [advanced, setAdvanced] = useState(false)

  const set = <K extends keyof typeof emptyForm>(
    key: K,
    value: typeof emptyForm[K]
  ) => setForm(f => ({ ...f, [key]: value }))

  const units = useMemo(
    () =>
      (options.data?.units ?? []).map(u => ({
        value: u.code,
        label: `${u.code} - ${u.name}`
      })),
    [options.data]
  )
  const properties = useMemo(
    () =>
      (options.data?.properties ?? []).map(p => ({
        value: p.code,
        label: `${p.code} - ${p.name}`
      })),
    [options.data]
  )
  const itemOptions = useMemo(
    () =>
      (options.data?.items ?? []).map(i => ({
        value: i.code,
        label: `${i.code} - ${i.name}`
      })),
    [options.data]
  )
  const itemUnit = (code: string | null) =>
    options.data?.items.find(i => i.code === code)?.unit ?? null

  const kindInfo = KINDS.find(k => k.value === kind)!
  const sold = kind !== 'ingredient'
  const code = form.code.trim().toUpperCase()
  const propsLabel = form.properties.length
    ? form.properties.join(', ')
    : 'all properties'

  const pickKind = (k: ProductKind) => {
    setKind(k)
    set('unit', KINDS.find(x => x.value === k)!.unit)
    setErrors([])
  }

  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    setIngredients(list =>
      list.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    )

  const buildProduct = (): ProductInput => ({
    code,
    name: form.name.trim(),
    kind,
    unit: form.unit,
    properties: form.properties.length ? form.properties.join(', ') : null,
    price: sold ? num(form.price) : null,
    category: sold && form.category.trim() ? form.category.trim() : null,
    station: sold ? form.station : null,
    store_type: form.store_type,
    reorder_level: num(form.reorder_level),
    ingredients:
      kind === 'produced'
        ? ingredients
            .filter(x => x.code && x.qty !== '')
            .map(x =>
              `${x.code} ${x.qty} ${x.unit || itemUnit(x.code) || ''}`.trim()
            )
            .join('; ') || null
        : null,
    portion_name:
      kind === 'portioned' ? form.portion_name.trim() || null : null,
    portion_size: kind === 'portioned' ? num(form.portion_size) : null,
    portion_unit: kind === 'portioned' ? form.portion_unit : null
  })

  const submit = async () => {
    setErrors([])
    try {
      const r = await create.mutateAsync({
        products: [buildProduct()],
        mode: 'import'
      })
      if (r.committed) {
        notifications.show({
          color: 'green',
          title: `${form.name || code} created`,
          message: sold
            ? `On the menu at ${propsLabel}.`
            : `Stocked at ${propsLabel}.`
        })
        setForm({ ...emptyForm, unit: kindInfo.unit })
        setIngredients([{ code: null, qty: '', unit: null }])
      } else {
        setErrors(r.errors)
      }
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  if (options.isLoading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }

  const ready =
    code && form.name.trim() && form.unit && (!sold || form.price !== '')

  return (
    <>
      <PageHeader
        title='New Product'
        subtitle='One form creates the item, its stock at each property, the menu entry and its recipe.'
      />

      <Stack gap='md' maw={880}>
        <Card withBorder padding='lg' radius='md'>
          <Text size='sm' fw={600} mb={6}>
            What kind of product is it?
          </Text>
          <SegmentedControl
            fullWidth
            value={kind}
            onChange={v => pickKind(v as ProductKind)}
            data={KINDS.map(k => ({ value: k.value, label: k.label }))}
          />
          <Text size='sm' c='dimmed' mt='xs'>
            {kindInfo.help}
          </Text>
        </Card>

        <Card withBorder padding='lg' radius='md'>
          <Title order={5} mb='sm'>
            Details
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
            <TextInput
              label='Name'
              placeholder='e.g. Doughnut'
              required
              value={form.name}
              onChange={e => {
                const name = e.currentTarget.value
                const auto = form.code === '' || form.code === toCode(form.name)
                setForm(f => ({
                  ...f,
                  name,
                  code: auto ? toCode(name) : f.code
                }))
              }}
            />
            <TextInput
              label='Code'
              description={
                sold
                  ? `Menu item gets ${code || 'CODE'}_MENU automatically`
                  : 'Unique stock code'
              }
              placeholder='DOUGHNUT'
              required
              value={form.code}
              onChange={e =>
                set(
                  'code',
                  e.currentTarget.value.toUpperCase().replace(/\s+/g, '_')
                )
              }
            />
            <Select
              label='Stock unit'
              description='How it is counted in the store'
              data={units}
              value={form.unit}
              onChange={v => set('unit', v || '')}
              searchable
              required
            />
            <MultiSelect
              label='Properties'
              description='Leave empty for all properties'
              placeholder='All properties'
              data={properties}
              value={form.properties}
              onChange={v => set('properties', v)}
              clearable
            />
            {sold && (
              <>
                <NumberInput
                  label={
                    kind === 'portioned' ? 'Price per portion' : 'Menu price'
                  }
                  required
                  min={0}
                  thousandSeparator=','
                  value={form.price}
                  onChange={v => set('price', v)}
                />
                <Select
                  label='Station'
                  data={[
                    { value: 'kitchen', label: 'Kitchen' },
                    { value: 'bar', label: 'Bar' },
                    { value: 'both', label: 'Both' }
                  ]}
                  value={form.station}
                  onChange={v => set('station', v || 'kitchen')}
                />
              </>
            )}
          </SimpleGrid>
        </Card>

        {kind === 'portioned' && (
          <Card withBorder padding='lg' radius='md'>
            <Title order={5} mb='sm'>
              Portion
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='md'>
              <TextInput
                label='Portion name'
                placeholder='150g serving'
                required
                value={form.portion_name}
                onChange={e => set('portion_name', e.currentTarget.value)}
              />
              <NumberInput
                label='Portion size'
                required
                min={0}
                value={form.portion_size}
                onChange={v => set('portion_size', v)}
              />
              <Select
                label='Portion unit'
                data={units}
                value={form.portion_unit}
                onChange={v => set('portion_unit', v || 'g')}
              />
            </SimpleGrid>
          </Card>
        )}

        {kind === 'produced' && (
          <Card withBorder padding='lg' radius='md'>
            <Title order={5}>Ingredients per piece</Title>
            <Text size='sm' c='dimmed' mb='sm'>
              What the kitchen uses to make one. Production compares actual
              output against this. Optional.
            </Text>
            <Stack gap='xs'>
              {ingredients.map((row, i) => (
                <Group key={i} gap='xs' align='flex-end' wrap='nowrap'>
                  <Select
                    style={{ flex: 3 }}
                    label={i === 0 ? 'Ingredient' : undefined}
                    placeholder='Search…'
                    data={itemOptions}
                    value={row.code}
                    onChange={v =>
                      setIngredient(i, { code: v, unit: itemUnit(v) })
                    }
                    searchable
                  />
                  <NumberInput
                    style={{ flex: 1 }}
                    label={i === 0 ? 'Qty' : undefined}
                    min={0}
                    decimalScale={4}
                    value={row.qty}
                    onChange={v => setIngredient(i, { qty: v })}
                  />
                  <Select
                    style={{ flex: 1 }}
                    label={i === 0 ? 'Unit' : undefined}
                    data={units.map(u => u.value)}
                    value={row.unit}
                    onChange={v => setIngredient(i, { unit: v })}
                  />
                  <ActionIcon
                    variant='subtle'
                    color='red'
                    size='lg'
                    aria-label='Remove ingredient'
                    onClick={() =>
                      setIngredients(list =>
                        list.length > 1
                          ? list.filter((_, idx) => idx !== i)
                          : [{ code: null, qty: '', unit: null }]
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Group>
                <Button
                  variant='subtle'
                  size='xs'
                  leftSection={<Plus size={14} />}
                  onClick={() =>
                    setIngredients(list => [
                      ...list,
                      { code: null, qty: '', unit: null }
                    ])
                  }
                >
                  Add ingredient
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        <Card withBorder padding='lg' radius='md'>
          <Group>
            <Button
              variant='subtle'
              size='xs'
              px={0}
              leftSection={
                advanced ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              }
              onClick={() => setAdvanced(a => !a)}
            >
              More options
            </Button>
          </Group>
          <Collapse expanded={advanced}>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='md' mt='sm'>
              {sold && (
                <TextInput
                  label='Menu category'
                  placeholder={form.station === 'bar' ? 'drink' : 'food'}
                  value={form.category}
                  onChange={e => set('category', e.currentTarget.value)}
                />
              )}
              <Select
                label='Store'
                placeholder='Default for this kind'
                data={[
                  { value: 'food_store', label: 'Food store' },
                  { value: 'bar_store', label: 'Bar store' },
                  { value: 'kitchen', label: 'Kitchen' }
                ]}
                value={form.store_type}
                onChange={v => set('store_type', v)}
                clearable
              />
              <NumberInput
                label='Reorder level'
                min={0}
                value={form.reorder_level}
                onChange={v => set('reorder_level', v)}
              />
            </SimpleGrid>
          </Collapse>
        </Card>

        {errors.length > 0 && (
          <Alert
            color='red'
            icon={<AlertTriangle size={18} />}
            title='Nothing was saved'
          >
            <Stack gap={4}>
              {errors.map((e, i) => (
                <Text key={i} size='sm'>
                  {e.column ? <b>{e.column}: </b> : null}
                  {e.message}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        <Group justify='space-between'>
          <Text size='sm' c='dimmed'>
            {code
              ? summary(code, kind, propsLabel)
              : 'Fill in the name to see what will be created.'}
          </Text>
          <Button onClick={submit} loading={create.isPending} disabled={!ready}>
            Create product
          </Button>
        </Group>
      </Stack>
    </>
  )
}

function toCode (name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)
}

function summary (code: string, kind: ProductKind, props: string) {
  const parts = [`stock item ${code} at ${props}`]
  if (kind === 'portioned') parts.push('a portion size')
  if (kind === 'produced') parts.push('its production recipe')
  if (kind !== 'ingredient')
    parts.push(`menu item ${code}_MENU with its recipe`)
  return `Creates ${parts.join(', ')}.`
}
