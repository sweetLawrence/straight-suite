import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChefHat } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/useAuth';

interface Waiting { orders: number; items: number; oldest_minutes: number; store_side: boolean }

/** Orders still waiting for the store to dispatch. The store sees all, a waiter sees their own. */
export function WaitingBanner() {
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Only people who act on it: the store dispatches, waiters/supervisors wait on their own orders.
  // MD, accountant, auditor and others just view, so they never see it.
  const viewOnly = auth.hasRole('md', 'accountant', 'auditor');
  const can = !viewOnly && (auth.hasPermission('store.dispatch.create') || auth.hasPermission('order.create'));
  const q = useQuery({
    queryKey: ['store', 'waiting'],
    queryFn: async () => (await apiClient.get<{ data: Waiting }>('/store/waiting')).data.data,
    enabled: !!auth.user && can,
    refetchInterval: 10000,
  });
  const d = q.data;
  if (!d || d.orders <= 0 || path.startsWith('/store')) return null;
  const mins = d.oldest_minutes;
  const late = mins >= 15;
  const to = d.store_side ? '/store/queue' : '/orders';
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 12, borderRadius: 10,
        background: late ? '#FFE3E3' : '#FEF3C7', border: `1px solid ${late ? '#E03131' : '#F59E0B'}`, color: late ? '#7D1A1A' : '#78350F', textDecoration: 'none',
      }}
    >
      <ChefHat size={20} color={late ? '#C92A2A' : '#B45309'} />
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.3 }}>
        <b>{d.orders} {d.orders === 1 ? 'order' : 'orders'} not dispatched yet</b>
        <br />
        <span style={{ fontSize: 12 }}>{d.items} items · waiting {mins < 1 ? 'just now' : `${mins} min`}{d.store_side ? ' · tap to dispatch' : ''}</span>
      </span>
      <ChevronRight size={18} color={late ? '#C92A2A' : '#B45309'} />
    </Link>
  );
}
