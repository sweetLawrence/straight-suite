// import { createFileRoute } from '@tanstack/react-router';
// import { Button, Text } from '@mantine/core';
// import { useDisclosure } from '@mantine/hooks';
// import { BadgeCheck } from 'lucide-react';
// import { useState } from 'react';
// import {
//   usePendingVerification,
//   useVerifyPaymentLine,
// } from '@/hooks/usePayments';
// import { PageHeader } from '@/components/PageHeader';
// import { DataTable, Column } from '@/components/DataTable';
// import { StatBadge } from '@/components/StatBadge';
// import { VerifyPaymentLineModal } from '@/components/payments/VerifyPaymentLineModal';
// import { PendingPaymentLine } from '@/lib/api/payments';
// import { formatCurrency, formatDateTime } from '@/lib/utils/format';

// export const Route = createFileRoute('/_app/payments/pending')({
//   component: PendingVerificationPage,
// });

// function PendingVerificationPage() {
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState<PendingPaymentLine | null>(null);
//   const [opened, { open, close }] = useDisclosure(false);
//   const query = usePendingVerification({ page, limit: 20 });

//   const columns: Column<PendingPaymentLine>[] = [
//     {
//       key: 'created',
//       header: 'Recorded',
//       render: (r) => formatDateTime(r.created_at),
//     },
//     {
//       key: 'waiter',
//       header: 'Waiter',
//       render: (r) => r.payment?.waiter?.full_name || '-',
//     },
//     {
//       key: 'bill',
//       header: 'Bill',
//       render: (r) => r.payment?.bill?.bill_ref || '-',
//     },
//     {
//       key: 'method',
//       header: 'Method',
//       render: (r) => <StatBadge value={r.method} />,
//     },
//     {
//       key: 'ref',
//       header: 'Reference',
//       render: (r) => (
//         <Text size="sm" c="dimmed">
//           {r.transaction_ref || '-'}
//         </Text>
//       ),
//     },
//     {
//       key: 'amount',
//       header: 'Amount',
//       align: 'right',
//       render: (r) => <Text fw={500}>{formatCurrency(r.amount)}</Text>,
//     },
//     {
//       key: 'actions',
//       header: '',
//       align: 'right',
//       render: (r) => (
//         <Button
//           size="compact-sm"
//           leftSection={<BadgeCheck size={14} />}
//           onClick={() => {
//             setSelected(r);
//             open();
//           }}
//         >
//           Verify
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <>
//       <PageHeader
//         title="Pending Verification"
//         subtitle="M-Pesa and card payments awaiting confirmation"
//       />
//       <DataTable
//         data={query.data?.data ?? []}
//         columns={columns}
//         loading={query.isLoading}
//         error={query.error ? 'Failed to load pending lines' : null}
//         rowKey={(r) => r.id}
//         meta={query.data?.meta}
//         onPageChange={setPage}
//         emptyTitle="Nothing pending"
//         emptyDescription="All payments are verified."
//       />
//       <VerifyPaymentLineModal opened={opened} onClose={close} line={selected} />
//     </>
//   );
// }

import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  BadgeCheck,
  Banknote,
  CreditCard,
  Smartphone,
  Coins,
  User,
  Receipt,
  Clock,
  Hash,
  ChevronRight,
  Inbox,
  FileText,
  Crown
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  usePendingVerification,
  useVerifyPaymentLine
} from '@/hooks/usePayments'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, Column } from '@/components/DataTable'
import { StatBadge } from '@/components/StatBadge'
import { VerifyPaymentLineModal } from '@/components/payments/VerifyPaymentLineModal'
import { PendingPaymentLine } from '@/lib/api/payments'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { getErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_app/payments/pending')({
  component: PendingVerificationPage
})

/* ------------------------------------------------------------------ */
/*  Method metadata                                                    */
/* ------------------------------------------------------------------ */

const METHOD_META: Record<
  string,
  { icon: ReactNode; color: string; label: string }
> = {
  cash: { icon: <Banknote size={12} />, color: 'green', label: 'Cash' },
  mpesa: { icon: <Smartphone size={12} />, color: 'teal', label: 'M-Pesa' },
  card: { icon: <CreditCard size={12} />, color: 'blue', label: 'Card' },
  cheque: { icon: <FileText size={12} />, color: 'indigo', label: 'Cheque' },
  house: { icon: <Crown size={12} />, color: 'pink', label: 'House (MD)' },
  other: { icon: <Coins size={12} />, color: 'gray', label: 'Other' }
}

