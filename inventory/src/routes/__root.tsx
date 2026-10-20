import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { PrintHost } from '@/lib/print';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AuthContextValue } from '@/lib/auth/AuthContext';

interface RouterContext {
  auth: AuthContextValue;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <PrintHost />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  );
}