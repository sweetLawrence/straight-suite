import { createFileRoute } from '@tanstack/react-router';
import { Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useVarianceThresholds } from '@/hooks/useProduction';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { CreateThresholdModal } from '@/components/production/CreateThresholdModal';
import { VarianceThreshold } from '@/lib/api/production';

import { Can } from '@/components/Can';
export const Route = createFileRoute('/_app/variance-thresholds')({
  component: ThresholdsPage,
});

function ThresholdsPage() {
  const [open, { open: openModal, close }] = useDisclosure(false);
  const query = useVarianceThresholds({ limit: 100 });

  const columns: Column<VarianceThreshold>[] = [
    {
      key: 'item',
      header: 'Output Item',
      render: (t) => t.output_stock_item?.item?.name || 'Default (all items)',
    },
    {
      key: 'auto',
      header: 'Auto-accept %',
      align: 'right',
      render: (t) => t.auto_accept_pct,
    },
    {
      key: 'warning',
      header: 'Warning %',
      align: 'right',
      render: (t) => t.warning_pct,
    },
    {
      key: 'critical',
      header: 'Critical %',
      align: 'right',
      render: (t) => (
        <Text c="red" fw={500}>
          {t.critical_pct}
        </Text>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Variance Thresholds"
        subtitle="How much yield variance triggers warnings or exceptions"
        actions={
          <Can perm="production.authorize">
          <Button leftSection={<Plus size={16} />} onClick={openModal}>
            New Threshold
          </Button>
          </Can>
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load thresholds' : null}
        rowKey={(t) => t.id}
        emptyTitle="No thresholds configured"
        emptyDescription="Add thresholds to flag production variances."
      />
      <CreateThresholdModal opened={open} onClose={close} />
    </>
  );
}