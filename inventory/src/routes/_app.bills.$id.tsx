import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, Box, Button, Card, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowLeft, Ban, Banknote, BedDouble, CreditCard, Percent, Printer, Receipt } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { getErrorMessage } from '@/lib/api/client';
import { VoidBillModal } from '@/components/orders/VoidBillModal';
import { useBill } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { ApplyDiscountModal } from '@/components/orders/ApplyDiscountModal';
import { RecordPaymentModal } from '@/components/payments/RecordPaymentModal';
import { PayLaterModal } from '@/components/orders/PayLaterModal';
import { usePayLaterAction } from '@/hooks/usePayLater';
import { BillStatusBadge } from '@/components/orders/BillStatusBadge';
import { formatCurrency, formatDateTime, formatQty } from '@/lib/utils/format';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/bills/$id')({
  component: BillDetailPage,
});

const C = {
  navy: '#1F3A5F',
  muted: '#868E96',
  line: '#F1F3F5',
  red: '#C92A2A',
  blueBg: '#E7F5FF',
  blue: '#1864AB',
};

// Card with a small header; body is a list of rows, so it fits any screen width
function SectionCard({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" px="md" py="sm" wrap="nowrap" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={28} radius="md" variant="light" color="blue">
            {icon}
          </ThemeIcon>
          <Text fw={600} size="sm">
            {title}
          </Text>
        </Group>
        {right}
      </Group>
      {children}
    </Card>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <Box px="md" py="sm" style={{ borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
      {children}
    </Box>
  );
}

function BillDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const bill = useBill(id);
  const [discountOpen, { open: openDiscount, close: closeDiscount }] = useDisclosure(false);
  const [paymentOpen, { open: openPayment, close: closePayment }] = useDisclosure(false);
  const [voidOpen, { open: openVoid, close: closeVoid }] = useDisclosure(false);
  const [laterOpen, { open: openLater, close: closeLater }] = useDisclosure(false);
  const payLater = usePayLaterAction(id);

  if (bill.isLoading) return <LoadingState />;
  if (bill.error || !bill.data) return <EmptyState title="Bill not found" />;

  const b = bill.data;
  const canDiscount = b.status === 'open' && auth.hasPermission('bill.discount');
  const canPay = b.status === 'open' && (auth.hasPermission('payment.record') || (!!b.pay_later && auth.hasPermission('bill.pay_later')));
  const canPayLater = b.status === 'open' && !b.pay_later && auth.hasPermission('bill.pay_later');
  const canUndoLater = b.status === 'open' && !!b.pay_later && auth.hasPermission('bill.void');
  const undoLater = async () => {
    try {
      await payLater.mutateAsync({ kind: 'cancel' });
      notifications.show({ color: 'blue', title: 'Back to a normal unpaid bill', message: b.bill_ref });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not change', message: getErrorMessage(err) });
    }
  };
  // Branch manager only, and only before any money is recorded
  const canVoid = b.status === 'open' && !b.payment && auth.hasPermission('bill.void');
  const hasDiscount = parseFloat(b.discount_total) > 0;
  const lines = b.bill_lines ?? [];
  const table = b.order?.table_number;

  return (
    <>
      <Button
        component={Link}
        to="/bills"
        variant="subtle"
        color="gray"
        size="sm"
        leftSection={<ArrowLeft size={15} />}
        mb="xs"
        px="xs"
      >
        Back to bills
      </Button>

      <PageHeader
        title={b.bill_ref}
        subtitle={[table ? `Table ${table}` : null, b.customer_code, b.waiter?.full_name].filter(Boolean).join(' · ')}
        actions={
          <Group gap="xs">
            <BillStatusBadge status={b.status} paymentState={b.payment_state} />
            <Button
              leftSection={<Printer size={15} />}
              variant="default"
              size="sm"
              onClick={() => openPrint(`/bill/${b.id}`, 'Bill')}
            >
              Print
            </Button>
          </Group>
        }
      />

      {b.status === 'voided' && (
        <Text size="sm" mb="md" px="md" py="sm" style={{ background: '#F1F3F5', color: '#495057', borderRadius: 8 }}>
          This bill was voided. Nothing is owed and it does not count in sales.
        </Text>
      )}

      {b.pay_later && (
        <Card radius="md" p="sm" mb="md" style={{ background: b.status === 'open' ? '#FFF4E6' : '#EBFBEE', border: `1px solid ${b.status === 'open' ? '#FFD8A8' : '#B2F2BB'}` }}>
          <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <BedDouble size={18} color={b.status === 'open' ? '#D9480F' : '#2B8A3E'} style={{ flexShrink: 0, marginTop: 2 }} />
              <Box>
                <Text size="sm" fw={700} style={{ color: b.status === 'open' ? '#D9480F' : '#2B8A3E' }}>
                  {b.status === 'open' ? 'Guest pays later' : 'Paid later by the guest'}
                </Text>
                <Text size="sm">
                  {b.pay_later_guest}
                  {b.pay_later_room ? ` · room ${b.pay_later_room}` : ''}
                  {b.pay_later_phone ? ` · ${b.pay_later_phone}` : ''}
                </Text>
                {b.status === 'open' && b.pay_later_due && (
                  <Text size="xs" c="dimmed">Will pay by {dayjs(b.pay_later_due).format('ddd D MMM')}</Text>
                )}
                {b.pay_later_note && <Text size="xs" c="dimmed">"{b.pay_later_note}"</Text>}
              </Box>
            </Group>
            {canUndoLater && (
              <Button size="compact-xs" variant="subtle" color="gray" loading={payLater.isPending} onClick={undoLater}>Undo</Button>
            )}
          </Group>
        </Card>
      )}

      {(canPay || canDiscount || canVoid || canPayLater) && (
        <Group gap="sm" mb="md" grow preventGrowOverflow={false}>
          {canPay && (
            <Button size="md" leftSection={<Banknote size={18} />} onClick={openPayment}>
              Record Payment
            </Button>
          )}
          {canDiscount && (
            <Button size="md" variant="light" leftSection={<Percent size={18} />} onClick={openDiscount}>
              Discount
            </Button>
          )}
          {canPayLater && (
            <Button size="md" variant="light" color="orange" leftSection={<BedDouble size={18} />} onClick={openLater}>
              Pays later
            </Button>
          )}
          {canVoid && (
            <Button size="md" variant="light" color="red" leftSection={<Ban size={18} />} onClick={openVoid}>
              Void
            </Button>
          )}
        </Group>
      )}

      {/* Totals */}
      <Card withBorder radius="md" p={0} mb="md" style={{ overflow: 'hidden' }}>
        <Stack gap={6} px="md" py="sm">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Gross
            </Text>
            <Text size="sm" fw={600}>
              {formatCurrency(b.gross_total)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Discount
            </Text>
            <Text size="sm" fw={600} style={{ color: hasDiscount ? C.red : C.muted }}>
              {hasDiscount ? `−${formatCurrency(b.discount_total)}` : formatCurrency(0)}
            </Text>
          </Group>
        </Stack>
        <Group justify="space-between" px="md" py="sm" style={{ background: C.blueBg }}>
          <Text size="sm" fw={700} style={{ color: C.blue }}>
            Net total
          </Text>
          <Text fw={800} fz={22} style={{ color: C.blue }}>
            {formatCurrency(b.net_total)}
          </Text>
        </Group>
      </Card>

      {/* Lines */}
      <SectionCard
        icon={<Receipt size={15} />}
        title="Bill Lines"
        right={
          <Badge variant="light" color="gray" radius="sm">
            {lines.length} item{lines.length === 1 ? '' : 's'}
          </Badge>
        }
      >
        {lines.map((line, i) => (
          <Row key={line.id} last={i === lines.length - 1}>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={500}>
                  {line.description}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatQty(line.quantity)} × {formatCurrency(line.unit_price)}
                </Text>
              </Box>
              <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: C.navy }}>
                {formatCurrency(line.line_total)}
              </Text>
            </Group>
          </Row>
        ))}
      </SectionCard>

      {/* Discounts */}
      {b.discounts && b.discounts.length > 0 && (
        <SectionCard icon={<Percent size={15} />} title="Discounts">
          {b.discounts.map((d, i) => (
            <Row key={d.id} last={i === b.discounts!.length - 1}>
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={500}>
                    {d.reason}
                  </Text>
                  <Text size="xs" c="dimmed">
                    By {d.authorized_by_user?.full_name || '-'} · {formatDateTime(d.authorized_at)}
                  </Text>
                </Box>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: C.red }}>
                  −{formatCurrency(d.amount)}
                </Text>
              </Group>
            </Row>
          ))}
        </SectionCard>
      )}

      {/* Payment */}
      {b.payment && (
        <SectionCard icon={<CreditCard size={15} />} title="Payment" right={<StatBadge value={b.payment.status} />}>
          <Group justify="space-between" px="md" py={8} style={{ background: '#F8F9FA', borderBottom: `1px solid ${C.line}` }}>
            <Text size="xs" c="dimmed" fw={600}>
              Payment ref
            </Text>
            <Text size="xs" fw={600}>
              {b.payment.payment_ref}
            </Text>
          </Group>
          {b.payment_state === 'awaiting_verification' && (
            <Text size="xs" px="md" py={8} style={{ background: '#FFF4E6', color: '#D9480F' }}>
              Paid, but not yet confirmed. Cash is confirmed when the cashier confirms the waiter's cash drop; M-Pesa and card when
              the cashier verifies them.
            </Text>
          )}
          {(b.payment.payment_lines ?? []).map((pl, i, all) => (
            <Row key={pl.id} last={i === all.length - 1}>
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Stack gap={4} style={{ minWidth: 0 }}>
                  <Group gap={6} wrap="wrap">
                    <StatBadge value={pl.method} />
                    <StatBadge value={pl.verification_status} />
                  </Group>
                  {pl.transaction_ref && (
                    <Text size="xs" c="dimmed">
                      Ref {pl.transaction_ref}
                    </Text>
                  )}
                </Stack>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', color: C.navy }}>
                  {formatCurrency(pl.amount)}
                </Text>
              </Group>
            </Row>
          ))}
        </SectionCard>
      )}

      <Divider my="xs" color="transparent" />

      <ApplyDiscountModal opened={discountOpen} onClose={closeDiscount} billId={id} maxAmount={parseFloat(b.net_total)} />
      <VoidBillModal
        opened={voidOpen}
        onClose={closeVoid}
        billId={id}
        billRef={b.bill_ref}
        amount={parseFloat(b.net_total)}
        hasBar
      />
      <PayLaterModal opened={laterOpen} onClose={closeLater} billId={b.id} amount={parseFloat(b.net_total)} />
      <RecordPaymentModal
        opened={paymentOpen}
        onClose={closePayment}
        billId={id}
        billNetTotal={parseFloat(b.net_total)}
      />
    </>
  );
}
