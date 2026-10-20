import { Badge, Tooltip } from '@mantine/core';
import { StatBadge } from '@/components/StatBadge';

export type PaymentState = 'none' | 'awaiting_verification' | 'verified' | 'failed';

/**
 * "Paid" means the customer has paid. Until the cashier verifies M-Pesa/card or
 * confirms the cash drop, the money is not confirmed, so the badge says so.
 */
export function BillStatusBadge({ status, paymentState }: { status: string; paymentState?: PaymentState | null }) {
  if (status === 'paid' && paymentState === 'awaiting_verification') {
    return (
      <Tooltip label="Customer has paid; the cashier has not yet verified the payment or confirmed the cash drop" withArrow multiline w={260}>
        <Badge variant="light" styles={{ label: { overflow: 'visible' } }} style={{ flexShrink: 0, whiteSpace: 'nowrap',  color: '#E8590C', backgroundColor: '#FFF4E6' }}>
          Paid · unverified
        </Badge>
      </Tooltip>
    );
  }
  if (status === 'paid' && paymentState === 'failed') {
    return (
      <Badge variant="light" styles={{ label: { overflow: 'visible' } }} style={{ flexShrink: 0, whiteSpace: 'nowrap',  color: '#E03131', backgroundColor: '#FFF5F5' }}>
        Paid · payment failed
      </Badge>
    );
  }
  if (status === 'paid' && paymentState === 'verified') {
    return (
      <Badge variant="light" styles={{ label: { overflow: 'visible' } }} style={{ flexShrink: 0, whiteSpace: 'nowrap',  color: '#2F9E44', backgroundColor: '#EBFBEE' }}>
        Paid · verified
      </Badge>
    );
  }
  return <StatBadge value={status} />;
}
