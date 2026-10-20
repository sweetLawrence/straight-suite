import { useApprovals, useUnreadCount } from '@/hooks/useNotifications';
import { useBarPending } from '@/hooks/useOrders';
import { useStoreQueue } from '@/hooks/useStore';
import { useRemittances } from '@/hooks/useCashier';
import { usePendingCashDrops, usePendingVerification } from '@/hooks/usePayments';
import { useIncomeDrops, useMoneyCheck } from '@/hooks/useIncomeDrops';
import { useSummaryWaiting } from '@/hooks/useDaySummary';
import { useAuth } from '@/lib/auth/useAuth';
import dayjs from 'dayjs';

/** Menu paths that show a red count, on the desktop menu and on the phone (tabs and the More sheet). */
export const COUNTED = [
  '/notifications', '/approvals', '/bar/orders', '/store/queue', '/cash-handovers',
  '/cash-drops', '/income-handin', '/money-check', '/payments/pending', '/day-summary',
];

/** Counts for the given menu paths. Only the lists the person can see are fetched. */
export function useNavCounts(tos: string[]): Record<string, number> {
  const auth = useAuth();
  const want = (to: string) => tos.includes(to);
  const alerts = useUnreadCount(want('/notifications'));
  const approvals = useApprovals(want('/approvals'));
  const bar = useBarPending(1, 1, want('/bar/orders'));
  const store = useStoreQueue({ page: 1, limit: 1 }, want('/store/queue'));
  const handovers = useRemittances({ status: 'pending', limit: 1 }, want('/cash-handovers'));
  const drops = usePendingCashDrops(undefined, want('/cash-drops'));
  const canCount = auth.hasPermission('cash.drop.verify');
  const hands = useIncomeDrops('pending', want('/income-handin') && canCount);
  const short = useMoneyCheck(
    { from: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') },
    want('/money-check') && auth.hasPermission('cash.accountability'),
  );
  const verify = usePendingVerification({ page: 1, limit: 1 }, want('/payments/pending') && auth.hasPermission('payment.verify'));
  // Closed days waiting for the MD or accountant to acknowledge
  const closed = useSummaryWaiting(want('/day-summary') && auth.hasPermission('summary.ack'));
  const me = auth.user?.id;
  return {
    '/notifications': alerts.data?.unread ?? 0,
    '/approvals': approvals.data?.counts.total ?? 0,
    '/bar/orders': bar.data?.meta?.total ?? bar.data?.data?.length ?? 0,
    '/store/queue': store.data?.meta?.total ?? store.data?.data?.length ?? 0,
    '/cash-handovers': handovers.data?.meta?.total ?? 0,
    '/cash-drops': drops.data?.meta?.total ?? drops.data?.data?.length ?? 0,
    '/income-handin': (hands.data ?? []).filter((d) => d.collector?.id !== me).length,
    // People who are short in the last 7 days
    '/money-check': (short.data?.rows ?? []).filter((r) => r.short > 0).length,
    '/day-summary': closed.data?.closed ?? 0,
    '/payments/pending': verify.data?.meta?.total ?? verify.data?.data?.length ?? 0,
  };
}
