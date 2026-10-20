// import {
//   Alert,
//   Badge,
//   Button,
//   Card,
//   Checkbox,
//   Divider,
//   Group,
//   Modal,
//   NumberInput,
//   Select,
//   Stack,
//   Text,
//   TextInput,
//   ThemeIcon,
// } from '@mantine/core';
// import { DatePickerInput } from '@mantine/dates';
// import { useForm } from '@mantine/form';
// import { notifications } from '@mantine/notifications';
// import { Info, Search, Users, X } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import dayjs from 'dayjs';
// import { useQueryClient, useMutation } from '@tanstack/react-query';
// import { useUnits } from '@/hooks/useCore';
// import { useStockItems } from '@/hooks/useStock';
// import { useDailyStaffMealStatus } from '@/hooks/useOperations';
// import { apiClient, getErrorMessage } from '@/lib/api/client';

// interface Props {
//   opened: boolean;
//   onClose: () => void;
//   defaultMealType?: 'breakfast' | 'lunch' | 'supper';
//   defaultDate?: string;
// }

// async function bulkCreateStaffMeals(data: {
//   meal_type: 'breakfast' | 'lunch' | 'supper';
//   source?: 'menu' | 'alternative';
//   entries: Array<{
//     staff_user_id?: string | null;
//     staff_name: string;
//     lines: Array<{
//       stock_item_id: string;
//       quantity: number;
//       unit_id: string;
//       cost_amount: number;
//     }>;
//   }>;
// }) {
//   const res = await apiClient.post('/staff-meals/bulk', data);
//   return res.data.data;
// }

// function useBulkCreateStaffMeals() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: bulkCreateStaffMeals,
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['staff-meals'] });
//       qc.invalidateQueries({ queryKey: ['staff-meals-daily'] });
//       qc.invalidateQueries({ queryKey: ['stock-items'] });
//       qc.invalidateQueries({ queryKey: ['ledger'] });
//       qc.invalidateQueries({ queryKey: ['ledger-summary'] });
//     },
//   });
// }

// export function BulkStaffMealModal({
//   opened,
//   onClose,
//   defaultMealType = 'lunch',
//   defaultDate = dayjs().format('YYYY-MM-DD'),
// }: Props) {
//   const stockItems = useStockItems({ limit: 200 });
//   const units = useUnits();
//   const bulk = useBulkCreateStaffMeals();

//   const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'supper'>(
//     defaultMealType
//   );
//   const [date, setDate] = useState<string | null>(defaultDate);
//   const [selected, setSelected] = useState<Record<string, boolean>>({});
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     if (opened) {
//       setMealType(defaultMealType);
//       setDate(defaultDate);
//       setSelected({});
//       setSearchTerm('');
//     }
//   }, [opened, defaultMealType, defaultDate]);

//   const form = useForm({
//     initialValues: {
//       stock_item_id: '',
//       quantity: 0.2,
//       unit_id: '',
//       cost_amount: 20,
//     },
//     validate: {
//       stock_item_id: (v) => (v ? null : 'Required'),
//       quantity: (v) => (v > 0 ? null : 'Must be > 0'),
//       unit_id: (v) => (v ? null : 'Required'),
//     },
//   });

//   const dailyQuery = useDailyStaffMealStatus({
//     date: date || dayjs().format('YYYY-MM-DD'),
//     meal_type: mealType,
//   });

//   const eligibleEntries = dailyQuery.data?.entries || [];

//   const filteredEntries = eligibleEntries.filter((e) =>
//     e.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const selectedIds = Object.entries(selected)
//     .filter(([_, v]) => v)
//     .map(([id]) => id);

//   const selectAll = () => {
//     const newSel: Record<string, boolean> = {};
//     for (const e of eligibleEntries) {
//       if (e.status !== 'issued') newSel[e.staff_user_id] = true;
//     }
//     setSelected(newSel);
//   };

//   const selectPending = () => {
//     const newSel: Record<string, boolean> = {};
//     for (const e of eligibleEntries) {
//       if (e.status === 'pending') newSel[e.staff_user_id] = true;
//     }
//     setSelected(newSel);
//   };

//   const clearAll = () => setSelected({});

//   const toggleStaff = (id: string) => {
//     setSelected((s) => ({ ...s, [id]: !s[id] }));
//   };

//   const handleSubmit = async (values: typeof form.values) => {
//     if (selectedIds.length === 0) {
//       notifications.show({
//         color: 'red',
//         title: 'No staff selected',
//         message: 'Select at least one staff member.',
//       });
//       return;
//     }

//     const entries = selectedIds.map((id) => {
//       const e = eligibleEntries.find((x) => x.staff_user_id === id);
//       return {
//         staff_user_id: id,
//         staff_name: e?.staff_name || 'Staff',
//         lines: [
//           {
//             stock_item_id: values.stock_item_id,
//             quantity: values.quantity,
//             unit_id: values.unit_id,
//             cost_amount: values.cost_amount,
//           },
//         ],
//       };
//     });

//     try {
//       await bulk.mutateAsync({
//         meal_type: mealType,
//         source: 'menu',
//         entries,
//       });
//       notifications.show({
//         color: 'green',
//         title: 'Bulk meals recorded',
//         message: `${entries.length} staff meal${
//           entries.length === 1 ? '' : 's'
//         } created.`,
//       });
//       setSelected({});
//       form.reset();
//       onClose();
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err),
//       });
//     }
//   };

