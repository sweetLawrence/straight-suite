import { createFileRoute, Outlet } from '@tanstack/react-router';
import { StoreTabs } from '@/components/store/StoreTabs';

export const Route = createFileRoute('/_app/store')({
  component: StoreLayout,
});

function StoreLayout() {
  return (
    <>
      <StoreTabs />
      <Outlet />
    </>
  );
}