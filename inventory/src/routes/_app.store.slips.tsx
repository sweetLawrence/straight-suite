// import { createFileRoute } from '@tanstack/react-router';
// import { useState } from 'react'
// import { Badge, Button, Group, Text } from '@mantine/core'
// import { Printer, Check } from 'lucide-react'
// import { notifications } from '@mantine/notifications'
// import { useStoreSlips, useReceiveSlip, useReprintSlip } from '@/hooks/useStore'
// import { PageHeader } from '@/components/PageHeader'
// import { DataTable, Column } from '@/components/DataTable'
// import { IssueSlip } from '@/lib/api/store'
// import { formatDateTime } from '@/lib/utils/format'

// export const Route = createFileRoute('/_app/store/slips')({
//   component: SlipsPage
// })

// function SlipsPage () {
//   const [page, setPage] = useState(1)
//   const query = useStoreSlips({ page, limit: 20 })
//   const receive = useReceiveSlip()
//   const reprint = useReprintSlip()

//   const handleReceive = async (id: string) => {
//     try {
//       await receive.mutateAsync(id)
//       notifications.show({ title: 'Acknowledged', color: 'green', message: '' })
//     } catch (err: any) {
//       notifications.show({
//         title: 'Failed',
//         message: err?.response?.data?.error || '',
//         color: 'red'
//       })
//     }
//   }

//   const handleReprint = async (id: string) => {
//     try {
//       await reprint.mutateAsync(id)
//       window.open(`/print/slip/${id}`, '_blank')
//     } catch (err: any) {
//       notifications.show({
//         title: 'Failed',
//         message: err?.response?.data?.error || '',
//         color: 'red'
//       })
//     }
//   }

//   const columns: Column<IssueSlip>[] = [
//    {
//   key: 'slip_ref',
//   header: 'Slip',
//   render: (r) => (
//     <Text
//       c="blue"
//       fw={500}
//       style={{ cursor: 'pointer' }}
//       onClick={() => openPrint(`/slip/${r.id}`, 'Issue slip')}
//     >
//       {r.slip_ref}
//     </Text>
//   ),
// },
//     {
//       key: 'order',
//       header: 'Order',
//       render: r => r.order?.order_ref || '-'
//     },
//     {
//       key: 'table',
//       header: 'Table',
//       render: r => r.order?.table_number || '-'
//     },
//     {
//       key: 'lines',
//       header: 'Lines',
//       render: r => r.issue_slip_lines?.length ?? 0
//     },
//     {
//       key: 'printed_at',
//       header: 'Printed',
//       render: r => formatDateTime(r.printed_at)
//     },
//     {
//       key: 'received',
//       header: 'Received',
//       render: r =>
//         r.received_at ? (
//           <Badge color='green' variant='light'>
//             {formatDateTime(r.received_at)}
//           </Badge>
//         ) : (
//           <Badge color='orange' variant='light'>
//             Pending
//           </Badge>
//         )
//     },
//     {
//       key: 'actions',
//       header: '',
//       render: r => (
//         <Group gap='xs'>
//           <Button
//             size='xs'
//             variant='light'
//             leftSection={<Printer size={14} />}
//             onClick={() => handleReprint(r.id)}
//             loading={reprint.isPending}
//           >
//             Print
//           </Button>
//           {!r.received_at && (
//             <Button
//               size='xs'
//               variant='light'
//               color='green'
//               leftSection={<Check size={14} />}
//               onClick={() => handleReceive(r.id)}
//               loading={receive.isPending}
//             >
//               Ack
//             </Button>
//           )}
//         </Group>
//       )
//     }
//   ]

//   return (
//     <>
//       <PageHeader
//         title='Issue Slips'
//         subtitle='Dispatched stock with printed tickets'
//       />
//       <DataTable
//         data={query.data?.data ?? []}
//         columns={columns}
//         loading={query.isLoading}
//         error={query.error ? 'Failed to load slips' : null}
//         rowKey={r => r.id}
//         meta={query.data?.meta}
//         onPageChange={setPage}
//         emptyTitle='No slips'
//         emptyDescription='Dispatched orders will appear here.'
//       />
//     </>
//   )
// }











// import { createFileRoute } from '@tanstack/react-router';
// import { useState } from 'react';
// import { Button, Group, Text } from '@mantine/core';
// import { Printer } from 'lucide-react';
// import { notifications } from '@mantine/notifications';
// import { useStoreSlips, useReprintSlip } from '@/hooks/useStore';
// import { PageHeader } from '@/components/PageHeader';
// import { DataTable, Column } from '@/components/DataTable';
// import { IssueSlip } from '@/lib/api/store';
// import { formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/store/slips')({
//   component: SlipsPage,
// });

