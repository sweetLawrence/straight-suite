import { CSSProperties, ReactNode, useEffect } from 'react';
import { ActionIcon, Avatar, Box, Drawer, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  BookOpenCheck,
  ArrowLeftRight,
  Banknote,
  Ban,
  BarChart3,
  BadgeCheck,
  BedDouble,
  Bell,
  Calculator,
  CalendarDays,
  Landmark,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  FileText,
  BookOpen,
  ChefHat,
  HandCoins,
  ListChecks,
  ShoppingCart,
  GlassWater,
  House,
  LogOut,
  Package,
  Receipt,
  Scale,
  Sheet,
  ShieldCheck,
  SquarePlus,
  Tags,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  Users,
  Wallet,
  Warehouse,
  Wine,
  Wrench,
} from 'lucide-react';
import { useIncomeDrops } from '@/hooks/useIncomeDrops';
import { COUNTED, useNavCounts } from '@/hooks/useNavCounts';
import { ToDropBanner } from '@/components/ToDropBanner';
import { ToCountBanner } from '@/components/ToCountBanner';
import { WaitingBanner } from '@/components/WaitingBanner';
import { CashHeldBanner } from '@/components/CashHeldBanner'
import { ActingProperty } from '@/components/ActingProperty';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/useAuth';
import { useBarPending } from '@/hooks/useOrders';
import { useApprovals, useUnreadCount } from '@/hooks/useNotifications';
import { useRemittances } from '@/hooks/useCashier';
import { usePendingCashDrops } from '@/hooks/usePayments';
import { useStoreQueue } from '@/hooks/useStore';
import { RefreshButton } from '@/components/RefreshButton';
import { appPath, pagePath } from '@/lib/utils/basePath';

/**
 * Instagram-style phone shell: header with logo, name and logout, an icon tab bar
 * with small labels, and a "More" sheet. Each role gets its own four tabs.
 */

export type MobileRole = 'waiter' | 'bar' | 'manager' | 'cashier' | 'md' | 'auditor' | 'store' | 'accountant';

const C = {
  ink: '#111111',
  inactive: '#262626',
  muted: '#737373',
  line: '#DBDBDB',
  bg: '#FFFFFF',
  page: '#FAFAFA',
  danger: '#ED4956',
  badge: '#FF3040',
  avatarBg: '#EFEFEF',
};

const stroke = (active: boolean) => (active ? 2.6 : 1.8);
const ic = (Icon: typeof House, size = 24) => (a: boolean) => <Icon size={size} strokeWidth={stroke(a)} />;
const li = (Icon: typeof House) => <Icon size={20} strokeWidth={1.8} />;

interface Tab {
  label: string;
  to: string;
  icon: (active: boolean) => ReactNode;
  exact?: boolean;
  /** Small red count, e.g. drinks waiting to pour */
  badge?: () => ReactNode;
}
interface MoreLink {
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: ReactNode;
  perm?: string;
}
interface MoreGroup {
  title?: string;
  links: MoreLink[];
}

// ─── Live counts on tabs ────────────────────────────────────────────
function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <Box
      component="span"
      style={{
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 8,
        background: C.badge,
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: '16px',
        textAlign: 'center',
        border: `2px solid ${C.bg}`,
        boxSizing: 'content-box',
      }}
    >
      {n > 99 ? '99+' : n}
    </Box>
  );
}
function BarPendingBadge() {
  const q = useBarPending(1, 1);
  return <CountBadge n={q.data?.meta?.total ?? q.data?.data?.length ?? 0} />;
}
function ApprovalsBadge() {
  const q = useApprovals();
  return <CountBadge n={q.data?.counts.total ?? 0} />;
}
function NotificationsBadge() {
  const q = useUnreadCount();
  return <CountBadge n={q.data?.unread ?? 0} />;
}
function StoreQueueBadge() {
  const q = useStoreQueue({ page: 1, limit: 1 });
  return <CountBadge n={q.data?.meta?.total ?? q.data?.data?.length ?? 0} />;
}
function HandoversBadge() {
  const q = useRemittances({ status: 'pending', limit: 1 });
  return <CountBadge n={q.data?.meta?.total ?? 0} />;
}
function DropsBadge() {
  const q = usePendingCashDrops();
  const inc = useIncomeDrops('pending');
  return <CountBadge n={(q.data?.meta?.total ?? q.data?.data?.length ?? 0) + (inc.data?.length ?? 0)} />;
}

