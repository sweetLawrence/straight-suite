// import { createFileRoute, useNavigate } from '@tanstack/react-router'
// import {
//   Box,
//   Button,
//   Card,
//   Divider,
//   Group,
//   Paper,
//   SegmentedControl,
//   Stack,
//   Text,
//   TextInput,
//   ThemeIcon,
//   Title
// } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import {
//   ArrowLeft,
//   ChefHat,
//   Wine,
//   UtensilsCrossed,
//   Hash,
//   Sparkles,
//   Receipt
// } from 'lucide-react'
// import { useCreateOrder } from '@/hooks/useOrders'
// import { PageHeader } from '@/components/PageHeader'
// import { getErrorMessage } from '@/lib/api/client'

// export const Route = createFileRoute('/_app/orders/new')({
//   component: NewOrderPage
// })

// const STATIONS = [
//   { value: 'kitchen', label: 'Kitchen', icon: ChefHat },
//   { value: 'bar', label: 'Bar', icon: Wine },
//   { value: 'both', label: 'Both', icon: UtensilsCrossed }
// ] as const

// function NewOrderPage () {
//   const navigate = useNavigate()
//   const createOrder = useCreateOrder()

//   const form = useForm({
//     initialValues: {
//       table_number: '',
//       station: 'both' as 'kitchen' | 'bar' | 'both'
//     }
//   })

//   const handleSubmit = async (values: typeof form.values) => {
//     try {
//       const order = await createOrder.mutateAsync({
//         table_number: values.table_number || undefined,
//         station: values.station
//       })
//       notifications.show({
//         color: 'green',
//         title: 'Order created',
//         message: `Order ${order.order_ref} created`
//       })
//       navigate({ to: `/orders/${order.id}` })
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err)
//       })
//     }
//   }

//   return (
//     <Box pb={{ base: 80, sm: 0 }}>
//       {/* ---------- Back link ---------- */}
//       <Button
//         variant='subtle'
//         color='gray'
//         leftSection={<ArrowLeft size={16} />}
//         onClick={() => navigate({ to: '/orders' })}
//         mb='sm'
//         size='sm'
//         radius='md'
//         px={6}
//       >
//         Back
//       </Button>

//       {/* ---------- Header ---------- */}
//       <PageHeader title='New Order' subtitle='Start a new customer order' />

//       {/* ---------- Form card ---------- */}
//       <Card
//         withBorder
//         radius='md'
//         p={0}
//         maw={520}
//         style={{ overflow: 'hidden' }}
//       >
//         {/* Card header */}
//         <Group gap='sm' p='md' pb='sm' wrap='nowrap'>
//           <ThemeIcon variant='light' color='brand' size='lg' radius='md'>
//             <Receipt size={18} />
//           </ThemeIcon>
//           <Box>
//             <Title order={5} fw={600}>
//               Order details
//             </Title>
//             <Text size='xs' c='dimmed' mt={2}>
//               Just the essentials to get started
//             </Text>
//           </Box>
//         </Group>

//         <Divider />

//         <form id='new-order-form' onSubmit={form.onSubmit(handleSubmit)}>
//           <Stack gap='lg' p='md'>
//             {/* Table number */}
//             <Box>
//               <Text
//                 size='xs'
//                 fw={600}
//                 c='dimmed'
//                 tt='uppercase'
//                 mb={8}
//                 style={{ letterSpacing: 0.5 }}
//               >
//                 Table number
//               </Text>
//               <TextInput
//                 placeholder='e.g. 7'
//                 size='md'
//                 radius='md'
//                 leftSection={<Hash size={16} />}
//                 autoFocus
//                 styles={{
//                   input: {
//                     fontVariantNumeric: 'tabular-nums'
//                   }
//                 }}
//                 {...form.getInputProps('table_number')}
//               />
//               <Text size='xs' c='dimmed' mt={6}>
//                 Leave blank if the customer is at the counter or taking away.
//               </Text>
//             </Box>

