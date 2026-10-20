import { Badge } from '@mantine/core';

const colors: Record<string, string> = {
  // stock models
  portioned: 'blue',
  bulk: 'yellow',
  packaged: 'grape',
  produced: 'teal',
  // batch
  active: 'green',
  depleted: 'gray',
  expired: 'red',
  written_off: 'red',
  // portion
  available: 'green',
  issued: 'blue',
  sold: 'teal',
  wasted: 'red',
  staff_meal: 'orange',
  transferred: 'grape',
  returned: 'cyan',
  // order
  open: 'blue',
  pending_approval: 'yellow',
  in_progress: 'yellow',
  served: 'cyan',
  billed: 'grape',
  closed: 'green',
  cancelled: 'red',
  // bill
  paid: 'green',
  refunded: 'orange',
  voided: 'gray',
  // payment
  cash: 'green',
  mpesa: 'blue',
  card: 'grape',
  cheque: 'indigo',
  house: 'pink',
  other: 'gray',
  // verification
  pending: 'yellow',
  verified: 'green',
  unverified: 'orange',
  failed: 'red',
  disputed: 'red',
  partially_verified: 'orange',
  partially_issued: 'orange',
  // dispatch
  dispatched: 'blue',
  in_transit: 'yellow',
  received: 'green',
  partially_received: 'orange',
  resolved: 'green',
  // transfer
  requested: 'gray',
  approved: 'green',
  rejected: 'red',
  // production
  completed: 'green',
  // meals
  breakfast: 'blue',
  lunch: 'cyan',
  supper: 'grape',
  dinner: 'grape',
  // float
  top_up: 'blue',
  // severity
  low: 'gray',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
  // outlet
  restaurant: 'blue',
  bar: 'grape',
  both: 'violet',
};

// Friendly words for codes that read badly as-is
const LABELS: Record<string, string> = {
  mpesa: 'M-Pesa',
  house: 'House (MD)',
  reversed: 'Reversed',
  food_store: 'Food store',
  bar_store: 'Bar store',
  in_progress: 'In progress',
  pending_approval: 'Needs approval',
  partially_verified: 'Part verified',
  partially_issued: 'Part issued',
  partially_received: 'Part received',
  top_up: 'Top-up',
  written_off: 'Written off',
  staff_meal: 'Staff meal',
  dispatched: 'Sent',
};

export const statusLabel = (value?: string | null) =>
  !value ? '-' : LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');

export function StatBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  return (
    <Badge
      color={colors[value] || 'gray'}
      variant="light"
      // Never cut the word off ("IN PROGR…"): the badge grows to fit
      styles={{ root: { maxWidth: 'none', flexShrink: 0 }, label: { overflow: 'visible', textOverflow: 'clip' } }}
    >
      {label || statusLabel(value)}
    </Badge>
  );
}