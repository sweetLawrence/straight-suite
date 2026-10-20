import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Container } from '@mantine/core';
import { StockTabs } from '@/components/stock/StockTabs';

export const Route = createFileRoute('/_app/stock')({
  component: StockLayout,
});

function StockLayout() {
  return (
    <>
      <StockTabs />
      <Outlet />
    </>
  );
}