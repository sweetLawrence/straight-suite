import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronRight, Wallet } from 'lucide-react';
import dayjs from 'dayjs';
import { useCashierSummary } from '@/hooks/useCashier';
import { useAuth } from '@/lib/auth/useAuth';
import { formatCurrency } from '@/lib/utils/format';

/** Cash the cashier is still holding and has not handed to the MD. */
export function CashHeldBanner() {
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const can = !!auth.user && auth.hasPermission('cash.remit');
  const q = useCashierSummary({ date: dayjs().format('YYYY-MM-DD') }, can);
  const held = Number(q.data?.cash?.in_hand ?? 0);
  if (!can || held <= 0 || path.startsWith('/cashier')) return null;
  return (
    <Link
      to="/cashier"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 12, borderRadius: 10,
        background: '#E7F5FF', border: '1px solid #1C7ED6', color: '#0B3C66', textDecoration: 'none',
      }}
    >
      <Wallet size={20} color="#1971C2" />
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.3 }}>
        <b>{formatCurrency(held)} cash in hand</b>
        <br />
        <span style={{ fontSize: 12 }}>Not handed to the MD yet · tap to hand over</span>
      </span>
      <ChevronRight size={18} color="#1971C2" />
    </Link>
  );
}