//             {/* Station */}
//             <Box>
//               <Text
//                 size='xs'
//                 fw={600}
//                 c='dimmed'
//                 tt='uppercase'
//                 mb={8}
//                 style={{ letterSpacing: 0.5 }}
//               >
//                 Station
//               </Text>
//               <SegmentedControl
//                 fullWidth
//                 size='md'
//                 radius='md'
//                 data={STATIONS.map(({ value, label, icon: Icon }) => ({
//                   value,
//                   label: (
//                     <Group gap={6} wrap='nowrap' justify='center'>
//                       <Icon size={14} />
//                       <span>{label}</span>
//                     </Group>
//                   )
//                 }))}
//                 {...form.getInputProps('station')}
//               />
//               <Text size='xs' c='dimmed' mt={6}>
//                 Choose which station will prepare this order.
//               </Text>
//             </Box>

//             {/* Customer code hint */}
//             <Paper
//               radius='md'
//               p='sm'
//               style={{
//                 background: 'var(--mantine-color-gray-0)',
//                 border: '1px solid var(--mantine-color-gray-2)'
//               }}
//             >
//               <Group gap='sm' wrap='nowrap'>
//                 <ThemeIcon variant='light' color='brand' size='md' radius='md'>
//                   <Sparkles size={14} />
//                 </ThemeIcon>
//                 <Text size='xs' c='dimmed' style={{ lineHeight: 1.4 }}>
//                   A <strong>customer code</strong> will be generated
//                   automatically when you create this order.
//                 </Text>
//               </Group>
//             </Paper>
//           </Stack>

//           {/* Footer actions (desktop / tablet) */}
//           <Divider />
//           <Group justify='space-between' p='md' visibleFrom='sm'>
//             <Button
//               variant='default'
//               radius='md'
//               onClick={() => navigate({ to: '/orders' })}
//             >
//               Cancel
//             </Button>
//             <Button
//               type='submit'
//               radius='md'
//               loading={createOrder.isPending}
//               leftSection={<Receipt size={16} />}
//             >
//               Create Order
//             </Button>
//           </Group>
//         </form>
//       </Card>

//       {/* ---------- Mobile sticky submit bar ---------- */}
//       <Paper
//         shadow='lg'
//         radius={0}
//         p='md'
//         hiddenFrom='sm'
//         style={{
//           position: 'fixed',
//           bottom: 0,
//           left: 0,
//           right: 0,
//           zIndex: 100,
//           borderTop: '1px solid var(--mantine-color-gray-2)',
//           paddingBottom:
//             'calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))'
//         }}
//       >
//         <Button
//           type='submit'
//           form='new-order-form'
//           fullWidth
//           size='md'
//           radius='md'
//           leftSection={<Receipt size={18} />}
//           loading={createOrder.isPending}
//         >
//           Create Order
//         </Button>
//       </Paper>
//     </Box>
//   )
// }

// import { createFileRoute, useNavigate } from '@tanstack/react-router'
// import {
//   Box,
//   Button,
//   Card,
//   Divider,
//   Group,
//   Paper,
//   Portal,
//   SegmentedControl,
//   Stack,
//   Text,
//   TextInput,
//   ThemeIcon,
//   Title
// } from '@mantine/core'
// import { useForm } from '@mantine/form'
// import { notifications } from '@mantine/notifications'
// import {
//   ArrowLeft,
//   ChefHat,
//   Wine,
//   UtensilsCrossed,
//   Hash,
//   Sparkles,
//   Receipt
// } from 'lucide-react'
// import { useCreateOrder } from '@/hooks/useOrders'
// import { PageHeader } from '@/components/PageHeader'
// import { getErrorMessage } from '@/lib/api/client'

// export const Route = createFileRoute('/_app/orders/new')({
//   component: NewOrderPage
// })

// const STATIONS = [
//   { value: 'kitchen', label: 'Kitchen', icon: ChefHat },
//   { value: 'bar', label: 'Bar', icon: Wine },
//   { value: 'both', label: 'Both', icon: UtensilsCrossed }
// ] as const

