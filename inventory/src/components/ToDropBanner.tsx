import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronRight, HandCoins } from 'lucide-react';
import { useToDrop } from '@/hooks/useIncomeDrops';
import { useAuth } from '@/lib/auth/useAuth';
import { formatCurrency } from '@/lib/utils/format';

/** Shown on every screen while the person holds money that is not handed to the cashier yet. One tap to the right screen. */
export function ToDropBanner() {
  const auth = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const can = auth.hasPermission('cash.drop') || auth.hasPermission('income.record');
  const q = useToDrop(!!auth.user && can);
  const d = q.data;
  if (!d || d.total <= 0 || path.startsWith('/cash-drops') || path.startsWith('/income-handin')) return null;
  const parts = [d.cash > 0 ? `cash ${formatCurrency(d.cash)}` : null, d.income > 0 ? `other income ${formatCurrency(d.income)}` : null].filter(Boolean).join(' · ');
  return (
    <Link
      to={d.link}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 12, borderRadius: 10,
        background: '#FEF3C7', border: '1px solid #F59E0B', color: '#78350F', textDecoration: 'none',
      }}
    >
      <HandCoins size={20} color="#B45309" />
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.3 }}>
        <b>Drop {formatCurrency(d.total)} to the cashier</b>
        <br />
        <span style={{ fontSize: 12 }}>{parts}</span>
      </span>
      <ChevronRight size={18} color="#B45309" />
    </Link>
  );
}