//   const stockItemOptions =
//     stockItems.data?.data.map((s) => ({
//       value: s.id,
//       label: `${s.item?.name || 'Item'} (${s.stock_model})`,
//     })) || [];

//   const unitOptions =
//     units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

//   return (
//     <Modal
//       opened={opened}
//       onClose={onClose}
//       title={
//         <Group gap="xs">
//           <ThemeIcon variant="light" color="blue" size="md" radius="md">
//             <Users size={14} />
//           </ThemeIcon>
//           <Text fw={600}>Record bulk staff meal</Text>
//         </Group>
//       }
//       size="lg"
//     >
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack gap="md">
//           <Alert icon={<Info size={16} />} color="blue" variant="light">
//             <Text size="sm">
//               Same item and quantity will be recorded for all selected staff.
//             </Text>
//           </Alert>

//           <Group grow>
//             <Select
//               label="Meal"
//               data={[
//                 { value: 'breakfast', label: 'Breakfast' },
//                 { value: 'lunch', label: 'Lunch' },
//                 { value: 'supper', label: 'Supper' },
//               ]}
//               value={mealType}
//               onChange={(v) => {
//                 setMealType(v as typeof mealType);
//                 setSelected({});
//               }}
//             />
//             <DatePickerInput
//               label="Date"
//               value={date}
//               onChange={(v) => {
//                 setDate(v);
//                 setSelected({});
//               }}
//               valueFormat="ddd, DD MMM"
//               popoverProps={{
//                 withinPortal: true,
//                 zIndex: 2000,
//                 position: 'bottom-start',
//                 offset: 8,
//               }}
//             />
//           </Group>

//           <Divider label="Item per staff" labelPosition="left" />

//           <Group grow>
//             <Select
//               label="Stock Item"
//               placeholder="Search item"
//               searchable
//               data={stockItemOptions}
//               required
//               {...form.getInputProps('stock_item_id')}
//             />
//             <Select
//               label="Unit"
//               placeholder="Unit"
//               data={unitOptions}
//               required
//               {...form.getInputProps('unit_id')}
//             />
//           </Group>

//           <Group grow>
//             <NumberInput
//               label="Quantity per staff"
//               min={0}
//               decimalScale={3}
//               required
//               {...form.getInputProps('quantity')}
//             />
//             <NumberInput
//               label="Cost per staff (KES)"
//               min={0}
//               decimalScale={2}
//               required
//               {...form.getInputProps('cost_amount')}
//             />
//           </Group>

//           <Divider
//             label={`Staff (${selectedIds.length} selected)`}
//             labelPosition="left"
//           />

//           <Group gap="xs">
//             <Button size="xs" variant="light" onClick={selectAll}>
//               Select all
//             </Button>
//             <Button
//               size="xs"
//               variant="light"
//               color="orange"
//               onClick={selectPending}
//             >
//               Select pending
//             </Button>
//             <Button
//               size="xs"
//               variant="default"
//               onClick={clearAll}
//               leftSection={<X size={12} />}
//             >
//               Clear
//             </Button>
//           </Group>