// function SlipsPage() {
//   const [page, setPage] = useState(1);
//   const query = useStoreSlips({ page, limit: 20 });
//   const reprint = useReprintSlip();

//   const handleReprint = async (id: string) => {
//     try {
//       await reprint.mutateAsync(id);
//       openPrint(`/slip/${id}`, 'Issue slip');
//     } catch (err: any) {
//       notifications.show({
//         title: 'Failed',
//         message: err?.response?.data?.error || '',
//         color: 'red',
//       });
//     }
//   };

//   const columns: Column<IssueSlip>[] = [
//     {
//       key: 'slip_ref',
//       header: 'Slip',
//       render: (r) => (
//         <Text
//           c="blue"
//           fw={500}
//           style={{ cursor: 'pointer' }}
//           onClick={() => openPrint(`/slip/${r.id}`, 'Issue slip')}
//         >
//           {r.slip_ref}
//         </Text>
//       ),
//     },
//     {
//       key: 'order',
//       header: 'Order',
//       render: (r) => r.order?.order_ref || '-',
//     },
//     {
//       key: 'table',
//       header: 'Table',
//       render: (r) => r.order?.table_number || '-',
//     },
//     {
//       key: 'lines',
//       header: 'Lines',
//       render: (r) => r.issue_slip_lines?.length ?? 0,
//     },
//     {
//       key: 'printed_at',
//       header: 'Printed',
//       render: (r) => formatDateTime(r.printed_at),
//     },
//     {
//       key: 'printed_by',
//       header: 'By',
//       render: (r) => r.printed_by_user?.full_name || '-',
//     },
//     {
//       key: 'actions',
//       header: '',
//       render: (r) => (
//         <Group gap="xs">
//           <Button
//             size="xs"
//             variant="light"
//             leftSection={<Printer size={14} />}
//             onClick={() => handleReprint(r.id)}
//             loading={reprint.isPending}
//           >
//             Print
//           </Button>
//         </Group>
//       ),
//     },
//   ];

//   return (
//     <>
//       <PageHeader
//         title="Issue Slips"
//         subtitle="Dispatched stock with printed tickets"
//       />
//       <DataTable
//         data={query.data?.data ?? []}
//         columns={columns}
//         loading={query.isLoading}
//         error={query.error ? 'Failed to load slips' : null}
//         rowKey={(r) => r.id}
//         meta={query.data?.meta}
//         onPageChange={setPage}
//         emptyTitle="No slips"
//         emptyDescription="Dispatched orders will appear here."
//       />
//     </>
//   );
// }



















import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { Printer } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useStoreSlips, useReprintSlip } from '@/hooks/useStore';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { IssueSlip } from '@/lib/api/store';
import { formatDateTime } from '@/lib/utils/format';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/store/slips')({
  component: SlipsPage,
});

function SlipsPage() {
  const [page, setPage] = useState(1);
  const query = useStoreSlips({ page, limit: 20 });
  const reprint = useReprintSlip();

  const handleReprint = async (id: string) => {
    try {
      await reprint.mutateAsync(id);
      openPrint(`/slip/${id}`, 'Issue slip');
    } catch (err: any) {
      notifications.show({
        title: 'Failed',
        message: err?.response?.data?.error || '',
        color: 'red',
      });
    }
  };

  const columns: Column<IssueSlip>[] = [
    {
      key: 'slip_ref',
      header: 'Slip',
      render: (r) => (
        <Text
          c="blue"
          fw={500}
          style={{ cursor: 'pointer' }}
          onClick={() => openPrint(`/slip/${r.id}`, 'Issue slip')}
        >
          {r.slip_ref}
        </Text>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (r) => r.order?.order_ref || '-',
    },
    {
      key: 'table',
      header: 'Table',
      render: (r) => r.order?.table_number || '-',
    },
    {
      key: 'lines',
      header: 'Lines',
      render: (r) => r.issue_slip_lines?.length ?? 0,
    },
    {
      key: 'printed_at',
      header: 'Printed',
      render: (r) => formatDateTime(r.printed_at),
    },
    {
      key: 'printed_by',
      header: 'By',
      render: (r) => r.printed_by_user?.full_name || '-',
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<Printer size={14} />}
            onClick={() => handleReprint(r.id)}
            loading={reprint.isPending}
          >
            Print
          </Button>
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Issue Slips"
        subtitle="Dispatched stock with printed tickets"
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load slips' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No slips"
        emptyDescription="Dispatched orders will appear here."
      />
    </>
  );
}