import { Tabs } from '@mantine/core';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/useAuth';

const tabs = [
  { label: 'Batches', to: '/stock/batches' },
  { label: 'Portion', to: '/stock/portion-inventory' },
  { label: 'Ledger', to: '/stock/ledger' },
  { label: 'Balance', to: '/stock/balance' },
  { label: 'Stock Sheet', to: '/stock/sheet' },
  { label: 'Bulk Issues', to: '/stock/bulk-issues' },
];

export function StockTabs() {
  const auth = useAuth();
  const navigate = useNavigate();
  const router = useRouterState();
  const current = router.location.pathname;

  const active = tabs.find((t) => current.startsWith(t.to))?.to || tabs[0].to;
  // The bar only uses the stock sheet here
  if (auth.hasRole('bar_attendant') && !auth.hasRole('manager', 'md', 'admin', 'auditor', 'supervisor', 'store_manager')) return null;

  return (
    <Tabs
      value={active}
      onChange={(value) => value && navigate({ to: value })}
      mb="lg"
    >
      <Tabs.List>
        {tabs.map((t) => (
          <Tabs.Tab key={t.to} value={t.to}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}