// import { createFileRoute, Link } from '@tanstack/react-router';
// import { Button, Group, Text } from '@mantine/core';
// import { useDisclosure } from '@mantine/hooks';
// import { Check, Plus, X } from 'lucide-react';
// import { useState } from 'react';
// import { useAuth } from '@/lib/auth/useAuth';
// import { useCashDrops } from '@/hooks/usePayments';
// import { PageHeader } from '@/components/PageHeader';
// import { DataTable, Column } from '@/components/DataTable';
// import { StatBadge } from '@/components/StatBadge';
// import { RecordCashDropModal } from '@/components/payments/RecordCashDropModal';
// import { ConfirmCashDropModal } from '@/components/payments/ConfirmCashDropModal';
// import { RejectCashDropModal } from '@/components/payments/RejectCashDropModal';
// import { CashDrop } from '@/lib/api/payments';
// import { formatCurrency, formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/cash-drops/')({
//   component: CashDropsPage,
// });

// function CashDropsPage() {
//   const auth = useAuth();
//   const [page, setPage] = useState(1);
//   const [createOpen, { open: openCreate, close: closeCreate }] =
//     useDisclosure(false);
//   const [confirmOpen, { open: openConfirm, close: closeConfirm }] =
//     useDisclosure(false);
//   const [rejectOpen, { open: openReject, close: closeReject }] =
//     useDisclosure(false);
//   const [selected, setSelected] = useState<CashDrop | null>(null);

//   const query = useCashDrops({ page, limit: 20 });

//   const canDrop = auth.hasPermission('cash.drop');
//   const canVerify = auth.hasPermission('cash.drop.verify');

//   const columns: Column<CashDrop>[] = [
//     {
//       key: 'drop_ref',
//       header: 'Ref',
//       render: (r) => (
//         <Link
//           to="/cash-drops/$id"
//           params={{ id: r.id }}
//           style={{ textDecoration: 'none' }}
//         >
//           <Text c="blue" fw={500}>
//             {r.drop_ref}
//           </Text>
//         </Link>
//       ),
//     },
//     {
//       key: 'waiter',
//       header: 'Waiter',
//       render: (r) => r.waiter?.full_name || '-',
//     },
//     {
//       key: 'amount',
//       header: 'Amount',
//       align: 'right',
//       render: (r) => <Text fw={500}>{formatCurrency(r.total_amount)}</Text>,
//     },
//     {
//       key: 'dropped_at',
//       header: 'Dropped',
//       render: (r) => formatDateTime(r.dropped_at),
//     },
//     {
//       key: 'receiver',
//       header: 'Received By',
//       render: (r) =>
//         r.receiver?.full_name
//           ? `${r.receiver.full_name} (${r.receiver_role || ''})`
//           : '-',
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       render: (r) => <StatBadge value={r.status} />,
//     },
//     {
//       key: 'actions',
//       header: '',
//       align: 'right',
//       render: (r) => {
//         if (r.status === 'pending' && canVerify && r.waiter_id !== auth.user?.id) {
//           return (
//             <Group gap="xs" justify="flex-end">
//               <Button
//                 size="compact-sm"
//                 color="green"
//                 leftSection={<Check size={14} />}
//                 onClick={() => {
//                   setSelected(r);
//                   openConfirm();
//                 }}
//               >
//                 Confirm
//               </Button>
//               <Button
//                 size="compact-sm"
//                 color="red"
//                 variant="light"
//                 leftSection={<X size={14} />}
//                 onClick={() => {
//                   setSelected(r);
//                   openReject();
//                 }}
//               >
//                 Reject
//               </Button>
//             </Group>
//           );
//         }
//         return null;
//       },
//     },
//   ];

