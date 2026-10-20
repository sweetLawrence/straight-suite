// import { useEffect } from 'react'
// import { Button, Group, Modal, NumberInput, Select, Stack } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import { useCreateStockItem, useUpdateStockItem } from '@/hooks/useStock'
// import { useItems } from '@/hooks/useItems'
// import { getErrorMessage } from '@/lib/api/client'
// import { StockItem } from '@/lib/api/stock'

// interface Props {
//   opened: boolean
//   onClose: () => void
//   stockItem: StockItem | null
// }

// export function StockItemFormModal ({ opened, onClose, stockItem }: Props) {
//   const isEdit = !!stockItem
//   const create = useCreateStockItem()
//   const update = useUpdateStockItem()

//   // Only stock-type items (not menu / service)
//   const items = useItems({ limit: 500, status: 'active' })

//   const form = useForm({
//     initialValues: {
//       item_id: '',
//       stock_model: 'portioned' as
//         | 'portioned'
//         | 'bulk'
//         | 'packaged'
//         | 'produced',
//       store_type: 'food_store' as 'food_store' | 'bar_store' | 'kitchen',
//       reorder_level: 0,
//       status: 'active' as 'active' | 'inactive' | 'discontinued'
//     },
//     validate: {
//       item_id: v => (v ? null : 'Required'),
//       stock_model: v => (v ? null : 'Required'),
//       store_type: v => (v ? null : 'Required')
//     }
//   })

//   useEffect(() => {
//     if (opened && stockItem) {
//       form.setValues({
//         item_id: stockItem.item_id,
//         stock_model: stockItem.stock_model as any,
//         store_type: stockItem.store_type as any,
//         reorder_level: stockItem.reorder_level
//           ? parseFloat(stockItem.reorder_level)
//           : 0,
//         status: stockItem.status as any
//       })
//     } else if (opened && !stockItem) {
//       form.reset()
//     }
//   }, [opened, stockItem])

//   const handleSubmit = async (values: typeof form.values) => {
//     try {
//       if (isEdit) {
//         await update.mutateAsync({
//           id: stockItem!.id,
//           data: {
//             stock_model: values.stock_model,
//             store_type: values.store_type,
//             reorder_level: values.reorder_level || null,
//             status: values.status
//           }
//         })
//         notifications.show({
//           color: 'green',
//           title: 'Stock item updated',
//           message: ''
//         })
//       } else {
//         await create.mutateAsync({
//           item_id: values.item_id,
//           stock_model: values.stock_model,
//           store_type: values.store_type,
//           reorder_level: values.reorder_level || null
//         })
//         notifications.show({
//           color: 'green',
//           title: 'Stock item enabled',
//           message: ''
//         })
//       }
//       form.reset()
//       onClose()
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err)
//       })
//     }
//   }

//   const itemOptions = (items.data?.data || [])
//     .filter(i => i.item_type !== 'menu' && i.item_type !== 'service')
//     .map(i => ({
//       value: i.id,
//       label: `${i.code} - ${i.name} (${i.item_type})`
//     }))

//   return (
//     <Modal
//       opened={opened}
//       onClose={onClose}
//       title={isEdit ? 'Edit Stock Item' : 'Enable Item at Property'}
//       size='md'
//     >
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack>
//           <Select
//             label='Master Item'
//             placeholder='Search catalog...'
//             searchable
//             required
//             disabled={isEdit}
//             data={itemOptions}
//             {...form.getInputProps('item_id')}
//           />
//           <Select
//             label='Stock Model'
//             data={['portioned', 'bulk', 'packaged', 'produced']}
//             required
//             {...form.getInputProps('stock_model')}
//           />
//           <Select
//             label='Store Type'
//             data={['food_store', 'bar_store', 'kitchen']}
//             required
//             {...form.getInputProps('store_type')}
//           />
//           <NumberInput
//             label='Reorder Level'
//             placeholder='Optional'
//             min={0}
//             decimalScale={3}
//             {...form.getInputProps('reorder_level')}
//           />
//           {isEdit && (
//             <Select
//               label='Status'
//               data={['active', 'inactive', 'discontinued']}
//               {...form.getInputProps('status')}
//             />
//           )}
//           <Group justify='flex-end' mt='md'>
//             <Button variant='default' onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               type='submit'
//               loading={create.isPending || update.isPending}
//             >
//               {isEdit ? 'Save' : 'Enable'}
//             </Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   )
// }







































import { useEffect } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateStockItem, useUpdateStockItem } from '@/hooks/useStock';
import { useUnits } from '@/hooks/useCore';
import { getErrorMessage } from '@/lib/api/client';
import { StockItem } from '@/lib/api/stock';

type DispatchMode = 'by_weight' | 'by_portion' | 'by_count';

interface Props {
  opened: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
}