//           <TextInput
//             placeholder="Search staff by name"
//             leftSection={<Search size={14} />}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.currentTarget.value)}
//             size="sm"
//           />

//           <Stack
//             gap="xs"
//             mah={300}
//             style={{ overflowY: 'auto', paddingRight: 4 }}
//           >
//             {filteredEntries.length === 0 ? (
//               <Text size="sm" c="dimmed" ta="center" py="md">
//                 {eligibleEntries.length === 0
//                   ? 'No eligible staff for this date.'
//                   : 'No matches.'}
//               </Text>
//             ) : (
//               filteredEntries.map((e) => (
//                 <Card
//                   key={e.staff_user_id}
//                   withBorder
//                   padding="xs"
//                   radius="md"
//                   style={{
//                     opacity: e.status === 'issued' ? 0.6 : 1,
//                   }}
//                 >
//                   <Checkbox
//                     checked={!!selected[e.staff_user_id]}
//                     onChange={() => toggleStaff(e.staff_user_id)}
//                     disabled={e.status === 'issued'}
//                     label={
//                       <Group gap="xs">
//                         <Text size="sm" fw={500}>
//                           {e.staff_name}
//                         </Text>
//                         {e.status === 'issued' && (
//                           <Badge variant="light" color="green" size="xs">
//                             already issued
//                           </Badge>
//                         )}
//                       </Group>
//                     }
//                   />
//                 </Card>
//               ))
//             )}
//           </Stack>

//           <Group justify="flex-end" mt="md">
//             <Button variant="default" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               loading={bulk.isPending}
//               disabled={selectedIds.length === 0}
//             >
//               Record {selectedIds.length || 0} Meal
//               {selectedIds.length === 1 ? '' : 's'}
//             </Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   );
// }





















// import {
//   ActionIcon,
//   Alert,
//   Badge,
//   Button,
//   Card,
//   Checkbox,
//   Divider,
//   Group,
//   Loader,
//   Modal,
//   NumberInput,
//   Select,
//   Stack,
//   Text,
//   TextInput,
//   ThemeIcon,
// } from '@mantine/core';
// import { DatePickerInput } from '@mantine/dates';
// import { useForm } from '@mantine/form';
// import { notifications } from '@mantine/notifications';
// import {
//   AlertCircle,
//   Info,
//   Search,
//   Users,
//   X,
// } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import dayjs from 'dayjs';
// import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
// import { useUnits } from '@/hooks/useCore';
// import { useStockItems } from '@/hooks/useStock';
// import { useDailyStaffMealStatus } from '@/hooks/useOperations';
// import { apiClient, getErrorMessage } from '@/lib/api/client';

// interface Props {
//   opened: boolean;
//   onClose: () => void;
//   defaultMealType?: 'breakfast' | 'lunch' | 'supper';
//   defaultDate?: string;
// }

// interface ScheduleLookupItem {
//   stock_item_id: string;
//   stock_item_name: string;
//   quantity: number;
//   unit_id: string;
//   unit_name: string;
// }

// interface ScheduleLookupResponse {
//   date: string;
//   meal_type: string;
//   source: 'week' | 'standing' | null;
//   items: ScheduleLookupItem[];
// }

// async function bulkCreateStaffMeals(data: {
//   meal_type: 'breakfast' | 'lunch' | 'supper';
//   source?: 'menu' | 'alternative';
//   entries: Array<{
//     staff_user_id?: string | null;
//     staff_name: string;
//     lines: Array<{
//       stock_item_id: string;
//       quantity: number;
//       unit_id: string;
//       cost_amount: number;
//     }>;
//   }>;
// }) {
//   const res = await apiClient.post('/staff-meals/bulk', data);
//   return res.data.data;
// }

// function useBulkCreateStaffMeals() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: bulkCreateStaffMeals,
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ['staff-meals'] });
//       qc.invalidateQueries({ queryKey: ['staff-meals-daily'] });
//       qc.invalidateQueries({ queryKey: ['stock-items'] });
//       qc.invalidateQueries({ queryKey: ['ledger'] });
//       qc.invalidateQueries({ queryKey: ['ledger-summary'] });
//     },
//   });
// }

// async function fetchScheduleLookup(params: {
//   date: string;
//   meal_type: string;
// }): Promise<ScheduleLookupResponse> {
//   const res = await apiClient.get<{ data: ScheduleLookupResponse }>(
//     '/staff-menu/lookup',
//     { params }
//   );
//   return res.data.data;
// }

