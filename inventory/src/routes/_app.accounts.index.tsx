import { useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, Box, Button, Group, Loader, Select, Stack, Text, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { BookOpen, Calculator, FileSpreadsheet, HandCoins, Landmark, Printer, ReceiptText, Sheet, Tags, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Pills, PRESETS, periodLabel, rangeOf, ReportTable, Tiles, tradingToday, type Preset } from '@/components/accounts/AccountsParts';
import { buildView, downloadCsv, TABS, type AccountsTab } from '@/components/accounts/reports';
import { DailySummaryCard } from '@/components/accounts/DailySummaryCard';
import { SupplierEntryModal } from '@/components/accounts/SupplierEntryModal';
import { VatSwitch } from '@/components/settings/VatSwitch';
import { useAccountsTab } from '@/hooks/useAccounts';
import { useProperties } from '@/hooks/useCore';
import { useAuth } from '@/lib/auth/useAuth';
import { downloadAccountsPack } from '@/lib/api/accounts';
import { getErrorMessage } from '@/lib/api/client';

const TAB_VALUES = TABS.map((t) => t.value);

import { openPrint } from '@/lib/print';

export const Route = createFileRoute('/_app/accounts/')({
  validateSearch: (s: Record<string, unknown>): { tab?: AccountsTab } => ({
    tab: TAB_VALUES.includes(s.tab as AccountsTab) ? (s.tab as AccountsTab) : undefined,
  }),
  component: AccountsPage,
});

/** The accountant's workspace: the books, worked out from what was recorded */
function AccountsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const tab = Route.useSearch().tab ?? 'daily';
  const meta = TABS.find((t) => t.value === tab)!;
  const groupLevel = auth.hasRole('md', 'admin', 'auditor', 'accountant');
  const canManage = auth.hasPermission('accounts.manage');

  const [preset, setPreset] = useState<Preset>('month');
  const [custom, setCustom] = useState<[string | null, string | null]>([null, null]);
  const [year, setYear] = useState(String(tradingToday().year()));
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [packing, setPacking] = useState(false);
  const properties = useProperties(1, 20);

  const [from, to] = preset === 'custom' ? [custom[0] || undefined, custom[1] || custom[0] || undefined] : rangeOf(preset);
  const params = { from, to, property_id: propertyId || undefined, year: Number(year) };
  const waiting = meta.dates !== 'now' && meta.dates !== 'year' && preset === 'custom' && !custom[0];
  const q = useAccountsTab(tab, params, !waiting);
  const view = useMemo(() => {
    if (!q.data) return null;
    try {
      return buildView(tab, q.data);
    } catch {
      return null; // data still from another tab: wait for this tab's
    }
  }, [q.data, tab]);

  const propName = (properties.data?.data ?? []).find((p) => p.id === propertyId)?.name ?? (groupLevel ? 'Both properties' : '');
  const period = meta.dates === 'year' ? year : meta.dates === 'now' ? `as of ${dayjs().format('D MMM YYYY')}` : meta.dates === 'asof' ? `close of ${periodLabel(to, to)}` : periodLabel(from, to);
  const setTab = (t: AccountsTab) => navigate({ to: '/accounts', search: { tab: t } });

  const printUrl = () => {
    const sp = new URLSearchParams({ tab, ...(from ? { from } : {}), ...(to ? { to } : {}), year, ...(propertyId ? { property_id: propertyId } : {}) });
    openPrint(`/accounts-print?${sp}`, 'Accounts');
  };
  const pack = async () => {
    setPacking(true);
    try {
      await downloadAccountsPack({ from, to, property_id: propertyId || undefined });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not download', message: getErrorMessage(err) });
    } finally {
      setPacking(false);
    }
  };

  return (
    <>
      <Group justify="space-between" align="flex-start" mb="sm" gap="sm">
        <Box style={{ minWidth: 0, flex: '1 1 260px' }}>
          <Title order={2}>Accounts</Title>
          <Text c="dimmed" size="sm">{meta.blurb}</Text>
        </Box>
        <Group gap="xs">
          <Button size="sm" color="#2B8A3E" leftSection={<FileSpreadsheet size={15} />} loading={packing} disabled={waiting} onClick={pack}>
            Excel pack
          </Button>
          <Button size="sm" variant="light" leftSection={<Sheet size={15} />} disabled={!view} onClick={() => view && downloadCsv(view, `${meta.label}, ${propName}, ${period}`, `${tab}-${to ?? year}.csv`)}>
            This tab
          </Button>
          <Button size="sm" variant="default" leftSection={<Printer size={15} />} disabled={!view} onClick={printUrl}>Print</Button>
        </Group>
      </Group>

      <DailySummaryCard groupLevel={groupLevel} propertyId={propertyId} />

      <Box mb="sm"><Pills items={TABS} value={tab} onChange={setTab} /></Box>

      <Stack gap={8} mb="md">
        {(meta.dates === 'range' || meta.dates === 'asof') && <Pills items={PRESETS} value={preset} onChange={setPreset} />}
        <Group gap="sm" align="flex-end" wrap="wrap">
          {(meta.dates === 'range' || meta.dates === 'asof') && preset === 'custom' && (
            <DatePickerInput
              type="range"
              allowSingleDateInRange
              placeholder="From - to"
              valueFormat="D MMM YYYY"
              maxDate={new Date()}
              value={custom}
              onChange={(v) => setCustom([v[0] ? dayjs(v[0]).format('YYYY-MM-DD') : null, v[1] ? dayjs(v[1]).format('YYYY-MM-DD') : null])}
              w={{ base: '100%', xs: 260 }}
            />
          )}
          {meta.dates === 'year' && (
            <Select
              w={{ base: '100%', xs: 140 }}
              data={Array.from({ length: 4 }, (_, i) => String(tradingToday().year() - i))}
              value={year}
              onChange={(v) => setYear(v || year)}
              allowDeselect={false}
            />
          )}
          {groupLevel && (
            <Select
              placeholder="Both properties"
              styles={{ input: { fontWeight: 700, color: '#1F3A5F', borderColor: '#1F3A5F', borderWidth: 2 } }}
              clearable
              w={{ base: '100%', xs: 200 }}
              data={(properties.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
              value={propertyId}
              onChange={setPropertyId}
            />
          )}
          {tab === 'suppliers' && canManage && (
            <Button color="#1F3A5F" leftSection={<HandCoins size={15} />} onClick={() => setPaying(true)} w={{ base: '100%', xs: 'auto' }}>
              Pay a supplier
            </Button>
          )}
          {q.isFetching && <Loader size={14} />}
        </Group>
        <Text size="xs" fw={700} c="#495057" tt="uppercase">{[propName, period].filter(Boolean).join(' · ')}</Text>
      </Stack>

      {tab === 'vat' && <VatSwitch />}
      {waiting ? (
        <EmptyState title="Pick the days" description="Choose a start and end date." />
      ) : q.isLoading || (!view && q.isFetching) ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : q.error || !view ? (
        <EmptyState title="Could not load" description={getErrorMessage(q.error)} />
      ) : (
        <>
          <Tiles tiles={view.tiles} />
          {view.note && <Alert color="gray" variant="light" mb="md" p="xs"><Text size="xs">{view.note}</Text></Alert>}
          <Stack gap="lg">
            {view.reports.map((r) => (
              <Box key={r.title}>
                <Text fw={700} size="sm" mb={6} c="#1F3A5F">{r.title}</Text>
                <ReportTable report={r} onRow={tab === 'suppliers' ? (id) => navigate({ to: '/accounts/suppliers/$id', params: { id } }) : undefined} />
              </Box>
            ))}
          </Stack>
        </>
      )}

      {tab === 'summary' && (
        <Box mt="xl">
          <Text fw={700} size="sm" mb={6} c="#1F3A5F">Also for the books</Text>
          <Group gap="xs">
            <Button variant="light" size="xs" leftSection={<Landmark size={14} />} component={Link} to="/finance">Income statement and month close</Button>
            <Button variant="light" size="xs" leftSection={<Calculator size={14} />} component={Link} to="/finance/cost-of-sales">Cost of sales</Button>
            <Button variant="light" size="xs" leftSection={<Tags size={14} />} component={Link} to="/finance/items">Profit per item</Button>
            <Button variant="light" size="xs" leftSection={<ReceiptText size={14} />} component={Link} to="/etims">eTIMS invoices</Button>
            <Button variant="light" size="xs" leftSection={<Wallet size={14} />} component={Link} to="/cash-handovers">Cash handovers</Button>
            <Button variant="light" size="xs" leftSection={<BookOpen size={14} />} component={Link} to="/stock/sheet">Stock sheet</Button>
          </Group>
        </Box>
      )}

      <SupplierEntryModal opened={paying} onClose={() => setPaying(false)} propertyId={propertyId} />
    </>
  );
}