function methodMeta (method: string) {
  return (
    METHOD_META[method.toLowerCase()] ?? {
      icon: <Coins size={12} />,
      color: 'gray',
      label: method
    }
  )
}

/* ------------------------------------------------------------------ */

function PendingVerificationPage () {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PendingPaymentLine | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const query = usePendingVerification({ page, limit: 20 })

  const handleVerify = (line: PendingPaymentLine) => {
    setSelected(line)
    open()
  }

  const columns: Column<PendingPaymentLine>[] = [
    {
      key: 'created',
      header: 'Recorded',
      render: r => {
        const [date, ...timeParts] = formatDateTime(r.created_at).split(' ')
        return (
          <Stack gap={0}>
            <Text size='sm'>{date}</Text>
            <Text size='xs' c='dimmed'>
              {timeParts.join(' ')}
            </Text>
          </Stack>
        )
      }
    },
    {
      key: 'waiter',
      header: 'Waiter',
      render: r =>
        r.payment?.waiter?.full_name ? (
          <Text size='sm'>{r.payment.waiter.full_name}</Text>
        ) : (
          <Text size='sm' c='dimmed'>
            Unassigned
          </Text>
        )
    },
    {
      key: 'bill',
      header: 'Bill',
      render: r =>
        r.payment?.bill?.bill_ref ? (
          <Text size='sm'>{r.payment.bill.bill_ref}</Text>
        ) : (
          <Text size='sm' c='dimmed'>
            -
          </Text>
        )
    },
    {
      key: 'method',
      header: 'Method',
      render: r => {
        const meta = methodMeta(r.method)
        return (
          <Badge
            variant='light'
            color={meta.color}
            size='sm'
            radius='sm'
            leftSection={meta.icon}
          >
            {meta.label}
          </Badge>
        )
      }
    },
    {
      key: 'ref',
      header: 'Reference',
      render: r =>
        r.transaction_ref ? (
          <Text size='sm' c='dimmed' ff='monospace' lineClamp={1}>
            {r.transaction_ref}
          </Text>
        ) : (
          <Text size='sm' c='dimmed'>
            -
          </Text>
        )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: r => (
        <Text size='sm' fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(r.amount)}
        </Text>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 110,
      render: r => (
        <Button
          size='compact-sm'
          radius='md'
          leftSection={<BadgeCheck size={14} />}
          onClick={() => handleVerify(r)}
        >
          Verify
        </Button>
      )
    }
  ]

  const lines = query.data?.data ?? []
  const meta = query.data?.meta
  const pendingCount = meta?.total ?? lines.length

  return (
    <>
      <PageHeader
        title='Pending Verification'
        subtitle='M-Pesa and card payments awaiting confirmation'
        actions={
          pendingCount > 0 ? (
            <Badge
              variant='light'
              color='orange'
              size='lg'
              radius='sm'
              leftSection={<Clock size={12} />}
            >
              {pendingCount} awaiting
            </Badge>
          ) : undefined
        }
      />

      {/* Mobile + tablet: card list. Desktop: table. */}
      <Box hiddenFrom='md'>
        <MobilePendingList
          lines={lines}
          loading={query.isLoading}
          error={query.error ? getErrorMessage(query.error, 'Failed to load pending lines') : null}
          meta={meta}
          onPageChange={setPage}
          onVerify={handleVerify}
        />
      </Box>

      <Box visibleFrom='md'>
        <DataTable
          data={lines}
          columns={columns}
          loading={query.isLoading}
          error={query.error ? getErrorMessage(query.error, 'Failed to load pending lines') : null}
          rowKey={r => r.id}
          meta={meta}
          onPageChange={setPage}
          emptyTitle='Nothing pending'
          emptyDescription='All payments are verified.'
        />
      </Box>

      <VerifyPaymentLineModal opened={opened} onClose={close} line={selected} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile pending list                                               */
/* ------------------------------------------------------------------ */

type PendingMeta = NonNullable<
  ReturnType<typeof usePendingVerification>['data']
>['meta']

function MobilePendingList ({
  lines,
  loading,
  error,
  meta,
  onPageChange,
  onVerify
}: {
  lines: PendingPaymentLine[]
  loading: boolean
  error: string | null
  meta?: PendingMeta
  onPageChange: (p: number) => void
  onVerify: (line: PendingPaymentLine) => void
}) {
  if (loading) {
    return (
      <Stack gap='sm'>
        {[0, 1, 2, 3].map(i => (
          <Card key={i} withBorder radius='md' p='md'>
            <Group justify='space-between' mb='xs'>
              <Box
                style={{
                  width: 100,
                  height: 14,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 4
                }}
              />
              <Box
                style={{
                  width: 70,
                  height: 24,
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 6
                }}
              />
            </Group>
            <Box
              style={{
                width: '55%',
                height: 12,
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 4,
                marginBottom: 10
              }}
            />
            <Box
              style={{
                width: '35%',
                height: 12,
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 4
              }}
            />
          </Card>
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Card withBorder radius='md' p='lg'>
        <Stack align='center' gap={4}>
          <Text fw={600} size='sm'>
            Couldn't load pending lines
          </Text>
          <Text size='xs' c='dimmed'>
            {error}
          </Text>
        </Stack>
      </Card>
    )
  }

  if (lines.length === 0) {
    return (
      <Card withBorder radius='md' p='xl'>
        <Stack align='center' gap={8}>
          <ThemeIcon variant='light' color='green' size='xl' radius='md'>
            <BadgeCheck size={26} />
          </ThemeIcon>
          <Text fw={600} size='sm'>
            All caught up
          </Text>
          <Text size='xs' c='dimmed' ta='center' maw={260}>
            Nothing is awaiting verification right now.
          </Text>
        </Stack>
      </Card>
    )
  }

  const totalPages = meta?.pages ?? 1
  const currentPage = meta?.page ?? 1

  return (
    <>
      <Stack gap='sm'>
        {lines.map(line => (
          <PendingLineCard
            key={line.id}
            line={line}
            onVerify={() => onVerify(line)}
          />
        ))}
      </Stack>

      {totalPages > 1 && (
        <Group justify='space-between' mt='md' px={4}>
          <Button
            variant='default'
            size='sm'
            radius='md'
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Text size='xs' c='dimmed'>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            variant='default'
            size='sm'
            radius='md'
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </Group>
      )}
    </>
  )
}

function PendingLineCard ({
  line,
  onVerify
}: {
  line: PendingPaymentLine
  onVerify: () => void
}) {
  const meta = methodMeta(line.method)
  const [date, ...timeParts] = formatDateTime(line.created_at).split(' ')
  const time = timeParts.join(' ')

  return (
    <Card withBorder radius='md' p='md'>
      {/* Row 1: method + amount */}
      <Group justify='space-between' align='center' mb='xs' wrap='nowrap'>
        <Badge
          variant='light'
          color={meta.color}
          size='md'
          radius='sm'
          leftSection={meta.icon}
        >
          {meta.label}
        </Badge>
        <Text
          fw={700}
          size='lg'
          style={{
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em'
          }}
        >
          {formatCurrency(line.amount)}
        </Text>
      </Group>

      {/* Row 2: reference */}
      {line.transaction_ref && (
        <Group gap={6} mb='xs' wrap='nowrap'>
          <Hash size={12} color='var(--mantine-color-gray-6)' />
          <Text size='xs' c='dimmed' ff='monospace' lineClamp={1}>
            {line.transaction_ref}
          </Text>
        </Group>
      )}

      {/* Row 3: bill + waiter */}
      <Group gap='lg' mb='sm' wrap='wrap'>
        {line.payment?.bill?.bill_ref && (
          <Group gap={6} wrap='nowrap'>
            <Receipt size={13} color='var(--mantine-color-gray-6)' />
            <Text size='sm'>{line.payment.bill.bill_ref}</Text>
          </Group>
        )}
        <Group gap={6} wrap='nowrap'>
          <User size={13} color='var(--mantine-color-gray-6)' />
          <Text
            size='sm'
            c={line.payment?.waiter?.full_name ? undefined : 'dimmed'}
            fs={line.payment?.waiter?.full_name ? undefined : 'italic'}
          >
            {line.payment?.waiter?.full_name || 'Unassigned'}
          </Text>
        </Group>
      </Group>

      <Divider my='xs' />

      {/* Row 4: time + action */}
      <Group justify='space-between' align='center' wrap='nowrap'>
        <Group gap={6} wrap='nowrap'>
          <Clock size={12} color='var(--mantine-color-gray-6)' />
          <Text size='xs' c='dimmed'>
            {date} · {time}
          </Text>
        </Group>
        <Button
          size='compact-sm'
          radius='md'
          leftSection={<BadgeCheck size={14} />}
          onClick={onVerify}
        >
          Verify
        </Button>
      </Group>
    </Card>
  )
}