// export function BulkStaffMealModal({
//   opened,
//   onClose,
//   defaultMealType = 'lunch',
//   defaultDate = dayjs().format('YYYY-MM-DD'),
// }: Props) {
//   const stockItems = useStockItems({ limit: 200 });
//   const units = useUnits();
//   const bulk = useBulkCreateStaffMeals();

//   const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'supper'>(
//     defaultMealType
//   );
//   const [date, setDate] = useState<string | null>(defaultDate);
//   const [selected, setSelected] = useState<Record<string, boolean>>({});
//   const [searchTerm, setSearchTerm] = useState('');

//   // Reset state when modal opens with new defaults
//   useEffect(() => {
//     if (opened) {
//       setMealType(defaultMealType);
//       setDate(defaultDate);
//       setSelected({});
//       setSearchTerm('');
//     }
//   }, [opened, defaultMealType, defaultDate]);

//   const form = useForm({
//     initialValues: {
//       stock_item_id: '',
//       quantity: 0.2,
//       unit_id: '',
//       cost_amount: 20,
//     },
//     validate: {
//       stock_item_id: (v) => (v ? null : 'Required'),
//       quantity: (v) => (v > 0 ? null : 'Must be > 0'),
//       unit_id: (v) => (v ? null : 'Required'),
//     },
//   });

//   // Eligible staff list from daily-status
//   const dailyQuery = useDailyStaffMealStatus({
//     date: date || dayjs().format('YYYY-MM-DD'),
//     meal_type: mealType,
//   });

//   // Standing/weekly menu lookup for auto-fill
//   const scheduleLookup = useQuery({
//     queryKey: ['staff-menu-lookup', date, mealType],
//     queryFn: () =>
//       fetchScheduleLookup({
//         date: date!,
//         meal_type: mealType,
//       }),
//     enabled: opened && !!date,
//     retry: false,
//   });

//   // Auto-fill form when schedule loads
//   useEffect(() => {
//     if (
//       scheduleLookup.data &&
//       scheduleLookup.data.items.length > 0 &&
//       !form.values.stock_item_id
//     ) {
//       const first = scheduleLookup.data.items[0];
//       form.setValues({
//         stock_item_id: first.stock_item_id,
//         quantity: first.quantity,
//         unit_id: first.unit_id,
//         cost_amount: 20,
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [scheduleLookup.data]);

//   const eligibleEntries = dailyQuery.data?.entries || [];

//   const filteredEntries = eligibleEntries.filter((e) =>
//     e.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const selectedIds = Object.entries(selected)
//     .filter(([_, v]) => v)
//     .map(([id]) => id);

//   const selectAll = () => {
//     const newSel: Record<string, boolean> = {};
//     for (const e of eligibleEntries) {
//       if (e.status !== 'issued') newSel[e.staff_user_id] = true;
//     }
//     setSelected(newSel);
//   };

//   const selectPending = () => {
//     const newSel: Record<string, boolean> = {};
//     for (const e of eligibleEntries) {
//       if (e.status === 'pending') newSel[e.staff_user_id] = true;
//     }
//     setSelected(newSel);
//   };

//   const clearAll = () => setSelected({});

//   const toggleStaff = (id: string) => {
//     setSelected((s) => ({ ...s, [id]: !s[id] }));
//   };

//   const handleSubmit = async (values: typeof form.values) => {
//     if (selectedIds.length === 0) {
//       notifications.show({
//         color: 'red',
//         title: 'No staff selected',
//         message: 'Select at least one staff member.',
//       });
//       return;
//     }

//     const entries = selectedIds.map((id) => {
//       const e = eligibleEntries.find((x) => x.staff_user_id === id);
//       return {
//         staff_user_id: id,
//         staff_name: e?.staff_name || 'Staff',
//         lines: [
//           {
//             stock_item_id: values.stock_item_id,
//             quantity: values.quantity,
//             unit_id: values.unit_id,
//             cost_amount: values.cost_amount,
//           },
//         ],
//       };
//     });

