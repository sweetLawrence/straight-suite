
import { useState } from 'react'
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Plus, Trash2 } from 'lucide-react'
import { useCreateMenuItem } from '@/hooks/useMenu'
import { useItems } from '@/hooks/useItems'
import { useUnits } from '@/hooks/useCore'
import { getErrorMessage } from '@/lib/api/client'

interface Props {
  opened: boolean
  onClose: () => void
}

interface IngredientRow {
  stock_item_id: string
  quantity: number
  unit_id: string
  portion_definition_id?: string | null
}

export function CreateMenuItemModal ({ opened, onClose }: Props) {
  const create = useCreateMenuItem()
  const stockItems = useItems({ limit: 500, status: 'active' })
  const units = useUnits()

  const [ingredients, setIngredients] = useState<IngredientRow[]>([])

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      display_name: '',
      price: 0,
      category: '',
      station: 'kitchen' as 'kitchen' | 'bar' | 'both'
    },
    validate: {
      code: v => (v.trim() ? null : 'Required'),
      name: v => (v.trim() ? null : 'Required'),
      display_name: v => (v.trim() ? null : 'Required'),
      price: v => (v >= 0 ? null : 'Must be ≥ 0')
    }
  })

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { stock_item_id: '', quantity: 1, unit_id: '' }
    ])
  }

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx))
  }

  const updateIngredient = (idx: number, patch: Partial<IngredientRow>) => {
    setIngredients(
      ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing))
    )
  }

  const handleSubmit = async (values: typeof form.values) => {
    // Validate ingredients
    const badIng = ingredients.find(
      ing => !ing.stock_item_id || !ing.unit_id || ing.quantity <= 0
    )
    if (badIng) {
      notifications.show({
        color: 'red',
        title: 'Incomplete ingredient',
        message: 'Each ingredient needs a stock item, quantity, and unit.'
      })
      return
    }

    try {
      const m = await create.mutateAsync({
        code: values.code.trim().toUpperCase().replace(/\s+/g, '_'),
        name: values.name.trim(),
        display_name: values.display_name.trim(),
        price: values.price,
        category: values.category || undefined,
        station: values.station,
        ingredients:
          ingredients.length > 0
            ? ingredients.map(ing => ({
                stock_item_id: ing.stock_item_id,
                quantity: ing.quantity,
                unit_id: ing.unit_id,
                portion_definition_id: ing.portion_definition_id || null
              }))
            : undefined
      })
      notifications.show({
        color: 'green',
        title: 'Menu item created',
        message: ingredients.length
          ? `With ${ingredients.length} ingredient${
              ingredients.length > 1 ? 's' : ''
            }.`
          : ''
      })
      form.reset()
      setIngredients([])
      onClose()
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const stockItemOptions =
    stockItems.data?.data
      .filter(i => i.item_type !== 'menu' && i.item_type !== 'service')
      .map(i => ({
        value: i.id,
        label: `${i.code} - ${i.name}`
      })) || []

  const unitOptions =
    units.data?.data.map(u => ({
      value: u.id,
      label: `${u.name} (${u.code})`
    })) || []

  return (
    <Modal opened={opened} onClose={onClose} title='Create Menu Item' size='xl'>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size='xs' c='dimmed'>
            Fill in the dish and add its ingredients. The catalog entry is
            created automatically.
          </Text>

          <Group grow>
            <TextInput
              label='Code'
              placeholder='e.g. BEEF_1KG'
              description='Internal reference'
              required
              {...form.getInputProps('code')}
            />
            <TextInput
              label='Name'
              placeholder='e.g. Beef 1kg'
              description='For your records'
              required
              {...form.getInputProps('name')}
            />
          </Group>

          <Divider label='Menu details' labelPosition='left' />

          <TextInput
            label='Display Name'
            placeholder='What customers see'
            required
            {...form.getInputProps('display_name')}
          />

          <Group grow>
            <NumberInput
              label='Price (KES)'
              min={0}
              decimalScale={2}
              required
              {...form.getInputProps('price')}
            />
            <TextInput
              label='Category'
              placeholder='food, drink, dessert'
              {...form.getInputProps('category')}
            />
            <Select
              label='Station'
              data={[
                { value: 'kitchen', label: 'Kitchen' },
                { value: 'bar', label: 'Bar' },
                { value: 'both', label: 'Both' }
              ]}
              {...form.getInputProps('station')}
            />
          </Group>

          <Divider label='Ingredients' labelPosition='left' mt='sm' />

          {ingredients.length === 0 ? (
            <Text size='xs' c='dimmed'>
              No ingredients yet. Add what this dish consumes from the store.
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '45%' }}>Stock Item</Table.Th>
                  <Table.Th style={{ width: '15%' }}>Quantity</Table.Th>
                  <Table.Th style={{ width: '30%' }}>Unit</Table.Th>
                  <Table.Th style={{ width: '10%' }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ingredients.map((ing, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <Select
                        placeholder='Pick a stock item'
                        searchable
                        data={stockItemOptions}
                        value={ing.stock_item_id}
                        onChange={v =>
                          updateIngredient(idx, { stock_item_id: v || '' })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        min={0}
                        decimalScale={3}
                        value={ing.quantity}
                        onChange={v =>
                          updateIngredient(idx, { quantity: Number(v) || 0 })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <Select
                        placeholder='Unit'
                        data={unitOptions}
                        value={ing.unit_id}
                        onChange={v =>
                          updateIngredient(idx, { unit_id: v || '' })
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color='red'
                        variant='subtle'
                        onClick={() => removeIngredient(idx)}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          <Button
            variant='light'
            size='xs'
            leftSection={<Plus size={14} />}
            onClick={addIngredient}
            style={{ alignSelf: 'flex-start' }}
          >
            Add ingredient
          </Button>

          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' loading={create.isPending}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