// MD and auditor: the whole business, read from the phone
const GROUP_MORE: MoreGroup[] = [
  {
    title: 'Finance',
    links: [
      { label: 'Daily summary', to: '/day-summary', icon: li(FileText) },
      { label: 'Accounts', to: '/accounts', icon: li(BookOpenCheck) },
      { label: 'Other income', to: '/income', icon: li(Banknote) },
      { label: 'Shortages', to: '/money-check', icon: li(Scale), perm: 'cash.accountability' },
      { label: 'Rooms and halls', to: '/venues', icon: li(BedDouble) },
      { label: 'Money (live)', to: '/finance/overview', icon: li(TrendingUp) },
      { label: 'Profit per item', to: '/finance/items', icon: li(Tags) },
      { label: 'Income statement', to: '/finance', icon: li(Landmark) },
      { label: 'Cost of sales', to: '/finance/cost-of-sales', icon: li(Calculator) },
      { label: 'eTIMS', to: '/etims', icon: li(BadgeCheck) },
      { label: 'Reports', to: '/reports', icon: li(BarChart3) },
    ],
  },
  {
    title: 'Sales and cash',
    links: [
      { label: 'Orders', to: '/orders', icon: li(Receipt) },
      { label: 'Sold out', to: '/menu/sold-out', icon: li(Ban), perm: 'menu.soldout' },
      { label: 'Bills', to: '/bills', icon: li(FileText) },
      { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
      { label: 'Events', to: '/events', icon: li(CalendarDays) },
      { label: 'Payments', to: '/payments', icon: li(Banknote) },
      { label: 'Cash drops', to: '/cash-drops', icon: li(ArrowLeftRight) },
      { label: 'Cash in hand', to: '/cashier', icon: li(Wallet) },
      { label: 'Cash handovers', to: '/cash-handovers', icon: li(HandCoins) },
      { label: 'Petty cash', to: '/petty-cash', icon: li(Receipt) },
    ],
  },
  {
    title: 'Bar',
    links: [
      { label: 'Bar dashboard', to: '/bar', icon: li(Wine) },
      { label: 'Bar stock', to: '/bar/stock', icon: li(GlassWater) },
    ],
  },
  {
    title: 'Store and stock',
    links: [
      { label: 'Stock balance', to: '/stock/balance', icon: li(Warehouse) },
      { label: 'Stock sheet', to: '/stock/sheet', icon: li(Sheet) },
      { label: 'Stock takes', to: '/stock-takes', icon: li(ClipboardList) },
      { label: 'Variances (shortages)', to: '/stock-takes/variances', icon: li(Scale) },
      { label: 'Kitchen day', to: '/kitchen', icon: li(ChefHat) },
      { label: 'Reorder list', to: '/reorder', icon: li(ListChecks) },
      { label: 'Purchase orders', to: '/purchase-orders', icon: li(ShoppingCart) },
      { label: 'Suppliers', to: '/suppliers', icon: li(Truck) },
      { label: 'Dispatch queue', to: '/store/queue', icon: li(Truck) },
      { label: 'Transfers', to: '/transfers', icon: li(ArrowLeftRight) },
      { label: 'Staff meals', to: '/staff-meals', icon: li(UtensilsCrossed) },
    ],
  },
  {
    title: 'Controls',
    links: [
      { label: 'Waste', to: '/waste', icon: li(Wrench) },
      { label: 'Adjustments', to: '/adjustments', icon: li(Scale) },
      { label: 'Reconciliation', to: '/reconciliation', icon: li(ClipboardList) },
      { label: 'Audit log', to: '/audit', icon: li(FileSearch) },
      { label: 'Users', to: '/users', icon: li(Users), perm: 'user.manage' },
      { label: 'Access', to: '/admin/access', icon: li(ShieldCheck), perm: 'user.manage' },
    ],
  },
];

// Help for everyone, at the end of the More sheet
const HELP_GROUP: MoreGroup = {
  title: 'Help',
  links: [{ label: 'Glossary', to: '/glossary', icon: li(BookOpen) }],
};

// ─── Per-role layout ────────────────────────────────────────────────
const CONFIG: Record<MobileRole, { roleLabel: string; tabs: Tab[]; more: MoreGroup[] }> = {
  waiter: {
    roleLabel: 'Waiter',
    tabs: [
      { label: 'Home', to: '/dashboard', icon: ic(House) },
      { label: 'Orders', to: '/orders', icon: ic(Receipt) },
      { label: 'New', to: '/orders/new', exact: true, icon: ic(SquarePlus, 26) },
      { label: 'Bills', to: '/bills', icon: ic(FileText) },
    ],
    more: [
      {
        links: [
          { label: 'Alerts', to: '/notifications', icon: li(Bell) },
          { label: 'Daily summary', to: '/day-summary', icon: li(FileText) },
          { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
          { label: 'Payments', to: '/payments', icon: li(Banknote) },
          { label: 'Cash drops', to: '/cash-drops', icon: li(ArrowLeftRight) },
          { label: 'My handover', to: '/handover', icon: li(ClipboardCheck) },
        ],
      },
    ],
  },
  bar: {
    roleLabel: 'Bar',
    tabs: [
      { label: 'Orders', to: '/bar/orders', icon: ic(GlassWater), badge: () => <BarPendingBadge /> },
      { label: 'Sell', to: '/bar/sell', icon: ic(SquarePlus, 26) },
      { label: 'Stock', to: '/bar/stock', icon: ic(Wine) },
      { label: 'Handover', to: '/bar/handover', icon: ic(ClipboardCheck) },
    ],
    more: [
      {
        links: [
          { label: 'Alerts', to: '/notifications', icon: li(Bell) },
          { label: 'Daily summary', to: '/day-summary', icon: li(FileText) },
          { label: 'Bar dashboard', to: '/bar', icon: li(House) },
          { label: 'Bills', to: '/bills', icon: li(FileText) },
          { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
          { label: 'Payments', to: '/payments', icon: li(Banknote) },
          { label: 'Cash drops', to: '/cash-drops', icon: li(ArrowLeftRight) },
          { label: 'Stock sheet', to: '/stock/sheet', icon: li(Sheet) },
          { label: 'Send to a room', to: '/bar/rooms', icon: li(BedDouble) },
          { label: 'Waste', to: '/waste', icon: li(FileText) },
          { label: 'Transfers', to: '/transfers', icon: li(ArrowLeftRight) },
          { label: 'Bar reports', to: '/bar/reports', icon: li(BarChart3) },
          { label: 'Bar count', to: '/stock-takes', icon: li(ClipboardList) },
        ],
      },
    ],
  },
  manager: {
    roleLabel: 'Manager',
    tabs: [
      { label: 'Home', to: '/dashboard', icon: ic(House) },
      { label: 'Approvals', to: '/approvals', icon: ic(ShieldCheck), badge: () => <ApprovalsBadge /> },
      { label: 'Alerts', to: '/notifications', icon: ic(Bell), badge: () => <NotificationsBadge /> },
      { label: 'Reports', to: '/reports', icon: ic(BarChart3) },
    ],
    more: [
      {
        title: 'Income',
        links: [
          { label: 'Other income', to: '/income', icon: li(Banknote) },
          { label: 'Hand in money', to: '/income-handin', icon: li(HandCoins), perm: 'income.record' },
          { label: 'Shortages', to: '/money-check', icon: li(Scale), perm: 'cash.accountability' },
        ],
      },
      {
        title: 'Bar',
        links: [
          { label: 'Bar dashboard', to: '/bar', icon: li(Wine) },
          { label: 'Bar stock', to: '/bar/stock', icon: li(GlassWater) },
        ],
      },
      {
        title: 'Sales and cash',
        links: [
          { label: 'Orders', to: '/orders', icon: li(Receipt) },
          { label: 'Bills', to: '/bills', icon: li(FileText) },
          { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
          { label: 'Events', to: '/events', icon: li(CalendarDays) },
          { label: 'Payments', to: '/payments', icon: li(Banknote) },
          { label: 'Pending verification', to: '/payments/pending', icon: li(ClipboardCheck), perm: 'payment.verify' },
          { label: 'Cash drops', to: '/cash-drops', icon: li(ArrowLeftRight) },
          { label: 'Cash in hand', to: '/cashier', icon: li(Wallet) },
          { label: 'Petty cash', to: '/petty-cash', icon: li(Receipt) },
          { label: 'Alerts', to: '/notifications', icon: li(Bell) },
          { label: 'Daily summary', to: '/day-summary', icon: li(FileText) },
          { label: 'Other income', to: '/income', icon: li(Banknote) },
          { label: 'Hand in money', to: '/income-handin', icon: li(HandCoins), perm: 'income.record' },
          { label: 'Shortages', to: '/money-check', icon: li(Scale), perm: 'cash.accountability' },
          { label: 'Rooms and halls', to: '/venues', icon: li(BedDouble), perm: 'event.manage' },
          { label: 'Cash handovers', to: '/cash-handovers', icon: li(HandCoins) },
        ],
      },
      {
        title: 'Store and stock',
        links: [
          { label: 'Dispatch queue', to: '/store/queue', icon: li(Truck) },
          { label: 'Stock balance', to: '/stock/balance', icon: li(Warehouse) },
          { label: 'Stock sheet', to: '/stock/sheet', icon: li(Sheet) },
          { label: 'Stock takes', to: '/stock-takes', icon: li(ClipboardList) },
          { label: 'Variances', to: '/stock-takes/variances', icon: li(Scale) },
          { label: 'Kitchen day', to: '/kitchen', icon: li(ChefHat) },
          { label: 'Sold out', to: '/menu/sold-out', icon: li(Ban), perm: 'menu.soldout' },
          { label: 'Portion rules', to: '/stock/portion-rules', icon: li(Scale), perm: 'stock.item.manage' },
          { label: 'Reorder list', to: '/reorder', icon: li(ListChecks) },
          { label: 'Purchase orders', to: '/purchase-orders', icon: li(ShoppingCart) },
          { label: 'Suppliers', to: '/suppliers', icon: li(Truck) },
          { label: 'Portion inventory', to: '/stock/portion-inventory', icon: li(Package) },
          { label: 'Transfers', to: '/transfers', icon: li(ArrowLeftRight) },
          { label: 'Staff meals', to: '/staff-meals', icon: li(UtensilsCrossed) },
        ],
      },
      {
        title: 'Controls',
        links: [
          { label: 'Waste', to: '/waste', icon: li(Wrench) },
          { label: 'Adjustments', to: '/adjustments', icon: li(Scale) },
          { label: 'Reconciliation', to: '/reconciliation', icon: li(ClipboardList) },
          { label: 'Users', to: '/users', icon: li(Users), perm: 'user.manage' },
        ],
      },
    ],
  },
  cashier: {
    roleLabel: 'Cashier',
    tabs: [
      { label: 'Cash', to: '/cashier', icon: ic(Wallet) },
      { label: 'Drops', to: '/cash-drops', icon: ic(ArrowLeftRight), badge: () => <DropsBadge /> },
      { label: 'Verify', to: '/payments/pending', icon: ic(ClipboardCheck) },
      { label: 'Petty', to: '/petty-cash', icon: ic(Receipt) },
    ],
    more: [
      {
        title: 'Cash',
        links: [
          { label: 'Daily summary', to: '/day-summary', icon: li(FileText) },
          { label: 'Shortages', to: '/money-check', icon: li(Scale) },
          { label: 'Cash handovers', to: '/cash-handovers', icon: li(HandCoins) },
          { label: 'All payments', to: '/payments', icon: li(Banknote) },
          { label: 'Bills', to: '/bills', icon: li(FileText) },
          { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
        ],
      },
    ],
  },
  md: {
    roleLabel: 'MD',
    tabs: [
      { label: 'Home', to: '/dashboard', icon: ic(House) },
      { label: 'Money', to: '/finance/overview', icon: ic(TrendingUp) },
      { label: 'Cash', to: '/cash-handovers', icon: ic(HandCoins), badge: () => <HandoversBadge /> },
      { label: 'Alerts', to: '/notifications', icon: ic(Bell), badge: () => <NotificationsBadge /> },
    ],
    more: GROUP_MORE,
  },
  store: {
    roleLabel: 'Store',
    tabs: [
      { label: 'Home', to: '/dashboard', icon: ic(House) },
      { label: 'Queue', to: '/store/queue', icon: ic(Truck), badge: () => <StoreQueueBadge /> },
      { label: 'Stock', to: '/stock/balance', icon: ic(Warehouse) },
      { label: 'Alerts', to: '/notifications', icon: ic(Bell), badge: () => <NotificationsBadge /> },
    ],
    more: [
      {
        title: 'Sending out',
        links: [
          { label: 'Dispatch queue', to: '/store/queue', icon: li(Truck) },
          { label: 'Issue slips', to: '/store/slips', icon: li(FileText) },
          { label: 'Bulk issues to kitchen', to: '/stock/bulk-issues', icon: li(ChefHat) },
          { label: 'Kitchen day', to: '/kitchen', icon: li(ChefHat) },
          { label: 'Staff meals', to: '/staff-meals', icon: li(UtensilsCrossed) },
          { label: 'Events', to: '/events', icon: li(CalendarDays) },
          { label: 'Transfers', to: '/transfers', icon: li(ArrowLeftRight) },
        ],
      },
      {
        title: 'Buying',
        links: [
          { label: 'Reorder list', to: '/reorder', icon: li(ListChecks) },
          { label: 'Purchase orders', to: '/purchase-orders', icon: li(ShoppingCart) },
          { label: 'Suppliers', to: '/suppliers', icon: li(Truck) },
        ],
      },
      {
        title: 'Stock',
        links: [
          { label: 'Stock balance', to: '/stock/balance', icon: li(Warehouse) },
          { label: 'Stock sheet', to: '/stock/sheet', icon: li(Sheet) },
          { label: 'Batches', to: '/stock/batches', icon: li(Package) },
          { label: 'Stock items', to: '/stock/items', icon: li(Package) },
          { label: 'Ledger', to: '/stock/ledger', icon: li(FileSearch) },
          { label: 'Stock takes', to: '/stock-takes', icon: li(ClipboardList) },
          { label: 'Variances', to: '/stock-takes/variances', icon: li(Scale) },
          { label: 'Waste', to: '/waste', icon: li(Wrench) },
          { label: 'Alerts', to: '/notifications', icon: li(Bell) },
        ],
      },
    ],
  },
  accountant: {
    roleLabel: 'Accountant',
    tabs: [
      { label: 'Accounts', to: '/accounts', icon: ic(BookOpenCheck) },
      { label: 'Money', to: '/finance/overview', icon: ic(TrendingUp) },
      { label: 'Months', to: '/finance', icon: ic(Landmark) },
      { label: 'Cash', to: '/cash-handovers', icon: ic(HandCoins) },
    ],
    more: [
      {
        title: 'Books',
        links: [
          { label: 'Day book', to: '/accounts', search: { tab: 'daybook' }, icon: li(BookOpenCheck) },
          { label: 'Debtors', to: '/accounts', search: { tab: 'debtors' }, icon: li(BedDouble) },
          { label: 'Suppliers', to: '/accounts', search: { tab: 'suppliers' }, icon: li(Truck) },
          { label: 'VAT', to: '/accounts', search: { tab: 'vat' }, icon: li(Calculator) },
          { label: 'Journal', to: '/accounts', search: { tab: 'journal' }, icon: li(FileText) },
          { label: 'Cost of sales', to: '/finance/cost-of-sales', icon: li(Calculator) },
          { label: 'Profit per item', to: '/finance/items', icon: li(Tags) },
          { label: 'eTIMS', to: '/etims', icon: li(BadgeCheck) },
        ],
      },
      {
        title: 'Records',
        links: [
          { label: 'Petty cash', to: '/petty-cash', icon: li(Receipt) },
          { label: 'Guests paying later', to: '/pay-later', icon: li(BedDouble) },
          { label: 'Purchase orders', to: '/purchase-orders', icon: li(ShoppingCart) },
          { label: 'Stock sheet', to: '/stock/sheet', icon: li(Sheet) },
          { label: 'Reports', to: '/reports', icon: li(BarChart3) },
        ],
      },
    ],
  },
  auditor: {
    roleLabel: 'Auditor',
    tabs: [
      { label: 'Home', to: '/dashboard', icon: ic(House) },
      { label: 'Alerts', to: '/notifications', icon: ic(Bell), badge: () => <NotificationsBadge /> },
      { label: 'Reports', to: '/reports', icon: ic(BarChart3) },
      { label: 'Audit', to: '/audit', icon: ic(FileSearch) },
    ],
    more: GROUP_MORE,
  },
};

const match = (path: string, to: string) => path === to || path.startsWith(to + '/');

export function AppShellMobile({ role = 'waiter', children }: { role?: MobileRole; children?: ReactNode }) {
  const auth = useAuth();
  const [sheet, { open, close }] = useDisclosure(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cfg = CONFIG[role];

  // Let pages with their own sticky bars sit above the bottom nav
  // (e.g. New Order's Cancel / Create bar): bottom: var(--bottom-nav-height, 0px)
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--bottom-nav-height', 'calc(60px + env(safe-area-inset-bottom))');
    root.setProperty('--bottom-nav-safe-area', '0px');
    return () => {
      root.removeProperty('--bottom-nav-height');
      root.removeProperty('--bottom-nav-safe-area');
    };
  }, []);

  const tabPaths = cfg.tabs.map((t) => t.to);
  const isActive = (tab: Tab) => {
    if (tab.exact) return path === tab.to;
    if (!match(path, tab.to)) return false;
    // A longer tab path wins (e.g. /orders/new belongs to New, not Orders)
    return !tabPaths.some((p) => p !== tab.to && p.startsWith(tab.to + '/') && match(path, p));
  };
  const moreGroups = [...cfg.more, HELP_GROUP];
  const moreLinks = moreGroups
    .flatMap((g) => g.links)
    .filter((l) => !l.perm || auth.hasPermission(l.perm));
  const inMore = !cfg.tabs.some(isActive) && moreLinks.some((l) => match(path, l.to));
  // Counts beside More items; the More button shows the total of those not already on a tab
  const tabTos = cfg.tabs.map((t) => t.to);
  const moreCounts = useNavCounts(moreLinks.map((l) => l.to).filter((t) => COUNTED.includes(t)));
  const moreTotal = moreLinks.reduce((a, l) => a + (tabTos.includes(l.to) ? 0 : moreCounts[l.to] ?? 0), 0);

  const user = auth.user;
  const initial = user?.full_name?.[0]?.toUpperCase() ?? '?';
  const property = user?.roles[0]?.property_code;

  const logout = () => {
    auth.logout();
    window.location.replace(appPath('/login'));
  };

  return (
    <Box style={{ minHeight: '100dvh', background: C.page }}>
      {/* ─── Header: logo · name · logout ─── */}
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          paddingTop: 'env(safe-area-inset-top)',
          background: C.bg,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <Group h={56} px={12} justify="space-between" wrap="nowrap" gap="sm">
          <Group gap={10} wrap="nowrap" style={{ minWidth: 0 }}>
            <Box
              aria-label="Straight Inventory"
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #228BE6 0%, #15AABF 100%)',
              }}
            >
              <Package size={18} />
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} size="sm" lh={1.2} truncate style={{ color: C.ink }}>
                {user?.full_name}
              </Text>
              <Text size="xs" lh={1.2} truncate style={{ color: C.muted }}>
                {auth.hasRole('admin') ? 'Admin' : cfg.roleLabel}
                {property ? ` · ${property}` : ''}
              </Text>
            </Box>
          </Group>

          <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActingProperty />
          <RefreshButton color={C.inactive} />
          <ActionIcon
            variant="subtle"
            size={40}
            radius="xl"
            onClick={logout}
            aria-label="Log out"
            style={{ color: C.inactive, flexShrink: 0 }}
          >
            <LogOut size={20} strokeWidth={1.8} />
          </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* ─── Page ─── */}
      <Box component="main" px={12} pt={12} style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + 12px)' }}>
        <ToDropBanner />
        <ToCountBanner />
        <WaitingBanner />
        <CashHeldBanner />
        {children ?? <Outlet />}
      </Box>

      {/* ─── Bottom bar ─── */}
      <Box
        component="nav"
        aria-label="Main"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          height: 'calc(60px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: C.bg,
          borderTop: `1px solid ${C.line}`,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        {cfg.tabs.map((tab) => {
          const active = isActive(tab);
          return (
            <UnstyledButton
              key={tab.to}
              component={Link}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              style={tabStyle(active)}
            >
              <Box style={{ ...iconSlot, position: 'relative' }}>
                {tab.icon(active)}
                {tab.badge?.()}
              </Box>
              <Text component="span" style={labelStyle(active)}>
                {tab.label}
              </Text>
            </UnstyledButton>
          );
        })}

        {/* More slot (avatar) */}
        <UnstyledButton onClick={open} style={tabStyle(inMore || sheet)}>
          <Box style={{ ...iconSlot, position: 'relative' }}>
            <Box
              style={{
                borderRadius: '50%',
                padding: 1,
                border: `2px solid ${inMore || sheet ? C.ink : 'transparent'}`,
                lineHeight: 0,
              }}
            >
              <Avatar
                size={22}
                radius={999}
                styles={{ placeholder: { background: C.avatarBg, color: C.ink, fontSize: 11, fontWeight: 700 } }}
              >
                {initial}
              </Avatar>
            </Box>
            <CountBadge n={moreTotal} />
          </Box>
          <Text component="span" style={labelStyle(inMore || sheet)}>
            More
          </Text>
        </UnstyledButton>
      </Box>

      {/* ─── More sheet ─── */}
      <Drawer
        opened={sheet}
        onClose={close}
        position="bottom"
        withCloseButton={false}
        radius="lg"
        styles={{
          content: {
            width: '100%',
            height: 'auto',
            maxHeight: '85dvh',
            flex: '0 0 auto',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
          inner: { alignItems: 'flex-end' },
        }}
      >
        <Box mx="auto" mb="md" style={{ width: 36, height: 4, borderRadius: 2, background: C.line }} />
        <Group gap="sm" mb="md" wrap="nowrap">
          <Avatar size={48} radius={999} styles={{ placeholder: { background: C.avatarBg, color: C.ink, fontWeight: 700 } }}>
            {initial}
          </Avatar>
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} truncate style={{ color: C.ink }}>
              {user?.full_name}
            </Text>
            <Text size="sm" style={{ color: C.muted }}>
              @{user?.username} · {cfg.roleLabel}
              {property ? ` · ${property}` : ''}
            </Text>
          </Box>
        </Group>

        {moreGroups.map((g, gi) => {
          const links = g.links.filter((l) => !l.perm || auth.hasPermission(l.perm));
          if (!links.length) return null;
          return (
            <Box key={gi} mb={g.title ? 'xs' : 0}>
              {g.title && (
                <Text size="xs" fw={700} tt="uppercase" mt="sm" mb={4} style={{ color: C.muted, letterSpacing: 0.4 }}>
                  {g.title}
                </Text>
              )}
              <Stack gap={0} style={{ borderTop: `1px solid ${C.line}` }}>
                {links.map((l) => (
                  <UnstyledButton
                    key={l.to + (l.search?.tab ?? '')}
                    component={Link}
                    to={l.to}
                    search={l.search as never}
                    onClick={close}
                    py={13}
                    style={{ borderBottom: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" wrap="nowrap">
                        {l.icon}
                        <Text size="md" fw={match(path, l.to) ? 700 : 400}>
                          {l.label}
                        </Text>
                      </Group>
                      <Group gap={8} wrap="nowrap">
                        {!!moreCounts[l.to] && (
                          <Box component="span" style={{ minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: C.badge, color: '#FFFFFF', fontSize: 12, fontWeight: 700, lineHeight: '22px', textAlign: 'center' }}>
                            {moreCounts[l.to] > 99 ? '99+' : moreCounts[l.to]}
                          </Box>
                        )}
                        <ChevronRight size={18} color={C.muted} />
                      </Group>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            </Box>
          );
        })}
        <UnstyledButton py={14} onClick={logout} style={{ color: C.danger }}>
          <Group gap="md" wrap="nowrap">
            <LogOut size={20} strokeWidth={1.8} />
            <Text size="md" fw={600}>
              Log out
            </Text>
          </Group>
        </UnstyledButton>
      </Drawer>
    </Box>
  );
}

const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  color: active ? C.ink : C.inactive,
});

const iconSlot: CSSProperties = {
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle = (active: boolean): CSSProperties => ({
  fontSize: 10,
  lineHeight: 1,
  fontWeight: active ? 700 : 500,
  color: active ? C.ink : C.muted,
});