//     try {
//       await bulk.mutateAsync({
//         meal_type: mealType,
//         source: scheduleLookup.data?.source ? 'menu' : 'alternative',
//         entries,
//       });
//       notifications.show({
//         color: 'green',
//         title: 'Bulk meals recorded',
//         message: `${entries.length} staff meal${
//           entries.length === 1 ? '' : 's'
//         } created.`,
//       });
//       setSelected({});
//       form.reset();
//       onClose();
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err),
//       });
//     }
//   };

//   const stockItemOptions =
//     stockItems.data?.data.map((s) => ({
//       value: s.id,
//       label: `${s.item?.name || 'Item'} (${s.stock_model})`,
//     })) || [];

//   const unitOptions =
//     units.data?.data.map((u) => ({ value: u.id, label: u.name })) || [];

//   const scheduleSource = scheduleLookup.data?.source;
//   const hasSchedule =
//     scheduleLookup.data && scheduleLookup.data.items.length > 0;

//   return (
//     <Modal
//       opened={opened}
//       onClose={onClose}
//       title={
//         <Group gap="xs">
//           <ThemeIcon variant="light" color="blue" size="md" radius="md">
//             <Users size={14} />
//           </ThemeIcon>
//           <Text fw={600}>Record bulk staff meal</Text>
//         </Group>
//       }
//       size="lg"
//     >
//       <form onSubmit={form.onSubmit(handleSubmit)}>
//         <Stack gap="md">
//           {/* Schedule source indicator */}
//           {scheduleLookup.isLoading ? (
//             <Alert icon={<Loader size={14} />} color="gray" variant="light">
//               <Text size="sm">Loading menu plan…</Text>
//             </Alert>
//           ) : hasSchedule ? (
//             <Alert
//               icon={<Info size={16} />}
//               color={scheduleSource === 'week' ? 'blue' : 'gray'}
//               variant="light"
//             >
//               <Group gap="xs">
//                 <Text size="sm">
//                   Items loaded from{' '}
//                   <strong>{scheduleSource} menu</strong>.
//                 </Text>
//                 <Badge
//                   variant="light"
//                   color={scheduleSource === 'week' ? 'blue' : 'gray'}
//                   size="sm"
//                 >
//                   {scheduleSource}
//                 </Badge>
//               </Group>
//             </Alert>
//           ) : (
//             <Alert
//               icon={<AlertCircle size={16} />}
//               color="yellow"
//               variant="light"
//             >
//               <Text size="sm">
//                 No menu plan for this date. Pick items manually.
//               </Text>
//             </Alert>
//           )}

//           <Group grow>
//             <Select
//               label="Meal"
//               data={[
//                 { value: 'breakfast', label: 'Breakfast' },
//                 { value: 'lunch', label: 'Lunch' },
//                 { value: 'supper', label: 'Supper' },
//               ]}
//               value={mealType}
//               onChange={(v) => {
//                 setMealType(v as typeof mealType);
//                 setSelected({});
//                 form.reset();
//               }}
//             />
//             <DatePickerInput
//               label="Date"
//               value={date}
//               onChange={(v) => {
//                 setDate(v);
//                 setSelected({});
//                 form.reset();
//               }}
//               valueFormat="ddd, DD MMM"
//               popoverProps={{
//                 withinPortal: true,
//                 zIndex: 2000,
//                 position: 'bottom-start',
//                 offset: 8,
//               }}
//             />
//           </Group>

//           <Divider label="Item per staff" labelPosition="left" />

//           <Group grow>
//             <Select
//               label="Stock Item"
//               placeholder="Search item"
//               searchable
//               data={stockItemOptions}
//               required
//               {...form.getInputProps('stock_item_id')}
//             />
//             <Select
//               label="Unit"
//               placeholder="Unit"
//               data={unitOptions}
//               required
//               {...form.getInputProps('unit_id')}
//             />
//           </Group>

//           <Group grow>
//             <NumberInput
//               label="Quantity per staff"
//               min={0}
//               decimalScale={3}
//               required
//               {...form.getInputProps('quantity')}
//             />
//             <NumberInput
//               label="Cost per staff (KES)"
//               min={0}
//               decimalScale={2}
//               required
//               {...form.getInputProps('cost_amount')}
//             />
//           </Group>

//           <Divider
//             label={`Staff (${selectedIds.length} selected)`}
//             labelPosition="left"
//           />

