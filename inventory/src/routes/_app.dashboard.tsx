// import { createFileRoute, Link } from '@tanstack/react-router';
// import {
//   Badge,
//   Card,
//   Grid,
//   Group,
//   SimpleGrid,
//   Stack,
//   Text,
//   Title,
// } from '@mantine/core';
// import {
// Calendar, Clock, Building2, Users
// } from 'lucide-react';
// import { useAuth } from '@/lib/auth/useAuth';
// import {
//   useCurrentBusinessDay,
//   useCurrentShift,
//   useProperties,
//   useUsers,
// } from '@/hooks/useCore';
// import { PageHeader } from '@/components/PageHeader';
// import { formatDate, formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/dashboard')({
//   component: DashboardPage,
// });

// function StatCard({
//   icon,
//   label,
//   value,
//   sublabel,
//   color = 'blue',
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: React.ReactNode;
//   sublabel?: string;
//   color?: string;
// }) {
//   return (
//     <Card withBorder padding="lg">
//       <Group justify="space-between" mb="xs">
//         <Text size="sm" c="dimmed" fw={500}>
//           {label}
//         </Text>
//         <Badge color={color} variant="light" size="lg" circle>
//           {icon}
//         </Badge>
//       </Group>
//       <Text size="xl" fw={700}>
//         {value}
//       </Text>
//       {sublabel && (
//         <Text size="xs" c="dimmed" mt={4}>
//           {sublabel}
//         </Text>
//       )}
//     </Card>
//   );
// }

// function DashboardPage() {
//   const auth = useAuth();

//   const businessDay = useCurrentBusinessDay();
//   const shift = useCurrentShift();
//   const properties = useProperties(1, 5);
//   const users = useUsers(1, 1);

//   const propertyLabel =
//     auth.user?.roles[0]?.property_code ||
//     (auth.user?.primary_property_id ? 'Your Property' : 'Group');

//   return (
//     <>
//       <PageHeader
//         title={`Welcome, ${auth.user?.full_name}`}
//         subtitle={`${auth.user?.roles.map((r) => r.code).join(', ')} • ${propertyLabel}`}
//       />

//       <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
//         <StatCard
//           icon={<Calendar size={18} />}
//           label="Business Day"
//           value={
//             businessDay.isLoading
//               ? '…'
//               : businessDay.data
//               ? formatDate(businessDay.data.business_date)
//               : 'Not open'
//           }
//           sublabel={
//             businessDay.data
//               ? `Opened ${formatDateTime(businessDay.data.opened_at)}`
//               : 'No open business day'
//           }
//           color="blue"
//         />
//         <StatCard
//           icon={<Clock size={18} />}
//           label="Current Shift"
//           value={
//             shift.isLoading
//               ? '…'
//               : shift.data
//               ? shift.data.name
//               : 'Not open'
//           }
//           sublabel={
//             shift.data
//               ? `Opened ${formatDateTime(shift.data.opened_at)}`
//               : 'No open shift'
//           }
//           color="green"
//         />
//         <StatCard
//           icon={<Building2 size={18} />}
//           label="Properties"
//           value={properties.isLoading ? '…' : properties.data?.meta.total ?? 0}
//           sublabel={
//             auth.hasRole('md', 'admin')
//               ? 'All properties'
//               : 'Accessible to you'
//           }
//           color="violet"
//         />
//         <StatCard
//           icon={<Users size={18} />}
//           label="Users"
//           value={users.isLoading ? '…' : users.data?.meta.total ?? 0}
//           sublabel={auth.hasRole('md', 'admin') ? 'All users' : 'Property users'}
//           color="orange"
//         />
//       </SimpleGrid>

//       <Grid>
//         <Grid.Col span={{ base: 12, md: 6 }}>
//           <Card withBorder padding="lg">
//             <Title order={4} mb="sm">
//               Quick links
//             </Title>
//             <Stack gap="xs">
//               {auth.hasRole('waiter', 'supervisor', 'manager') && (
//                 <Text component={Link} to="/orders/new" c="blue">
//                   + New Order
//                 </Text>
//               )}
//               {auth.hasRole('store_manager', 'manager') && (
//                 <Text component={Link} to="/stock/batches" c="blue">
//                   → Stock batches
//                 </Text>
//               )}
//               {auth.hasRole('cashier', 'manager') && (
//                 <Text component={Link} to="/payments" c="blue">
//                   → Payments
//                 </Text>
//               )}
//               {auth.hasRole('manager', 'md') && (
//                 <Text component={Link} to="/reports" c="blue">
//                   → Reports
//                 </Text>
//               )}
//             </Stack>
//           </Card>
//         </Grid.Col>

