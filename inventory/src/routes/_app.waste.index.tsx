import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Button, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Crown, Plus } from 'lucide-react';
import { HouseUseModal } from '@/components/stock/HouseUseModal';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useWasteList } from '@/hooks/useOperations';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { CreateWasteModal } from '@/components/waste/CreateWasteModal';
import { WasteRecord } from '@/lib/api/operations';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_app/waste/')({
  component: WastePage,
});

function WastePage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [open, { open: openModal, close }] = useDisclosure(false);
  const [houseOpen, { open: openHouse, close: closeHouse }] = useDisclosure(false);
  const query = useWasteList({ page, limit: 20 });

  const canCreate =
    auth.hasPermission('stock.issue') || auth.hasRole('manager');
  const canHouse = auth.hasPermission('stock.house_use');

  const columns: Column<WasteRecord>[] = [
    {
      key: 'ref',
      header: 'Ref',
      render: (r) => (
        <Link
          to="/waste/$id"
          params={{ id: r.id }}
          style={{ textDecoration: 'none' }}
        >
          <Text c="blue" fw={500}>{r.waste_ref}</Text>
        </Link>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (r) => r.stock_item?.item?.name || '-',
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      render: (r) => `${formatNumber(r.quantity, 3)} ${r.unit?.code || ''}`,
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: (r) => formatCurrency(r.cost_amount),
    },
    { key: 'reason', header: 'Reason', render: (r) => r.reason },
    {
      key: 'status',
      header: 'Status',
      render: (r) =>
        r.status === 'pending' ? (
          <Badge color="yellow" variant="light">Waiting for the manager</Badge>
        ) : r.status === 'rejected' ? (
          <Badge color="red" variant="light">Rejected</Badge>
        ) : (
          <Badge color="teal" variant="light">{r.decided_by_user ? `Approved by ${r.decided_by_user.full_name}` : 'Recorded'}</Badge>
        ),
    },
    {
      key: 'when',
      header: 'When',
      render: (r) => formatDateTime(r.recorded_at),
    },
  ];

  return (
    <>
      <PageHeader
        title="Waste Records"
        subtitle="Spoilage, breakage, expired stock"
        actions={
          canCreate || canHouse ? (
            <Group gap="xs">
              {canHouse && (
                <Button variant="light" color="pink" leftSection={<Crown size={16} />} onClick={openHouse}>
                  House use
                </Button>
              )}
              {canCreate && (
                <Button leftSection={<Plus size={16} />} onClick={openModal}>
                  Record Waste
                </Button>
              )}
            </Group>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? getErrorMessage(query.error, 'Failed to load waste records') : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No waste recorded"
        emptyDescription="Waste records will appear here."
      />
      <CreateWasteModal opened={open} onClose={close} />
      <HouseUseModal opened={houseOpen} onClose={closeHouse} />
    </>
  );
}