import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { GlassWater } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useCreateOrder } from '@/hooks/useOrders';
import { OpenBarSales } from '@/components/bar/OpenBarSales';
import { getErrorMessage } from '@/lib/api/client';

export const Route = createFileRoute('/_app/bar/sell')({ component: BarSellPage });

/**
 * Over-the-counter bar sale. Starts a bar order; then add drinks (bottles or
 * tots), pour, bill, take the money. Cash is dropped like any waiter's.
 */
function BarSellPage() {
  const navigate = useNavigate();
  const create = useCreateOrder();
  const [who, setWho] = useState('');

  const start = async () => {
    try {
      const o = await create.mutateAsync({ station: 'bar', table_number: who.trim() || undefined });
      navigate({ to: `/orders/${o.id}` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Could not start the sale', message: getErrorMessage(err) });
    }
  };

  return (
    <>
      <PageHeader title="Sell at the bar" subtitle="For customers buying straight from the counter" />
      <OpenBarSales />
      <Card withBorder radius="lg" p="lg" maw={480}>
        <Stack>
          <GlassWater size={32} color="#862E9C" />
          <Text size="sm" c="dimmed">
            Start a sale, add the drinks (bottles or tots), pour them, then bill and take the money. Cash goes in your
            handover and is dropped to the cashier as usual.
          </Text>
          <TextInput label="Counter, table or customer" placeholder="Optional, e.g. Counter, T4, Mr Otieno" value={who} onChange={(e) => setWho(e.currentTarget.value)} />
          <Button size="md" loading={create.isPending} onClick={start}>Start a sale</Button>
        </Stack>
      </Card>
    </>
  );
}