//           <Group gap="xs">
//             <Button size="xs" variant="light" onClick={selectAll}>
//               Select all
//             </Button>
//             <Button
//               size="xs"
//               variant="light"
//               color="orange"
//               onClick={selectPending}
//             >
//               Select pending
//             </Button>
//             <Button
//               size="xs"
//               variant="default"
//               onClick={clearAll}
//               leftSection={<X size={12} />}
//             >
//               Clear
//             </Button>
//           </Group>

//           <TextInput
//             placeholder="Search staff by name"
//             leftSection={<Search size={14} />}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.currentTarget.value)}
//             size="sm"
//           />

//           {dailyQuery.isLoading ? (
//             <Stack align="center" py="md">
//               <Loader size="sm" />
//             </Stack>
//           ) : (
//             <Stack
//               gap="xs"
//               mah={300}
//               style={{ overflowY: 'auto', paddingRight: 4 }}
//             >
//               {filteredEntries.length === 0 ? (
//                 <Text size="sm" c="dimmed" ta="center" py="md">
//                   {eligibleEntries.length === 0
//                     ? 'No eligible staff for this date.'
//                     : 'No matches.'}
//                 </Text>
//               ) : (
//                 filteredEntries.map((e) => (
//                   <Card
//                     key={e.staff_user_id}
//                     withBorder
//                     padding="xs"
//                     radius="md"
//                     style={{
//                       opacity: e.status === 'issued' ? 0.6 : 1,
//                     }}
//                   >
//                     <Checkbox
//                       checked={!!selected[e.staff_user_id]}
//                       onChange={() => toggleStaff(e.staff_user_id)}
//                       disabled={e.status === 'issued'}
//                       label={
//                         <Group gap="xs">
//                           <Text size="sm" fw={500}>
//                             {e.staff_name}
//                           </Text>
//                           {e.status === 'issued' && (
//                             <Badge variant="light" color="green" size="xs">
//                               already issued
//                             </Badge>
//                           )}
//                         </Group>
//                       }
//                     />
//                   </Card>
//                 ))
//               )}
//             </Stack>
//           )}

//           <Group justify="flex-end" mt="md">
//             <Button variant="default" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               loading={bulk.isPending}
//               disabled={selectedIds.length === 0}
//             >
//               Record {selectedIds.length || 0} Meal
//               {selectedIds.length === 1 ? '' : 's'}
//             </Button>
//           </Group>
//         </Stack>
//       </form>
//     </Modal>
//   );
// }























import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useDailyStaffMealStatus, useScheduleLookup } from '@/hooks/useOperations';
import { apiClient, getErrorMessage } from '@/lib/api/client';

interface Props {
  opened: boolean;
  onClose: () => void;
  defaultMealType?: 'breakfast' | 'lunch' | 'supper';
  defaultDate?: string;
}

async function bulkCreateStaffMeals(data: {
  meal_type: 'breakfast' | 'lunch' | 'supper';
  source: 'menu' | 'alternative';
  entries: Array<{
    staff_user_id?: string | null;
    staff_name: string;
    lines: Array<{
      stock_item_id: string;
      quantity: number;
      unit_id: string;
      cost_amount: number;
    }>;
  }>;
}) {
  const res = await apiClient.post('/staff-meals/bulk', data);
  return res.data.data;
}

