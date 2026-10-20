import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowLeftRight, Banknote, Check, ClipboardList, GlassWater, PenLine, Scale, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useApprovals, useDecideApproval } from '@/hooks/useNotifications';
import { getErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import type { ApprovalItem, ApprovalKind } from '@/lib/api/notifications';

dayjs.extend(relativeTime);

export const Route = createFileRoute('/_app/approvals')({
  component: ApprovalsPage,
});

const KIND: Record<ApprovalKind, { label: string; color: string; icon: React.ReactNode }> = {
  bar_order: { label: 'Bar order', color: '#862E9C', icon: <GlassWater size={14} /> },
  transfer: { label: 'Transfer', color: '#1971C2', icon: <ArrowLeftRight size={14} /> },
  adjustment: { label: 'Adjustment', color: '#E8590C', icon: <Scale size={14} /> },
  stock_take: { label: 'Stock take', color: '#2B8A3E', icon: <ClipboardList size={14} /> },
  signed_bill: { label: 'Signed bill', color: '#C92A2A', icon: <PenLine size={14} /> },
  waste: { label: 'Bar waste', color: '#E03131', icon: <Trash2 size={14} /> },
  petty_cash: { label: 'Petty cash', color: '#5F3DC4', icon: <Banknote size={14} /> },
};

const kindOf = (k: string) => KIND[k as ApprovalKind] ?? { label: 'Approval', color: '#495057', icon: <PenLine size={14} /> };

type Show = 'all' | ApprovalKind;

function ApprovalsPage() {
  const query = useApprovals();
  const decide = useDecideApproval();
  const [show, setShow] = useState<Show>('all');
  const [rejecting, setRejecting] = useState<ApprovalItem | null>(null);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState<ApprovalItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const data = query.data;
  const items = (data?.items ?? []).filter((i) => show === 'all' || i.kind === show);
  const c = data?.counts;

  const run = async (item: ApprovalItem, decision: 'approve' | 'reject', notes?: string) => {
    setBusyId(item.id);
    try {
      await decide.mutateAsync({ item, decision, notes });
      notifications.show({
        color: decision === 'approve' ? 'green' : 'orange',
        title: decision === 'approve' ? 'Approved' : 'Rejected',
        message: `${kindOf(item.kind).label} ${item.ref}`,
      });
      setRejecting(null);
      setConfirming(null);
      setReason('');
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not save', message: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle={c ? (c.total ? `${c.total} waiting for your decision` : 'Nothing waiting') : 'Everything waiting for a decision'}
      />

      <Group mb="md" gap="sm" wrap="wrap">
        <SegmentedControl
          value={show}
          onChange={(v) => setShow(v as Show)}
          data={[
            { value: 'all', label: `All${c?.total ? ` (${c.total})` : ''}` },
            { value: 'bar_order', label: `Bar${c?.bar_order ? ` (${c.bar_order})` : ''}` },
            { value: 'transfer', label: `Transfers${c?.transfer ? ` (${c.transfer})` : ''}` },
            { value: 'adjustment', label: `Adjustments${c?.adjustment ? ` (${c.adjustment})` : ''}` },
            { value: 'stock_take', label: `Counts${c?.stock_take ? ` (${c.stock_take})` : ''}` },
            { value: 'signed_bill', label: `Signed${c?.signed_bill ? ` (${c.signed_bill})` : ''}` },
            { value: 'waste', label: `Waste${c?.waste ? ` (${c.waste})` : ''}` },
            { value: 'petty_cash', label: `Petty cash${c?.petty_cash ? ` (${c.petty_cash})` : ''}` },
          ]}
        />
        {query.isFetching && <Loader size="xs" />}
      </Group>

      {query.isLoading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : query.error ? (
        <EmptyState title="Couldn't load approvals" description={getErrorMessage(query.error)} />
      ) : items.length === 0 ? (
        <EmptyState title="All clear" description="Large bar orders, transfers, adjustments and stock counts waiting for you will show here." />
      ) : (
        <Stack gap="sm">
          {items.map((item) => {
            const k = kindOf(item.kind);
            return (
              <Paper key={`${item.kind}-${item.id}`} withBorder radius="md" p="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="wrap">
                      <Badge
                        size="sm"
                        variant="light"
                        leftSection={k.icon}
                        style={{ color: k.color, backgroundColor: `${k.color}14` }}
                      >
                        {k.label}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {item.ref}
                      </Text>
                    </Group>
                    <Text fw={600} size="sm">
                      {item.title}
                    </Text>
                    {item.detail && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {item.detail}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {item.requested_by ? `${item.requested_by} · ` : ''}
                      {dayjs(item.created_at).fromNow()}
                    </Text>
                  </Stack>
                  {item.amount != null && (
                    <Text fw={700} size="sm" style={{ whiteSpace: 'nowrap', color: '#1F3A5F' }}>
                      {formatCurrency(item.amount)}
                    </Text>
                  )}
                </Group>
                <Group mt="sm" gap="xs" wrap="nowrap">
                  <Button
                    color="green"
                    style={{ flex: 1 }}
                    leftSection={<Check size={16} />}
                    loading={busyId === item.id && !rejecting}
                    disabled={!!busyId}
                    onClick={() => setConfirming(item)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    style={{ flex: 1 }}
                    leftSection={<X size={16} />}
                    disabled={!!busyId}
                    onClick={() => {
                      setRejecting(item);
                      setReason('');
                    }}
                  >
                    Reject
                  </Button>
                  <Button variant="subtle" color="gray" px="xs" component={Link} to={item.link}>
                    View
                  </Button>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Modal
        opened={!!confirming}
        onClose={() => setConfirming(null)}
        title={confirming ? `Approve ${kindOf(confirming.kind).label.toLowerCase()} ${confirming.ref}?` : ''}
      >
        <Stack>
          <Text size="sm">
            {confirming?.kind === 'signed_bill'
              ? `Are you sure? This bill was signed by the MD${confirming.amount != null ? ` (${formatCurrency(confirming.amount)})` : ''}. No money will be collected for it.`
              : confirming?.kind === 'petty_cash'
              ? `Are you sure? The cashier will pay out ${confirming.amount != null ? formatCurrency(confirming.amount) : 'this amount'} from the cash they hold.`
              : confirming?.kind === 'waste'
              ? 'Are you sure? The stock comes off the shelf now and is written off as waste.'
              : 'Are you sure you want to approve this?'}
          </Text>
          <Text size="xs" c="dimmed">Your name will be recorded as the one who authorised it.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button
              color="green"
              loading={!!confirming && busyId === confirming.id}
              onClick={() => confirming && run(confirming, 'approve')}
            >
              Yes, approve
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!rejecting}
        onClose={() => setRejecting(null)}
        title={rejecting ? `Reject ${kindOf(rejecting.kind).label.toLowerCase()} ${rejecting.ref}` : ''}
      >
        <Stack>
          <Textarea
            label="Reason"
            placeholder="e.g. Too large for one table, ask the customer to split"
            required
            autosize
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              disabled={!reason.trim()}
              loading={!!rejecting && busyId === rejecting.id}
              onClick={() => rejecting && run(rejecting, 'reject', reason.trim())}
            >
              Reject
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