//         <Grid.Col span={{ base: 12, md: 6 }}>
//           <Card withBorder padding="lg">
//             <Title order={4} mb="sm">
//               Your access
//             </Title>
//             <Stack gap={6}>
//               <Group gap="xs">
//                 <Text size="sm" fw={500}>
//                   Roles:
//                 </Text>
//                 {auth.user?.roles.map((r) => (
//                   <Badge key={r.code} variant="light">
//                     {r.code}
//                   </Badge>
//                 ))}
//               </Group>
//               <Group gap="xs">
//                 <Text size="sm" fw={500}>
//                   Permissions:
//                 </Text>
//                 <Text size="sm" c="dimmed">
//                   {auth.user?.permissions.length ?? 0} granted
//                 </Text>
//               </Group>
//             </Stack>
//           </Card>
//         </Grid.Col>
//       </Grid>
//     </>
//   );
// }






























import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import {
  Badge,
  Card,
  Grid,
  Group,
  SimpleGrid,
  Button,
  Stack,
  Text,
  Title,
  ThemeIcon,
  Anchor,
  Box,
} from '@mantine/core';
import { Calendar, Clock, Building2, Users, ArrowRight, Receipt } from 'lucide-react';
import { useBills } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils/format';
import { useAuth } from '@/lib/auth/useAuth';
import {
  useCurrentBusinessDay,
  useCurrentShift,
  useProperties,
  useUsers,
} from '@/hooks/useCore';
import { PageHeader } from '@/components/PageHeader';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { DayShiftPanel } from '@/components/DayShiftPanel';
import { permissionLabel, roleLabel } from '@/lib/utils/accessLabels';
import { useState } from 'react';

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardPage,
});

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  color?: string;
}) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" align="flex-start" mb="sm">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: 0.5 }}>
          {label}
        </Text>
        <ThemeIcon size={32} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="xl" fw={700} style={{ letterSpacing: '-0.01em' }}>
        {value}
      </Text>
      {sublabel && (
        <Text size="xs" c="dimmed" mt={6}>
          {sublabel}
        </Text>
      )}
    </Card>
  );
}

// The screens people open most, shown to whoever has the permission
const QUICK: { to: string; label: string; perm: string | string[] }[] = [
  { to: '/orders/new', label: 'New order', perm: 'order.create' },
  { to: '/store/queue', label: 'Dispatch queue', perm: 'store.queue.view' },
  { to: '/stock/sheet', label: 'Stock sheet', perm: ['store.queue.view', 'bar.report.view', 'report.view.property', 'report.view.group'] },
  { to: '/stock/bulk-issues', label: 'Bulk issues', perm: 'stock.bulk_issue' },
  { to: '/stock/batches', label: 'Receive stock', perm: 'stock.receive' },
  { to: '/bills', label: 'Open bills', perm: ['order.create', 'payment.record', 'bar.order.create'] },
  { to: '/purchase-orders', label: 'Purchase orders', perm: 'purchase.manage' },
  { to: '/production', label: 'Production', perm: ['production.create', 'production.complete'] },
  { to: '/setup-check', label: 'Setup check', perm: ['stock.item.manage', 'item.manage', 'user.manage'] },
  { to: '/stock/portion-rules', label: 'Portion rules', perm: 'stock.item.manage' },
  { to: '/transfers', label: 'Transfers', perm: 'transfer.approve' },
  { to: '/stock-takes', label: 'Stock counts', perm: 'stock_take.count' },
  { to: '/menu/sold-out', label: 'Sold out', perm: 'menu.soldout' },
  { to: '/approvals', label: 'Approvals', perm: 'adjustment.approve' },
  { to: '/cash-drops', label: 'Cash drops', perm: 'cash.drop' },
  { to: '/cash-handovers', label: 'Hand overs to MD', perm: 'cash.drop.verify' },
  { to: '/payments', label: 'Payments', perm: 'payment.verify' },
  { to: '/day-summary', label: 'Daily summary', perm: 'summary.view' },
  { to: '/kitchen', label: 'Kitchen day', perm: 'stock.bulk_issue' },
  { to: '/reports', label: 'Reports', perm: 'report.view.property' },
]

function QuickLink({
  to,
  children,
  show,
}: {
  to: string;
  children: React.ReactNode;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <Anchor
      component={Link}
      to={to}
      size="sm"
      fw={500}
      underline="never"
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <ArrowRight size={14} />
      {children}
    </Anchor>
  );
}


function DashboardPage() {
  const auth = useAuth();
  // The accountant starts on the books
  if (auth.user?.roles.every((r) => r.code === 'accountant')) return <Navigate to="/accounts" replace />;
  // The shared print computer only prints
  if (auth.user?.roles.every((r) => r.code === 'print_station')) return <Navigate to="/print-station" replace />;
  return <Dashboard />;
}