function useBulkCreateStaffMeals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateStaffMeals,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-meals'] });
      qc.invalidateQueries({ queryKey: ['staff-meals-daily'] });
      qc.invalidateQueries({ queryKey: ['stock-items'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export function BulkStaffMealModal({
  opened,
  onClose,
  defaultMealType = 'lunch',
  defaultDate = dayjs().format('YYYY-MM-DD'),
}: Props) {
  const bulk = useBulkCreateStaffMeals();

  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'supper'>(
    defaultMealType
  );
  const [date, setDate] = useState<string | null>(defaultDate);
  const [source, setSource] = useState<'menu' | 'alternative'>('menu');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCosts, setManualCosts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (opened) {
      setMealType(defaultMealType);
      setDate(defaultDate);
      setSource('menu');
      setSelected({});
      setSearchTerm('');
      setManualCosts({});
    }
  }, [opened, defaultMealType, defaultDate]);

  // Only ask the server once the dialog is open
  const dailyQuery = useDailyStaffMealStatus(
    {
      date: date || dayjs().format('YYYY-MM-DD'),
      meal_type: mealType,
    },
    { enabled: opened }
  );

  const lookup = useScheduleLookup({
    date: date,
    meal_type: mealType,
    enabled: opened && source === 'menu',
  });

  const scheduleItems = lookup.data?.items || [];
  const hasSchedule = scheduleItems.length > 0;
  const scheduleSource = lookup.data?.source;

  useEffect(() => {
    if (opened && hasSchedule) {
      const costs: Record<number, number> = {};
      scheduleItems.forEach((_, idx) => {
        costs[idx] = 20;
      });
      setManualCosts(costs);
    }
  }, [opened, lookup.data]);

  const eligibleEntries = dailyQuery.data?.entries || [];

  const filteredEntries = eligibleEntries.filter((e) =>
    e.staff_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedIds = Object.entries(selected)
    .filter(([_, v]) => v)
    .map(([id]) => id);

  const selectAll = () => {
    const newSel: Record<string, boolean> = {};
    for (const e of eligibleEntries) {
      if (e.status !== 'issued') newSel[e.staff_user_id] = true;
    }
    setSelected(newSel);
  };

  const selectPending = () => {
    const newSel: Record<string, boolean> = {};
    for (const e of eligibleEntries) {
      if (e.status === 'pending') newSel[e.staff_user_id] = true;
    }
    setSelected(newSel);
  };

  const clearAll = () => setSelected({});

  const toggleStaff = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      notifications.show({
        color: 'red',
        title: 'No staff selected',
        message: 'Select at least one staff member.',
      });
      return;
    }

    if (source === 'menu' && !hasSchedule) {
      notifications.show({
        color: 'red',
        title: 'No menu plan',
        message: 'No standing or week menu for this meal. Switch to Alternative.',
      });
      return;
    }

    let lines: Array<{
      stock_item_id: string;
      quantity: number;
      unit_id: string;
      cost_amount: number;
    }>;

    if (source === 'menu') {
      lines = scheduleItems.map((item, idx) => ({
        stock_item_id: item.stock_item_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        cost_amount: manualCosts[idx] ?? 20,
      }));
    } else {
      // Alternative in bulk: v1 doesn't support arbitrary items in bulk,
      // require the manager to record those individually.
      notifications.show({
        color: 'orange',
        title: 'Alternative bulk not supported',
        message:
          'Record alternative meals one at a time from the Staff Meals page.',
      });
      return;
    }

    const entries = selectedIds.map((id) => {
      const e = eligibleEntries.find((x) => x.staff_user_id === id);
      return {
        staff_user_id: id,
        staff_name: e?.staff_name || 'Staff',
        lines,
      };
    });

    try {
      await bulk.mutateAsync({
        meal_type: mealType,
        source,
        entries,
      });
      notifications.show({
        color: 'green',
        title: 'Bulk meals recorded',
        message: `${entries.length} staff meal${
          entries.length === 1 ? '' : 's'
        } created.`,
      });
      setSelected({});
      setManualCosts({});
      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="md" radius="md">
            <Users size={14} />
          </ThemeIcon>
          <Text fw={600}>Record bulk staff meal</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Meal + Date + Source */}
        <Group grow>
          <Select
            label="Meal"
            data={[
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'supper', label: 'Supper' },
            ]}
            value={mealType}
            onChange={(v) => {
              setMealType(v as typeof mealType);
              setSelected({});
              setManualCosts({});
            }}
          />
          <DatePickerInput
            label="Date"
            value={date}
            onChange={(v) => {
              setDate(v);
              setSelected({});
              setManualCosts({});
            }}
            valueFormat="ddd, DD MMM"
            popoverProps={{
              withinPortal: true,
              zIndex: 2000,
              position: 'bottom-start',
              offset: 8,
            }}
          />
          <Select
            label="Source"
            data={[
              { value: 'menu', label: 'From menu plan' },
              { value: 'alternative', label: 'Alternative' },
            ]}
            value={source}
            onChange={(v) => setSource(v as 'menu' | 'alternative')}
          />
        </Group>

        {/* Schedule status */}
        {source === 'menu' && lookup.isLoading && (
          <Alert icon={<Loader size={14} />} color="gray" variant="light">
            <Text size="sm">Loading menu plan…</Text>
          </Alert>
        )}

        {source === 'menu' && !lookup.isLoading && hasSchedule && (
          <Alert
            icon={<Lock size={16} />}
            color={scheduleSource === 'week' ? 'blue' : 'green'}
            variant="light"
          >
            <Group gap="xs" wrap="nowrap">
              <Text size="sm">
                Items locked to the <strong>{scheduleSource} menu</strong>.
              </Text>
              <Badge
                variant="light"
                color={scheduleSource === 'week' ? 'blue' : 'green'}
                size="sm"
              >
                {scheduleSource}
              </Badge>
            </Group>
          </Alert>
        )}

        {source === 'menu' && !lookup.isLoading && !hasSchedule && (
          <Alert icon={<AlertCircle size={16} />} color="red" variant="light">
            <Text size="sm">
              No menu plan for this date and meal. Switch to Alternative, or
              record individually from Staff Meals.
            </Text>
          </Alert>
        )}

        {source === 'alternative' && (
          <Alert color="yellow" variant="light">
            <Text size="sm">
              Bulk alternative meals aren't supported. Record those one at a
              time from the Staff Meals page.
            </Text>
          </Alert>
        )}

        {/* Menu items */}
        {source === 'menu' && hasSchedule && (
          <>
            <Divider label="Menu items per staff" labelPosition="left" />
            <Stack gap="xs">
              {scheduleItems.map((item, idx) => (
                <Card key={idx} withBorder padding="sm" radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {item.stock_item_name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.quantity} {item.unit_name} per staff
                      </Text>
                    </Stack>
                    <NumberInput
                      size="xs"
                      w={120}
                      min={0}
                      decimalScale={2}
                      prefix="KES "
                      value={manualCosts[idx] ?? 20}
                      onChange={(v) =>
                        setManualCosts((c) => ({
                          ...c,
                          [idx]: typeof v === 'number' ? v : 0,
                        }))
                      }
                    />
                  </Group>
                </Card>
              ))}
            </Stack>
          </>
        )}

        {/* Staff selection */}
        {source === 'menu' && hasSchedule && (
          <>
            <Divider
              label={`Staff (${selectedIds.length} selected)`}
              labelPosition="left"
            />

            <Group gap="xs">
              <Button size="xs" variant="light" onClick={selectAll}>
                Select all
              </Button>
              <Button
                size="xs"
                variant="light"
                color="orange"
                onClick={selectPending}
              >
                Select pending
              </Button>
              <Button
                size="xs"
                variant="default"
                onClick={clearAll}
                leftSection={<X size={12} />}
              >
                Clear
              </Button>
            </Group>

            <TextInput
              placeholder="Search staff by name"
              leftSection={<Search size={14} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              size="sm"
            />

            {dailyQuery.isLoading ? (
              <Stack align="center" py="md">
                <Loader size="sm" />
              </Stack>
            ) : (
              <Stack
                gap="xs"
                mah={300}
                style={{ overflowY: 'auto', paddingRight: 4 }}
              >
                {filteredEntries.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    {eligibleEntries.length === 0
                      ? 'No eligible staff for this date.'
                      : 'No matches.'}
                  </Text>
                ) : (
                  filteredEntries.map((e) => (
                    <Card
                      key={e.staff_user_id}
                      withBorder
                      padding="xs"
                      radius="md"
                      style={{
                        opacity: e.status === 'issued' ? 0.6 : 1,
                      }}
                    >
                      <Checkbox
                        checked={!!selected[e.staff_user_id]}
                        onChange={() => toggleStaff(e.staff_user_id)}
                        disabled={e.status === 'issued'}
                        label={
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {e.staff_name}
                            </Text>
                            {e.status === 'issued' && (
                              <Badge variant="light" color="green" size="xs">
                                already issued
                              </Badge>
                            )}
                          </Group>
                        }
                      />
                    </Card>
                  ))
                )}
              </Stack>
            )}
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={bulk.isPending}
            disabled={
              selectedIds.length === 0 ||
              source === 'alternative' ||
              (source === 'menu' && !hasSchedule)
            }
            leftSection={<CheckCircle2 size={16} />}
          >
            Record {selectedIds.length || 0} Meal
            {selectedIds.length === 1 ? '' : 's'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}