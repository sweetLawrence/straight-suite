// import { Table, Text, Group, Pagination, Stack, Box } from '@mantine/core';
// import { ReactNode } from 'react';
// import { LoadingState } from './LoadingState';
// import { EmptyState } from './EmptyState';

// export interface Column<T> {
//   key: string;
//   header: ReactNode;
//   render: (row: T) => ReactNode;
//   width?: number | string;
//   align?: 'left' | 'center' | 'right';
// }

// interface DataTableProps<T> {
//   data: T[];
//   columns: Column<T>[];
//   loading?: boolean;
//   error?: string | null;
//   rowKey: (row: T) => string;
//   onRowClick?: (row: T) => void;
//   emptyTitle?: string;
//   emptyDescription?: string;
//   meta?: { total: number; page: number; limit: number; pages: number };
//   onPageChange?: (page: number) => void;
// }

// export function DataTable<T>({
//   data,
//   columns,
//   loading,
//   error,
//   rowKey,
//   onRowClick,
//   emptyTitle,
//   emptyDescription,
//   meta,
//   onPageChange,
// }: DataTableProps<T>) {
//   if (loading) return <LoadingState />;
//   if (error) {
//     return (
//       <EmptyState title="Failed to load" description={error} />
//     );
//   }
//   if (!data || data.length === 0) {
//     return <EmptyState title={emptyTitle} description={emptyDescription} />;
//   }

//   return (
//     <Stack gap="md">
//       <Box style={{ overflowX: 'auto' }}>
//         <Table striped highlightOnHover withTableBorder>
//           <Table.Thead>
//             <Table.Tr>
//               {columns.map((col) => (
//                 <Table.Th
//                   key={col.key}
//                   style={{
//                     width: col.width,
//                     textAlign: col.align || 'left',
//                   }}
//                 >
//                   {col.header}
//                 </Table.Th>
//               ))}
//             </Table.Tr>
//           </Table.Thead>
//           <Table.Tbody>
//             {data.map((row) => (
//               <Table.Tr
//                 key={rowKey(row)}
//                 onClick={onRowClick ? () => onRowClick(row) : undefined}
//                 style={onRowClick ? { cursor: 'pointer' } : undefined}
//               >
//                 {columns.map((col) => (
//                   <Table.Td
//                     key={col.key}
//                     style={{ textAlign: col.align || 'left' }}
//                   >
//                     {col.render(row)}
//                   </Table.Td>
//                 ))}
//               </Table.Tr>
//             ))}
//           </Table.Tbody>
//         </Table>
//       </Box>

//       {meta && meta.pages > 1 && onPageChange && (
//         <Group justify="flex-end">
//           <Text size="sm" c="dimmed">
//             {meta.total} total
//           </Text>
//           <Pagination
//             value={meta.page}
//             onChange={onPageChange}
//             total={meta.pages}
//           />
//         </Group>
//       )}
//     </Stack>
//   );
// }

import {
  Table,
  Text,
  Group,
  Pagination,
  Stack,
  Box,
  Center,
  Loader,
  Paper,
  Button,
  ThemeIcon
} from '@mantine/core'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { useIsMobile } from '@/hooks/useIsMobile'
import { DayGroupedList } from './DayGroupedList'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  meta?: { total: number; page: number; limit: number; pages: number }
  onPageChange?: (page: number) => void
  /** Shows a Try again button on errors */
  onRetry?: () => void
  /** Phones: show each row as a card ('cards', default) or keep the scrolling table */
  mobile?: 'cards' | 'table'
  /** Phones: group the cards under Today, Yesterday, Previous 7 days… using this date */
  groupByDate?: (row: T) => string | Date | null | undefined
}