// Stock is held in pieces; a pack size only applies to counted items.
const packFields = (v: { dispatch_mode: string; pack_size: number | string; pack_label: string }) => {
  const size = Number(v.pack_size) || 0;
  return v.dispatch_mode === 'by_count' && size > 0
    ? { pack_size: size, pack_label: v.pack_label || 'packet' }
    : { pack_size: null, pack_label: null };
};

export function StockItemFormModal({ opened, onClose, stockItem }: Props) {
  const isEdit = !!stockItem;
  const create = useCreateStockItem();
  const update = useUpdateStockItem();
  const units = useUnits();

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      base_unit_id: '' as string | null,
      dispatch_mode: 'by_weight' as DispatchMode,
      made_in_house: false,
      store_type: 'food_store' as 'food_store' | 'bar_store' | 'kitchen',
      reorder_level: 0,
      pack_size: 0,
      pack_label: 'packet',
      barcode: '',

      // portion
      portion_name: '',
      portion_size: 0,
      portion_unit_id: '',
      portion_sell_price: 0,

      // edit-only
      status: 'active' as 'active' | 'inactive' | 'discontinued',
    },
    validate: {
      code: (v) => (isEdit || v.trim() ? null : 'Required'),
      name: (v) => (isEdit || v.trim() ? null : 'Required'),
      // Portion details are only asked for when adding; after that they live in Portion Definitions
      portion_name: (v, values) =>
        !isEdit && values.dispatch_mode === 'by_portion' && !v.trim() ? 'Required' : null,
      portion_size: (v, values) =>
        !isEdit && values.dispatch_mode === 'by_portion' && !(v > 0) ? 'Must be more than 0' : null,
      portion_unit_id: (v, values) =>
        !isEdit && values.dispatch_mode === 'by_portion' && !v ? 'Required' : null,
      portion_sell_price: (v, values) =>
        !isEdit && values.dispatch_mode === 'by_portion' && !(v > 0) ? 'Must be more than 0' : null,
    },
  });

  useEffect(() => {
    if (opened && stockItem) {
      form.setValues({
        code: stockItem.item?.code || '',
        name: stockItem.item?.name || '',
        base_unit_id: stockItem.item?.base_unit?.id || null,
        dispatch_mode: (stockItem.dispatch_mode || 'by_weight') as DispatchMode,
        made_in_house: stockItem.stock_model === 'produced',
        store_type: stockItem.store_type as any,
        reorder_level: stockItem.reorder_level
          ? parseFloat(stockItem.reorder_level)
          : 0,
        pack_size: stockItem.pack_size ?? 0,
        pack_label: stockItem.pack_label || 'packet',
        barcode: (stockItem as { barcode?: string | null }).barcode || '',
        portion_name: '',
        portion_size: 0,
        portion_unit_id: '',
        portion_sell_price: 0,
        status: stockItem.status as any,
      });
    } else if (opened && !stockItem) {
      form.reset();
    }
  }, [opened, stockItem]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Derive stock_model and item_type from the mode + made_in_house
      let stock_model: 'portioned' | 'bulk' | 'packaged' | 'produced';
      let item_type:
        | 'stock_portioned'
        | 'stock_bulk'
        | 'stock_packaged'
        | 'stock_produced';

      if (values.dispatch_mode === 'by_weight') {
        stock_model = 'bulk';
        item_type = 'stock_bulk';
      } else if (values.dispatch_mode === 'by_portion') {
        if (values.made_in_house) {
          stock_model = 'produced';
          item_type = 'stock_produced';
        } else {
          stock_model = 'portioned';
          item_type = 'stock_portioned';
        }
      } else {
        stock_model = 'packaged';
        item_type = 'stock_packaged';
      }

      if (isEdit) {
        await update.mutateAsync({
          id: stockItem!.id,
          data: {
            stock_model,
            store_type: values.store_type,
            dispatch_mode: values.dispatch_mode,
            reorder_level: values.reorder_level || null,
            status: values.status,
            barcode: values.barcode.trim() || null,
            ...packFields(values),
          },
        });
        notifications.show({
          color: 'green',
          title: 'Stock item updated',
          message: '',
        });
      } else {
        await create.mutateAsync({
          code: values.code.trim().toUpperCase().replace(/\s+/g, '_'),
          name: values.name.trim(),
          item_type,
          base_unit_id: values.base_unit_id,
          stock_model,
          store_type: values.store_type,
          dispatch_mode: values.dispatch_mode,
          reorder_level: values.reorder_level || null,
          ...packFields(values),
          portion:
            values.dispatch_mode === 'by_portion'
              ? {
                  name: values.portion_name.trim(),
                  size: values.portion_size,
                  unit_id: values.portion_unit_id,
                  sell_price: values.portion_sell_price,
                }
              : null,
        });
        notifications.show({
          color: 'green',
          title: 'Ingredient added',
          message: '',
        });
      }
      form.reset();
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const unitOptions =
    units.data?.data.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.code})`,
    })) || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? `Edit ${stockItem?.item?.name || 'stock item'}${stockItem?.item?.code ? ` (${stockItem.item.code})` : ''}`
          : 'Add Ingredient to Store'
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {!isEdit && (
            <>
              <Group grow>
                <TextInput
                  label="Code"
                  placeholder="e.g. BEEF"
                  description="Internal reference"
                  required
                  {...form.getInputProps('code')}
                />
                <TextInput
                  label="Name"
                  placeholder="e.g. Beef"
                  required
                  {...form.getInputProps('name')}
                />
              </Group>

              <Select
                label="Base Unit"
                placeholder="Pick the unit you buy in"
                searchable
                required
                data={unitOptions}
                {...form.getInputProps('base_unit_id')}
              />
            </>
          )}

          <Divider
            label="How does the store handle this?"
            labelPosition="left"
            mt="sm"
          />

          <Select
            data={[
              { value: 'by_weight', label: 'Weigh as needed (cut fresh per order)' },
              { value: 'by_portion', label: 'Ready portions (pre-cut pieces)' },
              { value: 'by_count', label: 'Packaged items (bottles, packets)' },
            ]}
            required
            {...form.getInputProps('dispatch_mode')}
          />

          {isEdit && form.values.dispatch_mode === 'by_portion' && (
            <Text size="sm" c="dimmed">
              Portion sizes and prices for this item are set in Menu → Portion Definitions.
            </Text>
          )}

          {!isEdit && form.values.dispatch_mode === 'by_portion' && (
            <>
              <Checkbox
                label="Made in-house (chapati, samosa, cake)"
                description="Turn on if you prepare this yourself"
                {...form.getInputProps('made_in_house', { type: 'checkbox' })}
              />

              <Divider label="Portion details" labelPosition="left" />

              <Group grow>
                <TextInput
                  label="Portion Name"
                  placeholder="e.g. Beef 150g"
                  required
                  {...form.getInputProps('portion_name')}
                />
                <NumberInput
                  label="Portion Size"
                  placeholder="e.g. 150"
                  min={0}
                  decimalScale={3}
                  required
                  {...form.getInputProps('portion_size')}
                />
              </Group>

              <Group grow>
                <Select
                  label="Portion Unit"
                  placeholder="g, kg, piece..."
                  searchable
                  required
                  data={unitOptions}
                  {...form.getInputProps('portion_unit_id')}
                />
                <NumberInput
                  label="Sell Price (KES)"
                  min={0}
                  decimalScale={2}
                  required
                  {...form.getInputProps('portion_sell_price')}
                />
              </Group>
            </>
          )}

          {form.values.dispatch_mode === 'by_count' && (
            <>
              <Divider label="Packaging (optional)" labelPosition="left" mt="sm" />
              <Group grow align="flex-start">
                <NumberInput
                  label="Pieces per pack"
                  description="e.g. 30 smokies per packet. Leave 0 if sold loose"
                  min={0}
                  allowDecimal={false}
                  {...form.getInputProps('pack_size')}
                />
                <Select
                  label="Pack is called"
                  data={['packet', 'crate', 'carton', 'box', 'tray', 'bag']}
                  disabled={!form.values.pack_size}
                  {...form.getInputProps('pack_label')}
                />
              </Group>
            </>
          )}

          <Divider label="Store settings" labelPosition="left" mt="sm" />

          <Group grow>
            <Select
              label="Store"
              data={[
                { value: 'food_store', label: 'Food Store' },
                { value: 'bar_store', label: 'Bar Store' },
                { value: 'kitchen', label: 'Kitchen' },
              ]}
              required
              {...form.getInputProps('store_type')}
            />
            <NumberInput
              label="Reorder Level"
              placeholder="Optional"
              min={0}
              decimalScale={3}
              {...form.getInputProps('reorder_level')}
            />
          </Group>

          {isEdit && (
            <TextInput
              label="Barcode"
              description="The number under the bars on the bottle or pack, so it can be scanned"
              placeholder="e.g. 6161101600019"
              inputMode="numeric"
              {...form.getInputProps('barcode')}
            />
          )}

          {isEdit && (
            <Select
              label="Status"
              description={
                form.values.status !== 'active'
                  ? 'Inactive items cannot be received or issued. The change is recorded in the audit log.'
                  : undefined
              }
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive (paused)' },
                { value: 'discontinued', label: 'Discontinued' },
              ]}
              allowDeselect={false}
              {...form.getInputProps('status')}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={create.isPending || update.isPending}
            >
              {isEdit ? 'Save' : 'Add Ingredient'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}