// function NewOrderPage () {
//   const navigate = useNavigate()
//   const createOrder = useCreateOrder()

//   const form = useForm({
//     initialValues: {
//       table_number: '',
//       station: 'both' as 'kitchen' | 'bar' | 'both'
//     }
//   })

//   const handleSubmit = async (values: typeof form.values) => {
//     try {
//       const order = await createOrder.mutateAsync({
//         table_number: values.table_number || undefined,
//         station: values.station
//       })
//       notifications.show({
//         color: 'green',
//         title: 'Order created',
//         message: `Order ${order.order_ref} created`
//       })
//       navigate({ to: `/orders/${order.id}` })
//     } catch (err) {
//       notifications.show({
//         color: 'red',
//         title: 'Failed',
//         message: getErrorMessage(err)
//       })
//     }
//   }

//   const handleCancel = () => navigate({ to: '/orders' })

//   return (
//     <Box
//       w='100%'
//       maw='100%'
//       style={{ overflowX: 'hidden' }}
//       pb={{ base: 120, sm: 0 }}
//     >
//       {/* ---------- Back link ---------- */}
//       <Button
//         variant='subtle'
//         color='gray'
//         leftSection={<ArrowLeft size={16} />}
//         onClick={handleCancel}
//         mb='sm'
//         size='sm'
//         radius='md'
//         px={6}
//       >
//         Back
//       </Button>

//       {/* ---------- Header ---------- */}
//       <PageHeader title='New Order' subtitle='Start a new customer order' />

//       {/* ---------- Form card ---------- */}
//       <Card
//         withBorder
//         radius='md'
//         p={0}
//         maw={520}
//         w='100%'
//         style={{ overflow: 'hidden' }}
//       >
//         {/* Card header */}
//         <Group gap='sm' p='md' pb='sm' wrap='nowrap'>
//           <ThemeIcon variant='light' color='brand' size='lg' radius='md'>
//             <Receipt size={18} />
//           </ThemeIcon>
//           <Box style={{ minWidth: 0 }}>
//             <Title order={5} fw={600} truncate>
//               Order details
//             </Title>
//             <Text size='xs' c='dimmed' mt={2} truncate>
//               Just the essentials to get started
//             </Text>
//           </Box>
//         </Group>

//         <Divider />

//         <form id='new-order-form' onSubmit={form.onSubmit(handleSubmit)}>
//           <Stack gap='lg' p='md'>
//             {/* Table number */}
//             <Box>
//               <Text
//                 size='xs'
//                 fw={600}
//                 c='dimmed'
//                 tt='uppercase'
//                 mb={8}
//                 style={{ letterSpacing: 0.5 }}
//               >
//                 Table number
//               </Text>
//               <TextInput
//                 placeholder='e.g. 7'
//                 size='md'
//                 radius='md'
//                 leftSection={<Hash size={16} />}
//                 autoFocus
//                 styles={{
//                   input: {
//                     fontVariantNumeric: 'tabular-nums'
//                   }
//                 }}
//                 {...form.getInputProps('table_number')}
//               />
//               <Text size='xs' c='dimmed' mt={6}>
//                 Leave blank if the customer is at the counter or taking away.
//               </Text>
//             </Box>

//             {/* Station */}
//             <Box>
//               <Text
//                 size='xs'
//                 fw={600}
//                 c='dimmed'
//                 tt='uppercase'
//                 mb={8}
//                 style={{ letterSpacing: 0.5 }}
//               >
//                 Station
//               </Text>
//               <SegmentedControl
//                 fullWidth
//                 size='md'
//                 radius='md'
//                 data={STATIONS.map(({ value, label, icon: Icon }) => ({
//                   value,
//                   label: (
//                     <Group gap={6} wrap='nowrap' justify='center'>
//                       <Icon size={14} />
//                       <span>{label}</span>
//                     </Group>
//                   )
//                 }))}
//                 {...form.getInputProps('station')}
//               />
//               <Text size='xs' c='dimmed' mt={6}>
//                 Choose which station will prepare this order.
//               </Text>
//             </Box>

