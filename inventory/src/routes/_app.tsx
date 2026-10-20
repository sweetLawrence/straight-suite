import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useLivePulse } from '@/hooks/useLivePulse';
import { AppShell } from '@/components/AppShell';
import { AppShellMobile, MobileRole } from '@/components/AppShellMobile';
import { useAuth } from '@/lib/auth/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

// Roles that get the phone-first bottom-bar shell on small screens.
// Anyone who also holds a broader role keeps the full sidebar.
// Phone shell (bottom tab bar) per role. Anyone else keeps the full side menu.
function mobileRoleFor(codes: string[]): MobileRole | null {
  if (codes.includes('md') || codes.includes('admin')) return 'md';
  if (codes.includes('manager')) return 'manager';
  if (codes.includes('bar_attendant')) return 'bar';
  if (codes.includes('cashier')) return 'cashier';
  if (codes.includes('auditor')) return 'auditor';
  if (codes.includes('accountant')) return 'accountant';
  if (codes.includes('store_manager')) return 'store';
  if (codes.length > 0 && codes.every((c) => c === 'waiter')) return 'waiter';
  return null;
}

function AppLayout() {
  const auth = useAuth();
  useLivePulse();
  const isMobile = useIsMobile();

  const roleCodes = auth.user?.roles.map((r) => r.code) ?? [];
  const mobileRole = mobileRoleFor(roleCodes);

  if (isMobile && mobileRole) {
    return (
      <AppShellMobile role={mobileRole}>
        <Outlet />
      </AppShellMobile>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