export function DataTable<T> ({
  data,
  columns,
  loading,
  error,
  rowKey,
  onRowClick,
  emptyTitle,
  emptyDescription,
  meta,
  onPageChange,
  onRetry,
  mobile = 'cards',
  groupByDate
}: DataTableProps<T>) {
  const isMobile = useIsMobile()
  const showPagination = meta && meta.pages > 1 && onPageChange
  const isEmpty = !loading && !error && (!data || data.length === 0)
  const asCards = isMobile && mobile === 'cards'

  const errorBlock = (
    <Center py='xl'>
      <Stack align='center' gap={6} maw={420} px='md'>
        <ThemeIcon size={44} radius='xl' variant='light' color='red'>
          <AlertTriangle size={22} />
        </ThemeIcon>
        <Text fw={600}>Couldn't load this list</Text>
        <Text size='sm' c='dimmed' ta='center'>
          {error}
        </Text>
        {onRetry && (
          <Button size='xs' variant='light' leftSection={<RotateCw size={14} />} onClick={onRetry} mt={4}>
            Try again
          </Button>
        )}
      </Stack>
    </Center>
  )

  // Phones: one card per row. First column is the title, the rest are label / value pairs.
  const [first, ...rest] = columns
  const renderCard = (row: T) => (
    <Paper
      key={rowKey(row)}
      withBorder
      radius='md'
      p='sm'
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      style={{ cursor: onRowClick ? 'pointer' : undefined }}
    >
      {first && (
        <Box mb={rest.length ? 6 : 0} style={{ fontWeight: 600, fontSize: 14 }}>
          {first.render(row)}
        </Box>
      )}
      <Stack gap={4}>
        {rest.map(col => (
          <Group key={col.key} justify='space-between' wrap='nowrap' gap='md' align='center'>
            <Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
              {col.header}
            </Text>
            <Box style={{ fontSize: 13, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>
              {col.render(row)}
            </Box>
          </Group>
        ))}
      </Stack>
    </Paper>
  )

  const cards = (
    <Stack gap='xs'>
      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <Paper key={`skeleton-${i}`} withBorder radius='md' p='md'>
            <Box style={{ height: 12, width: '60%', borderRadius: 4, background: '#F1F3F5' }} />
            <Box mt={10} style={{ height: 10, width: '85%', borderRadius: 4, background: '#F1F3F5' }} />
          </Paper>
        ))}
      {!loading && !error && groupByDate && data.length > 0 && (
        <DayGroupedList items={data} getDate={groupByDate} keyOf={rowKey} gap='xs' render={row => renderCard(row)} />
      )}
      {!loading && !error && !groupByDate && data.map(row => renderCard(row))}
      {isEmpty && (
        <Center py='xl'>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </Center>
      )}
      {error && !loading && errorBlock}
    </Stack>
  )

  return (
    <Stack gap={0}>
      {asCards ? cards : (
      <Box style={{ overflowX: 'auto' }}>
        <Table
          horizontalSpacing='md'
          verticalSpacing='sm'
          highlightOnHover
          highlightOnHoverColor='var(--mantine-color-gray-0)'
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <Table.Thead>
            <Table.Tr
              style={{
                background: 'var(--mantine-color-gray-0)',
                borderBottom: '1px solid var(--mantine-color-gray-3)'
              }}
            >
              {columns.map(col => (
                <Table.Th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                    paddingTop: 10,
                    paddingBottom: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--mantine-color-gray-6)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.header}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={`skeleton-${i}`}>
                  {columns.map(col => (
                    <Table.Td
                      key={col.key}
                      style={{
                        borderBottom: '1px solid var(--mantine-color-gray-2)'
                      }}
                    >
                      <Box
                        style={{
                          height: 12,
                          borderRadius: 4,
                          background:
                            'linear-gradient(90deg, var(--mantine-color-gray-1) 25%, var(--mantine-color-gray-2) 50%, var(--mantine-color-gray-1) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s ease-in-out infinite',
                          width:
                            i % 3 === 0 ? '60%' : i % 3 === 1 ? '80%' : '45%'
                        }}
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}

            {!loading &&
              !error &&
              data.map(row => (
                <Table.Tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    cursor: onRowClick ? 'pointer' : undefined,
                    transition: 'background 120ms ease'
                  }}
                >
                  {columns.map(col => (
                    <Table.Td
                      key={col.key}
                      style={{
                        textAlign: col.align || 'left',
                        borderBottom: '1px solid var(--mantine-color-gray-2)',
                        paddingTop: 12,
                        paddingBottom: 12,
                        verticalAlign: 'middle'
                      }}
                    >
                      {col.render(row)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}

            {isEmpty && (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ padding: 0 }}>
                  <Center py='xl'>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}

            {error && !loading && (
              <Table.Tr>
                <Table.Td colSpan={columns.length} style={{ padding: 0 }}>
                  {errorBlock}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
      )}

      {showPagination && (
        <Group
          justify={asCards ? 'center' : 'space-between'}
          px={asCards ? 0 : 'lg'}
          py='md'
          gap='xs'
          style={asCards ? undefined : {
            borderTop: '1px solid var(--mantine-color-gray-2)',
            background: 'var(--mantine-color-gray-0)'
          }}
        >
          <Text size='xs' c='dimmed' fw={500}>
            Showing{' '}
            <Text span fw={600} c='dark.7'>
              {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)}
            </Text>{' '}
            of{' '}
            <Text span fw={600} c='dark.7'>
              {meta.total}
            </Text>
          </Text>
          <Pagination
            value={meta.page}
            onChange={onPageChange}
            total={meta.pages}
            size='sm'
            radius='md'
            withEdges={!asCards}
            siblings={asCards ? 0 : 1}
          />
        </Group>
      )}
    </Stack>
  )
}