function Dashboard() {
  const auth = useAuth();
  // Unpaid bills: a waiter sees their own, everyone else sees the property's
  const mineOnly = auth.hasRole('waiter') && !auth.hasRole('cashier', 'manager', 'supervisor', 'md', 'admin');
  const canBills = auth.hasPermission('order.create') || auth.hasPermission('payment.record') || auth.hasPermission('bar.order.create');
  const openBills = useBills({ status: 'open', page: 1, limit: 100, ...(mineOnly ? { waiter_id: auth.user?.id } : {}) }, canBills);
  const openTotal = (openBills.data?.data ?? []).reduce((a, b) => a + Number(b.net_total || 0), 0);

  // MD/admin see one Day & Shift panel per property instead
  const singleProperty = !auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const businessDay = useCurrentBusinessDay(singleProperty);
  const shift = useCurrentShift(singleProperty);
  const properties = useProperties(1, 5);
  const users = useUsers(1, 1);
  const runsDay = auth.hasPermission('day.manage');
  const isGroupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const allProperties = useProperties(1, 20);

  // Full property name, not the code (MG → Mums' Garden)
  const propertyCode = auth.user?.roles.find((r) => r.property_code)?.property_code;
  const propertyLabel = propertyCode
    ? allProperties.data?.data.find((p) => p.code === propertyCode)?.name || propertyCode
    : isGroupLevel
    ? 'All properties'
    : 'Your property';
  const [showPerms, setShowPerms] = useState(false);
  const perms = [...(auth.user?.permissions ?? [])].sort((a, b) =>
    permissionLabel(a).localeCompare(permissionLabel(b))
  );

  return (
    <>
      <PageHeader
        title={`Welcome, ${auth.user?.full_name}`}
        subtitle={`${auth.user?.roles.map((r) => roleLabel(r.code)).join(', ')} • ${propertyLabel}`}
      />

      {runsDay && (
        <SimpleGrid cols={{ base: 1, md: isGroupLevel ? 2 : 1 }} mb="lg" maw={isGroupLevel ? undefined : 640}>
          {isGroupLevel
            ? (allProperties.data?.data || []).map((p) => (
                <DayShiftPanel key={p.id} propertyId={p.id} propertyName={p.name} />
              ))
            : <DayShiftPanel />}
        </SimpleGrid>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
        {!runsDay && (<>
        <StatCard
          icon={<Calendar size={16} />}
          label="Business Day"
          value={
            businessDay.isLoading
              ? '…'
              : businessDay.data
              ? formatDate(businessDay.data.business_date)
              : 'Not open'
          }
          sublabel={
            businessDay.data
              ? `Opened ${formatDateTime(businessDay.data.opened_at)}`
              : 'No open business day'
          }
          color="blue"
        />
        <StatCard
          icon={<Clock size={16} />}
          label="Current Shift"
          value={
            shift.isLoading ? '…' : shift.data ? shift.data.name : 'Not open'
          }
          sublabel={
            shift.data
              ? `Opened ${formatDateTime(shift.data.opened_at)}`
              : 'No open shift'
          }
          color="green"
        />
        </>)}
        {canBills && (
          <Link to="/bills" style={{ textDecoration: 'none', color: 'inherit' }}>
            <StatCard
              icon={<Receipt size={16} />}
              label="Open bills"
              value={openBills.isLoading ? '…' : openBills.data?.meta?.total ?? 0}
              sublabel={`${formatCurrency(openTotal)} not paid yet`}
              color="red"
            />
          </Link>
        )}
        <StatCard
          icon={<Building2 size={16} />}
          label="Properties"
          value={properties.isLoading ? '…' : properties.data?.meta.total ?? 0}
          sublabel={
            auth.hasRole('md', 'admin', 'auditor', 'accountant') ? 'All properties' : 'Accessible to you'
          }
          color="violet"
        />
        {auth.hasPermission('user.manage') && (
          <StatCard
            icon={<Users size={16} />}
            label="Users"
            value={users.isLoading ? '…' : users.data?.meta.total ?? 0}
            sublabel={auth.hasRole('md', 'admin', 'auditor', 'accountant') ? 'All users' : 'Property users'}
            color="orange"
          />
        )}
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg">
            <Title order={5} fw={600} mb="md">
              Quick links
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="xs">
              {QUICK.filter((l) => ([] as string[]).concat(l.perm).some((p) => auth.hasPermission(p))).map((l) => (
                <Button key={l.to} component={Link} to={l.to} variant="default" justify="flex-start" size="sm" radius="md" leftSection={<ArrowRight size={14} />} styles={{ label: { whiteSpace: 'normal', textAlign: 'left' } }}>
                  {l.label}
                </Button>
              ))}
            </SimpleGrid>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg">
            <Title order={5} fw={600} mb="md">
              Your access
            </Title>
            <Stack gap="sm">
              <Box>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={6} style={{ letterSpacing: 0.5 }}>
                  Roles
                </Text>
                <Group gap={6}>
                  {auth.user?.roles.map((r) => (
                    <Badge key={r.code} variant="light" radius="sm" size="md" tt="none">
                      {roleLabel(r.code)}
                    </Badge>
                  ))}
                </Group>
              </Box>
              <Box>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>
                  Permissions
                </Text>
                <Group gap="xs">
                  <Text size="sm">{perms.length} granted</Text>
                  {perms.length > 0 && (
                    <Anchor component="button" type="button" size="sm" onClick={() => setShowPerms((v) => !v)}>
                      {showPerms ? 'Hide' : 'Show what you can do'}
                    </Anchor>
                  )}
                </Group>
                {showPerms && (
                  <Stack gap={2} mt={6}>
                    {perms.map((p) => (
                      <Text key={p} size="sm" c="dimmed">
                        • {permissionLabel(p)}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
}