// import { createFileRoute, Link } from '@tanstack/react-router';
// import { Button, Text } from '@mantine/core';
// import { useDisclosure } from '@mantine/hooks';
// import { Plus } from 'lucide-react';
// import { useState } from 'react';
// import { useAuth } from '@/lib/auth/useAuth';
// import { useStaffMeals } from '@/hooks/useOperations';
// import { PageHeader } from '@/components/PageHeader';
// import { DataTable, Column } from '@/components/DataTable';
// import { StatBadge } from '@/components/StatBadge';
// import { CreateStaffMealModal } from '@/components/staff-meals/CreateStaffMealModal';
// import { StaffMeal } from '@/lib/api/operations';
// import { formatCurrency, formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/staff-meals/')({
//   component: StaffMealsPage,
// });

// function StaffMealsPage() {
//   const auth = useAuth();
//   const [page, setPage] = useState(1);
//   const [open, { open: openModal, close }] = useDisclosure(false);
//   const query = useStaffMeals({ page, limit: 20 });

//   const canCreate =
//     auth.hasPermission('staff_meal.authorize') ||
//     auth.hasRole('supervisor', 'manager', 'admin');

//   const columns: Column<StaffMeal>[] = [
//     {
//       key: 'ref',
//       header: 'Ref',
//       render: (r) => (
//         <Link
//           to="/staff-meals/$id"
//           params={{ id: r.id }}
//           style={{ textDecoration: 'none' }}
//         >
//           <Text c="blue" fw={500}>{r.staff_meal_ref}</Text>
//         </Link>
//       ),
//     },
//     { key: 'staff', header: 'Staff', render: (r) => r.staff_name },
//     {
//       key: 'meal',
//       header: 'Meal',
//       render: (r) => <StatBadge value={r.meal_type} />,
//     },
//     { key: 'source', header: 'Source', render: (r) => r.source },
//     {
//       key: 'cost',
//       header: 'Cost',
//       align: 'right',
//       render: (r) => formatCurrency(r.total_cost),
//     },
//     {
//       key: 'authorized',
//       header: 'Authorized By',
//       render: (r) => r.authorized_by_user?.full_name || '-',
//     },
//     {
//       key: 'when',
//       header: 'When',
//       render: (r) => formatDateTime(r.authorized_at),
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       render: (r) => <StatBadge value={r.status} />,
//     },
//   ];

//   return (
//     <>
//       <PageHeader
//         title="Staff Meals"
//         subtitle="Meals consumed by staff from stock"
//         actions={
//           canCreate ? (
//             <Button leftSection={<Plus size={16} />} onClick={openModal}>
//               Record Meal
//             </Button>
//           ) : undefined
//         }
//       />
//       <DataTable
//         data={query.data?.data ?? []}
//         columns={columns}
//         loading={query.isLoading}
//         error={query.error ? 'Failed to load staff meals' : null}
//         rowKey={(r) => r.id}
//         meta={query.data?.meta}
//         onPageChange={setPage}
//         emptyTitle="No staff meals"
//         emptyDescription="Staff meals will appear here when recorded."
//       />
//       <CreateStaffMealModal opened={open} onClose={close} />
//     </>
//   );
// }

import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge, Button, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Calendar, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { useStaffMeals } from '@/hooks/useOperations'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { CreateStaffMealModal } from '@/components/staff-meals/CreateStaffMealModal'
import { BulkStaffMealModal } from '@/components/staff-meals/BulkStaffMealModal'
import { StaffMeal } from '@/lib/api/operations'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { Can } from '@/components/Can'

export const Route = createFileRoute('/_app/staff-meals/')({
  component: StaffMealsPage
})

function StaffMealsPage () {
  const auth = useAuth()
  const [page, setPage] = useState(1)
  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false)
  const [bulkOpen, { open: openBulk, close: closeBulk }] = useDisclosure(false)
  const query = useStaffMeals({ page, limit: 20 })

  const canCreate =
    auth.hasPermission('staff_meal.authorize') ||
    auth.hasRole('supervisor', 'manager')

  const columns: Column<StaffMeal>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: r => (
        <Link
          to='/staff-meals/$id'
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c='blue' fw={500}>
            {r.staff_meal_ref}
          </Text>
        </Link>
      )
    },
    { key: 'staff', header: 'Staff', render: r => r.staff_name },
    {
      key: 'meal',
      header: 'Meal',
      render: r => <StatBadge value={r.meal_type} />
    },
    { key: 'source', header: 'Source', render: r => r.source },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: r => formatCurrency(r.total_cost)
    },
    {
      key: 'issued',
      header: 'Issued By',
      render: r =>
        r.issued_by_user?.full_name || r.authorized_by_user?.full_name || '-'
    },
    {
      key: 'when',
      header: 'When',
      render: r => formatDateTime(r.authorized_at)
    },
    {
      key: 'status',
      header: 'Status',
      render: r => <StatBadge value={r.status} />
    }
  ]

  return (
    <>
      <PageHeader
        title='Staff Meals'
        subtitle='Meals consumed by staff from stock'
        actions={
          canCreate ? (
            <Group>
              <Link to='/staff-meals/daily' style={{ textDecoration: 'none' }}>
                <Button variant='light' leftSection={<Calendar size={16} />}>
                  Daily View
                </Button>
              </Link>
              <Can perm="staff_meal.authorize">
              <Button
                variant='light'
                leftSection={<Users size={16} />}
                onClick={openBulk}
              >
                Bulk Record
              </Button>
              </Can>
              <Can perm="staff_meal.authorize">
              <Button leftSection={<Plus size={16} />} onClick={openCreate}>
                Record Meal
              </Button>
              </Can>
            </Group>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load staff meals' : null}
        rowKey={r => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle='No staff meals'
        emptyDescription='Staff meals will appear here when recorded.'
      />
      <CreateStaffMealModal opened={createOpen} onClose={closeCreate} />
      <BulkStaffMealModal opened={bulkOpen} onClose={closeBulk} />
    </>
  )
}
