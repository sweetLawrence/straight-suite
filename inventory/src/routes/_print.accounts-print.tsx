import { useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Group, Loader } from '@mantine/core';
import dayjs from 'dayjs';
import { Printer } from 'lucide-react';
import { PrintTable, periodLabel } from '@/components/accounts/AccountsParts';
import { buildView, fmtCell, statementReport, TABS, type AccountsTab, type View } from '@/components/accounts/reports';
import { useAccountsTab, useSupplierStatement } from '@/hooks/useAccounts';
import { useProperties } from '@/hooks/useCore';

import { PrintLogo } from '@/components/PrintLogo';
import { isEmbed } from '@/lib/print';

export const Route = createFileRoute('/_print/accounts-print')({ component: AccountsPrint });

/** Any accounts tab (or a supplier statement) on A4, with sign-off lines */
function AccountsPrint() {
  const p = useMemo(() => Object.fromEntries(new URLSearchParams(window.location.search)), []);
  const isSupplier = p.tab === 'supplier';
  const tab = (TABS.some((t) => t.value === p.tab) ? p.tab : 'daily') as AccountsTab;
  const meta = TABS.find((t) => t.value === tab)!;
  const params = { from: p.from || undefined, to: p.to || undefined, property_id: p.property_id || undefined, year: Number(p.year) || undefined };
  const q = useAccountsTab(tab, params, !isSupplier);
  const sq = useSupplierStatement(isSupplier ? p.id : '', params);
  const props = useProperties(1, 20);

  const view: View | null = isSupplier
    ? sq.data ? { tiles: [], reports: [statementReport(sq.data)] } : null
    : q.data ? buildView(tab, q.data) : null;

  useEffect(() => {
    if (view) {
      if (isEmbed) return;
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [!!view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!view) return <Group justify="center" mt="xl"><Loader /></Group>;

  const prop = (props.data?.data ?? []).find((x) => x.id === p.property_id);
  const where = prop?.name ?? 'Straight Group (both properties)';
  const title = isSupplier ? `Supplier statement: ${sq.data?.supplier.name}` : meta.label;
  const period = isSupplier
    ? p.from ? periodLabel(p.from, p.to || p.from) : `All time to ${dayjs().format('D MMM YYYY')}`
    : meta.dates === 'year' ? `Year ${p.year}` : meta.dates === 'now' ? `As of ${dayjs().format('D MMM YYYY HH:mm')}` : meta.dates === 'asof' ? `Close of ${periodLabel(p.to, p.to)}` : periodLabel(p.from, p.to);
  const wide = view.reports.some((r) => r.cols.length > 8);

  return (
    <>
      <style>{`@page { size: A4 ${wide ? 'landscape' : 'portrait'}; margin: 10mm; }`}</style>
      <Group justify="space-between" p="md" className="no-print" style={{ borderBottom: '1px solid #DEE2E6' }}>
        <span>{title}</span>
        <Button leftSection={<Printer size={16} />} onClick={() => window.print()}>Print again</Button>
      </Group>
      <div style={{ padding: 16, fontFamily: 'Arial, Helvetica, sans-serif', color: '#212529', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <PrintLogo code={prop?.code} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1F3A5F' }}>{title.toUpperCase()}</div>
              <div style={{ fontSize: 12 }}>{where}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            {period}
            <div>Printed {dayjs().format('D MMM YYYY HH:mm')}</div>
          </div>
        </div>
        {view.tiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {view.tiles.map((t) => (
              <div key={t.label} style={{ border: '1px solid #ADB5BD', padding: '4px 8px', fontSize: 11, minWidth: 140 }}>
                <div>{t.label}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.count ? t.value : `KES ${fmtCell(t.value, 'money')}`}</div>
              </div>
            ))}
          </div>
        )}
        {view.reports.map((r) => <PrintTable key={r.title} report={r} />)}
        {view.note && <div style={{ fontSize: 10, color: '#495057', marginTop: 6 }}>{view.note}</div>}
        <div style={{ display: 'flex', gap: 48, marginTop: 28, fontSize: 12 }}>
          <span>Prepared by: ______________________</span>
          <span>Checked by: ______________________</span>
          <span>Date: ______________</span>
        </div>
      </div>
    </>
  );
}