//             {/* Customer code hint */}
//             <Paper
//               radius='md'
//               p='sm'
//               style={{
//                 background: 'var(--mantine-color-gray-0)',
//                 border: '1px solid var(--mantine-color-gray-2)'
//               }}
//             >
//               <Group gap='sm' wrap='nowrap'>
//                 <ThemeIcon variant='light' color='brand' size='md' radius='md'>
//                   <Sparkles size={14} />
//                 </ThemeIcon>
//                 <Text size='xs' c='dimmed' style={{ lineHeight: 1.4 }}>
//                   A <strong>customer code</strong> will be generated
//                   automatically when you create this order.
//                 </Text>
//               </Group>
//             </Paper>
//           </Stack>

//           {/* ---------- Footer actions (sm and up: inline) ---------- */}
//           <Divider visibleFrom='sm' />
//           <Group justify='space-between' p='md' visibleFrom='sm' wrap='nowrap'>
//             <Button
//               variant='default'
//               radius='md'
//               onClick={handleCancel}
//               style={{ flexShrink: 0 }}
//             >
//               Cancel
//             </Button>
//             <Button
//               type='submit'
//               radius='md'
//               loading={createOrder.isPending}
//               leftSection={<Receipt size={16} />}
//               style={{ flexShrink: 0 }}
//             >
//               Create Order
//             </Button>
//           </Group>
//         </form>
//       </Card>

//       {/* ---------- Mobile sticky bar (below sm): Cancel + Create ---------- */}
//       <Portal>
//         <Paper
//           shadow='lg'
//           radius={0}
//           hiddenFrom='sm'
//           style={{
//             position: 'fixed',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             zIndex: 200,
//             borderTop: '1px solid var(--mantine-color-gray-2)',
//             background: 'var(--mantine-color-body)',
//             paddingTop: 'var(--mantine-spacing-sm)',
//             paddingLeft: 'var(--mantine-spacing-md)',
//             paddingRight: 'var(--mantine-spacing-md)',
//             paddingBottom:
//               'calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom))'
//           }}
//         >
//           <Group gap='sm' grow wrap='nowrap'>
//             <Button
//               variant='default'
//               size='md'
//               radius='md'
//               onClick={handleCancel}
//             >
//               Cancel
//             </Button>
//             <Button
//               type='submit'
//               form='new-order-form'
//               size='md'
//               radius='md'
//               leftSection={<Receipt size={18} />}
//               loading={createOrder.isPending}
//             >
//               Create Order
//             </Button>
//           </Group>
//         </Paper>
//       </Portal>
//     </Box>
//   )
// }

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  Portal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  ChefHat,
  Wine,
  UtensilsCrossed,
  Hash,
  Sparkles,
  Receipt
} from 'lucide-react'
import { useCreateOrder } from '@/hooks/useOrders'
import { PageHeader } from '@/components/PageHeader'
import { getErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_app/orders/new')({
  component: NewOrderPage
})

const STATIONS = [
  { value: 'kitchen', label: 'Kitchen', icon: ChefHat },
  { value: 'bar', label: 'Bar', icon: Wine },
  { value: 'both', label: 'Both', icon: UtensilsCrossed }
] as const

const FORM_ID = 'new-order-form'

