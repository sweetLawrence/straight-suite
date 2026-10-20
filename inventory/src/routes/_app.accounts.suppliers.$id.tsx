import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ActionIcon, Box, Button, Card, Group, Loader, Modal, Select, Stack, Text, Textarea, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { ArrowLeft, Ban, HandCoins, Printer, Sheet } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ReportTable, Tiles } from '@/components/accounts/AccountsParts';
import { downloadCsv, fmtCell, statementReport } from '@/components/accounts/reports';
import { SupplierEntryModal } from '@/components/accounts/SupplierEntryModal';
import { useSupplierEntry, useSupplierStatement } from '@/hooks/useAccounts';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { getErrorMessage } from '@/lib/api/client';
import { useIsMobile } from '@/hooks/useIsMobile';

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/accounts/suppliers/$id')({ component: SupplierStatementPage });

/** One supplier's account: deliveries, payments and credits with a running balance */
function SupplierStatementPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const isMobile = useIsMobile();
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canManage = auth.hasPermission('accounts.manage');
  const properties = useProperties(1, 20);
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const { voidEntry } = useSupplierEntry();
  const params = { from: range[0] || undefined, to: range[1] || range[0] || undefined, property_id: propertyId || undefined };
  const q = useSupplierStatement(id, params);
  const s = q.data;
  const report = useMemo(() => (s ? statementReport(s) : null), [s]);

  // Entries recorded here (not deliveries) can be voided
  const voidable = (s?.lines ?? []).filter((l) => l.kind !== 'delivery' && l.status === 'recorded');

  const printUrl = () => {
    const sp = new URLSearchParams({ tab: 'supplier', id, ...(params.from ? { from: params.from } : {}), ...(params.to ? { to: params.to } : {}), ...(propertyId ? { property_id: propertyId } : {}) });
    openPrint(`/accounts-print?${sp}`, 'Accounts');
  };

  const doVoid = () =>
    voidEntry.mutate(
      { id: voiding!, reason: reason.trim() },
      {
        onSuccess: () => {
          notifications.show({ color: 'green', title: 'Voided', message: 'The entry no longer counts.' });
          setVoiding(null);
          setReason('');
        },
        onError: (err) => notifications.show({ color: 'red', title: 'Could not void', message: getErrorMessage(err) }),
      },
    );

  return (
    <>
      <Button variant="subtle" size="xs" leftSection={<ArrowLeft size={14} />} component={Link} to="/accounts" search={{ tab: 'suppliers' } as never} mb="xs" px={4}>
        Suppliers
      </Button>
      <Group justify="space-between" align="flex-start" mb="md" gap="sm">
        <Box style={{ minWidth: 0, flex: '1 1 240px' }}>
          <Title order={2}>{s?.supplier.name ?? 'Supplier'}</Title>
          <Text c="dimmed" size="sm">
            {[s?.supplier.phone, s?.supplier.kra_pin ? `PIN ${s.supplier.kra_pin}` : null, s?.supplier.payment_terms].filter(Boolean).join(' · ') || 'Supplier statement'}
          </Text>
        </Box>
        <Group gap="xs">
          {canManage && <Button size="sm" color="#1F3A5F" leftSection={<HandCoins size={15} />} onClick={() => setPaying(true)}>Pay or credit</Button>}
          <Button size="sm" variant="light" leftSection={<Sheet size={15} />} disabled={!report}
            onClick={() => report && downloadCsv({ tiles: [], reports: [report] }, `${s!.supplier.name} statement`, `supplier-${s!.supplier.name.replace(/\W+/g, '-').toLowerCase()}.csv`)}>
            Excel
          </Button>
          <Button size="sm" variant="default" leftSection={<Printer size={15} />} disabled={!report} onClick={printUrl}>Print</Button>
        </Group>
      </Group>

      <Group gap="sm" mb="md" align="flex-end" wrap="wrap">
        <DatePickerInput
          type="range"
          allowSingleDateInRange
          clearable
          placeholder="All time"
          valueFormat="D MMM YYYY"
          maxDate={new Date()}
          value={range}
          onChange={(v) => setRange([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
          w={{ base: '100%', xs: 260 }}
        />
        {groupLevel && (
          <Select placeholder="Both properties" clearable w={{ base: '100%', xs: 200 }}
            data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))} value={propertyId} onChange={setPropertyId} />
        )}
        {q.isFetching && <Loader size={14} />}
      </Group>

      {q.isLoading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : !s || !report ? (
        <EmptyState title="Could not load" description={getErrorMessage(q.error)} />
      ) : (
        <>
          <Tiles
            tiles={[
              { label: 'We owe', value: s.balance, color: s.balance > 0 ? '#C92A2A' : '#2B8A3E', bg: s.balance > 0 ? '#FFF5F5' : '#EBFBEE', hint: `As of ${dayjs(s.to).format('D MMM YYYY')}` },
              { label: 'Delivered', value: s.lines.filter((l) => l.kind === 'delivery').reduce((a, l) => a + l.credit, 0), color: '#D9480F', bg: '#FFF4E6', hint: s.from ? 'In the dates picked' : 'All time' },
              { label: 'Paid', value: s.lines.filter((l) => l.kind === 'payment' && l.status === 'recorded').reduce((a, l) => a + l.debit, 0), color: '#2B8A3E', bg: '#EBFBEE' },
              { label: 'Brought forward', value: s.brought_forward, color: '#495057', bg: '#F1F3F5' },
            ]}
          />
          <ReportTable report={report} />

          {canManage && voidable.length > 0 && (
            <Card withBorder radius="md" mt="lg" p="sm" style={{ borderColor: '#DEE2E6' }}>
              <Text fw={700} size="sm" mb={6}>Entries recorded here</Text>
              <Text size="xs" c="dimmed" mb="xs">A wrong entry is voided with a reason, never deleted.</Text>
              <Stack gap={6}>
                {voidable.map((l) => (
                  <Group key={l.id} justify="space-between" wrap="nowrap" gap="xs">
                    <Text size="sm" style={{ minWidth: 0 }}>
                      {dayjs(l.date).format('D MMM')} · {l.label} · KES {fmtCell(l.debit || l.credit, 'money')}{l.ref ? ` · ${l.ref}` : ''}
                    </Text>
                    <ActionIcon variant="light" color="red" aria-label="Void" onClick={() => setVoiding(l.id)}><Ban size={15} /></ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}
        </>
      )}

      <SupplierEntryModal opened={paying} onClose={() => setPaying(false)} supplierId={id} propertyId={propertyId} />
      <Modal opened={!!voiding} onClose={() => setVoiding(null)} title="Void this entry" centered fullScreen={isMobile}>
        <Stack gap="sm">
          <Textarea label="Why?" placeholder="e.g. Entered twice" value={reason} onChange={(e) => setReason(e.currentTarget.value)} autosize minRows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoiding(null)}>Cancel</Button>
            <Button color="red" disabled={reason.trim().length < 3} loading={voidEntry.isPending} onClick={doVoid}>Void</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