//   return (
//     <>
//       <PageHeader
//         title="Cash Drops"
//         subtitle="Immediate cash handovers - waiters record, cashiers verify"
//         actions={
//           canDrop ? (
//             <Button leftSection={<Plus size={16} />} onClick={openCreate}>
//               Record Drop
//             </Button>
//           ) : undefined
//         }
//       />
//       <DataTable
//         data={query.data?.data ?? []}
//         columns={columns}
//         loading={query.isLoading}
//         error={query.error ? 'Failed to load cash drops' : null}
//         rowKey={(r) => r.id}
//         meta={query.data?.meta}
//         onPageChange={setPage}
//         emptyTitle="No cash drops"
//         emptyDescription="Cash drops are recorded by waiters after receiving cash."
//       />
//       <RecordCashDropModal opened={createOpen} onClose={closeCreate} />
//       <ConfirmCashDropModal
//         opened={confirmOpen}
//         onClose={closeConfirm}
//         drop={selected}
//       />
//       <RejectCashDropModal
//         opened={rejectOpen}
//         onClose={closeReject}
//         drop={selected}
//       />
//     </>
//   );
// }



























import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button, Group, Text, Stack, Card, Box, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useCashDrops } from '@/hooks/usePayments';
import { PageHeader } from '@/components/PageHeader';
import { DayGroupedList } from '@/components/DayGroupedList';
import { DataTable, Column } from '@/components/DataTable';
import { StatBadge } from '@/components/StatBadge';
import { RecordCashDropModal } from '@/components/payments/RecordCashDropModal';
import { ConfirmCashDropModal } from '@/components/payments/ConfirmCashDropModal';
import { RejectCashDropModal } from '@/components/payments/RejectCashDropModal';
import { CashDrop } from '@/lib/api/payments';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/api/client';
import { ListToolbar, emptyToolbar, toolbarParams } from '@/components/ListToolbar';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Waiting for cashier' },
  { value: 'verified', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disputed', label: 'Disputed' },
];
const ROLE_LABEL: Record<string, string> = { cashier: 'Cashier', supervisor: 'Supervisor', manager: 'Manager' };
const receiverText = (r: CashDrop) =>
  r.receiver?.full_name
    ? `${r.receiver.full_name}${r.receiver_role ? ` · as ${ROLE_LABEL[r.receiver_role] || r.receiver_role}` : ''}`
    : 'Not yet confirmed';

export const Route = createFileRoute('/_app/cash-drops/')({
  component: CashDropsPage,
});

function CashDropsPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);
  const [rejectOpen, { open: openReject, close: closeReject }] =
    useDisclosure(false);
  const [selected, setSelected] = useState<CashDrop | null>(null);

  const navigate = useNavigate();
  const [filters, setFilters] = useState(emptyToolbar());
  const query = useCashDrops({ page, limit: 20, ...toolbarParams(filters) });
  const error = query.error ? getErrorMessage(query.error) : null;
  const meta = query.data?.meta;

  const canDrop = auth.hasPermission('cash.drop');
  const canVerify = auth.hasPermission('cash.drop.verify');

  const columns: Column<CashDrop>[] = [
    {
      key: 'drop_ref',
      header: 'Ref',
      render: (r) => (
        <Link
          to="/cash-drops/$id"
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>
            {r.drop_ref}
          </Text>
        </Link>
      ),
    },
    {
      key: 'waiter',
      header: 'Waiter',
      render: (r) => r.waiter?.full_name || '-',
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => <Text fw={500}>{formatCurrency(r.total_amount)}</Text>,
    },
    {
      key: 'dropped_at',
      header: 'Dropped',
      render: (r) => <Text size="sm" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.dropped_at)}</Text>,
    },
    {
      key: 'receiver',
      header: 'Received By',
      render: (r) => (
        <Text size="sm" c={r.receiver?.full_name ? undefined : 'dimmed'}>
          {receiverText(r)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatBadge value={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        if (r.status === 'pending' && canVerify && r.waiter_id !== auth.user?.id) {
          return (
            <Group gap="xs" justify="flex-end" wrap="nowrap" onClick={(e) => e.stopPropagation()}>
              <Button
                size="compact-sm"
                color="green"
                leftSection={<Check size={14} />}
                onClick={() => {
                  setSelected(r);
                  openConfirm();
                }}
              >
                Confirm
              </Button>
              <Button
                size="compact-sm"
                color="red"
                variant="light"
                leftSection={<X size={14} />}
                onClick={() => {
                  setSelected(r);
                  openReject();
                }}
              >
                Reject
              </Button>
            </Group>
          );
        }
        return null;
      },
    },
  ];

  const renderMobileCard = (r: CashDrop) => (
    <Card key={r.id} withBorder padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Link
            to="/cash-drops/$id"
            params={{ id: r.id }}
            style={{ textDecoration: 'none' }}
          >
            <Text c="blue" fw={600} size="sm">
              {r.drop_ref}
            </Text>
          </Link>
          <StatBadge value={r.status} />
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Waiter
          </Text>
          <Text size="sm" fw={500} ta="right">
            {r.waiter?.full_name || '-'}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Amount
          </Text>
          <Text size="sm" fw={600}>
            {formatCurrency(r.total_amount)}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Dropped
          </Text>
          <Text size="sm" ta="right">
            {formatDateTime(r.dropped_at)}
          </Text>
        </Group>

        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Received By
          </Text>
          <Text size="sm" ta="right">
            {receiverText(r)}
          </Text>
        </Group>

        {r.status === 'pending' &&
          canVerify &&
          r.waiter_id !== auth.user?.id && (
            <Group grow mt="xs">
              <Button
                size="compact-sm"
                color="green"
                leftSection={<Check size={14} />}
                onClick={() => {
                  setSelected(r);
                  openConfirm();
                }}
              >
                Confirm
              </Button>
              <Button
                size="compact-sm"
                color="red"
                variant="light"
                leftSection={<X size={14} />}
                onClick={() => {
                  setSelected(r);
                  openReject();
                }}
              >
                Reject
              </Button>
            </Group>
          )}
      </Stack>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Cash Drops"
        subtitle={
          meta
            ? `${meta.total} drop${meta.total === 1 ? '' : 's'} · waiters record, cashiers confirm`
            : 'Waiters record cash handed in, cashiers confirm it'
        }
        actions={
          canDrop ? (
            <Button leftSection={<Plus size={16} />} onClick={openCreate}>
              Record Drop
            </Button>
          ) : undefined
        }
      />

      <ListToolbar
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        placeholder="Search drop ref or waiter"
        statusOptions={STATUS_OPTIONS}
      />

      {/* Mobile view */}
      <Box hiddenFrom="sm">
        {query.isLoading && (
          <Text c="dimmed" ta="center" py="xl">
            Loading...
          </Text>
        )}
        {error && (
          <Stack align="center" py="xl" gap={4}>
            <Text fw={600}>Couldn't load cash drops</Text>
            <Text size="sm" c="dimmed">{error}</Text>
            <Button size="xs" variant="light" onClick={() => query.refetch()}>Try again</Button>
          </Stack>
        )}
        {!query.isLoading && !query.error && (
          <Stack gap="sm">
            {query.data?.data?.length ? (
              <DayGroupedList
                items={query.data.data}
                getDate={(d) => d.dropped_at}
                keyOf={(d) => d.id}
                render={renderMobileCard}
              />
            ) : (
              <Stack align="center" py="xl" gap="xs">
                <Text fw={500}>No cash drops</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Cash drops are recorded by waiters after receiving cash.
                </Text>
              </Stack>
            )}
          </Stack>
        )}
        {meta && meta.pages > 1 && (
          <Group justify="space-between" mt="md">
            <Button variant="default" size="sm" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>
              Previous
            </Button>
            <Text size="xs" c="dimmed">Page {meta.page} of {meta.pages}</Text>
            <Button variant="default" size="sm" disabled={meta.page >= meta.pages} onClick={() => setPage(meta.page + 1)}>
              Next
            </Button>
          </Group>
        )}
      </Box>

      {/* Desktop view */}
      <Box visibleFrom="sm">
        <DataTable
          data={query.data?.data ?? []}
          columns={columns}
          loading={query.isLoading}
          error={error}
          onRetry={() => query.refetch()}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate({ to: '/cash-drops/$id', params: { id: r.id } })}
          meta={query.data?.meta}
          onPageChange={setPage}
          emptyTitle="No cash drops"
          emptyDescription="Cash drops are recorded by waiters after receiving cash."
        />
      </Box>

      <RecordCashDropModal opened={createOpen} onClose={closeCreate} />
      <ConfirmCashDropModal
        opened={confirmOpen}
        onClose={closeConfirm}
        drop={selected}
      />
      <RejectCashDropModal
        opened={rejectOpen}
        onClose={closeReject}
        drop={selected}
      />
    </>
  );
}