function NewOrderPage () {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  const form = useForm({
    initialValues: {
      table_number: '',
      station: 'both' as 'kitchen' | 'bar' | 'both'
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const order = await createOrder.mutateAsync({
        table_number: values.table_number || undefined,
        station: values.station
      })
      notifications.show({
        color: 'green',
        title: 'Order created',
        message: `Order ${order.order_ref} created`
      })
      navigate({ to: `/orders/${order.id}` })
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err)
      })
    }
  }

  const handleCancel = () => navigate({ to: '/orders' })

  return (
    <Box
      w='100%'
      maw='100%'
      style={{ overflowX: 'hidden' }}
      pb={{ base: 96, sm: 0 }}
    >
      {/* Header - on desktop the actions live here, always in view */}
      <PageHeader
        title='New Order'
        subtitle='Start a new customer order'
        actions={
          <Group gap='sm' visibleFrom='sm' wrap='nowrap'>
            <Button variant='default' radius='md' onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type='submit'
              form={FORM_ID}
              radius='md'
              loading={createOrder.isPending}
              leftSection={<Receipt size={16} />}
            >
              Create Order
            </Button>
          </Group>
        }
      />

      {/* Form card */}
      <Card
        withBorder
        radius='md'
        p={0}
        maw={520}
        w='100%'
        style={{ overflow: 'hidden' }}
      >
        <Group gap='sm' p='md' pb='sm' wrap='nowrap'>
          <ThemeIcon variant='light' color='brand' size='lg' radius='md'>
            <Receipt size={18} />
          </ThemeIcon>
          <Box style={{ minWidth: 0 }}>
            <Title order={5} fw={600}>
              Order details
            </Title>
            <Text size='xs' c='dimmed' mt={2} truncate>
              Just the essentials to get started
            </Text>
          </Box>
        </Group>

        <Divider />

        <form id={FORM_ID} onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap='md' p='md'>
            {/* Table number */}
            <Box>
              <Text
                size='xs'
                fw={600}
                c='dimmed'
                tt='uppercase'
                mb={6}
                style={{ letterSpacing: 0.5 }}
              >
                Table number
              </Text>
              <TextInput
                placeholder='e.g. 7'
                radius='md'
                leftSection={<Hash size={16} />}
                autoFocus
                styles={{ input: { fontVariantNumeric: 'tabular-nums' } }}
                {...form.getInputProps('table_number')}
              />
              <Text size='xs' c='dimmed' mt={4}>
                Leave blank if the customer is at the counter or taking away.
              </Text>
            </Box>

            {/* Station */}
            <Box>
              <Text
                size='xs'
                fw={600}
                c='dimmed'
                tt='uppercase'
                mb={6}
                style={{ letterSpacing: 0.5 }}
              >
                Station
              </Text>
              <SegmentedControl
                fullWidth
                radius='md'
                data={STATIONS.map(({ value, label, icon: Icon }) => ({
                  value,
                  label: (
                    <Group gap={6} wrap='nowrap' justify='center'>
                      <Icon size={14} />
                      <span>{label}</span>
                    </Group>
                  )
                }))}
                {...form.getInputProps('station')}
              />
              <Text size='xs' c='dimmed' mt={4}>
                Choose which station will prepare this order.
              </Text>
            </Box>

            {/* Customer code hint */}
            <Paper
              radius='md'
              p='sm'
              style={{ background: '#F8F9FA', border: '1px solid #E9ECEF' }}
            >
              <Group gap='sm' wrap='nowrap'>
                <ThemeIcon variant='light' color='brand' size='md' radius='md'>
                  <Sparkles size={14} />
                </ThemeIcon>
                <Text size='xs' c='dimmed' style={{ lineHeight: 1.4 }}>
                  A <strong>customer code</strong> will be generated
                  automatically when you create this order.
                </Text>
              </Group>
            </Paper>
          </Stack>
        </form>
      </Card>

      {/* Phone: sticky Cancel + Create, sitting above the bottom nav when there is one */}
      <Portal>
        <Paper
          shadow='lg'
          radius={0}
          hiddenFrom='sm'
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'var(--bottom-nav-height, 0px)',
            zIndex: 200,
            borderTop: '1px solid #E9ECEF',
            background: '#FFFFFF',
            padding: '10px 16px',
            paddingBottom:
              'calc(10px + var(--bottom-nav-safe-area, env(safe-area-inset-bottom)))'
          }}
        >
          <Group gap='sm' grow wrap='nowrap'>
            <Button
              variant='default'
              size='md'
              radius='md'
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form={FORM_ID}
              size='md'
              radius='md'
              leftSection={<Receipt size={18} />}
              loading={createOrder.isPending}
            >
              Create Order
            </Button>
          </Group>
        </Paper>
      </Portal>
    </Box>
  )
}
