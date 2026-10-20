import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronRight, HandCoins } from 'lucide-react';
import { useIncomeDrops } from '@/hooks/useIncomeDrops';
import { useAuth } from '@/lib/auth/useAuth';
import { getActing } from '@/lib/auth/acting';
import { formatCurrency } from '@/lib/utils/format';

/** For the cashier: money handed in by others (other income) that is still waiting to be counted. */
export function ToCountBanner() {
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const groupLevel = auth.hasRole('md', 'admin') && !getActing();
  const can = auth.hasPermission('cash.drop.verify') && !groupLevel;
  const q = useIncomeDrops('pending', !!auth.user && can);
  const list = (q.data ?? []).filter((d) => d.collector?.id !== auth.user?.id);
  if (!can || list.length === 0 || path.startsWith('/income-handin')) return null;
  const total = list.reduce((a, d) => a + Number(d.expected_amount || 0), 0);
  return (
    <Link
      to="/income-handin"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 12, borderRadius: 10,
        background: '#FEF3C7', border: '1px solid #F59E0B', color: '#78350F', textDecoration: 'none',
      }}
    >
      <HandCoins size={20} color="#B45309" />
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.3 }}>
        <b>{list.length} {list.length === 1 ? 'hand-in' : 'hand-ins'} to count</b>
        <br />
        <span style={{ fontSize: 12 }}>{formatCurrency(total)} waiting · tap to count</span>
      </span>
      <ChevronRight size={18} color="#B45309" />
    </Link>
  );
}
