import type { TakeStatus } from '@/lib/api/stockTakes';

export const ST = {
  navy: '#1F3A5F',
  red: '#C92A2A',
  redBg: '#FFF5F5',
  green: '#2B8A3E',
  greenBg: '#EBFBEE',
  orange: '#F08C00',
  blue: '#1971C2',
  muted: '#868E96',
  line: '#F1F3F5',
};

export const TAKE_STATUS: Record<TakeStatus, { color: string; label: string }> = {
  counting: { color: '#1971C2', label: 'Counting' },
  submitted: { color: '#F08C00', label: 'Waiting for approval' },
  approved: { color: '#2B8A3E', label: 'Approved' },
  rejected: { color: '#E03131', label: 'Rejected' },
  cancelled: { color: '#ADB5BD', label: 'Cancelled' },
};

export const STORE_OPTIONS = [
  { value: 'bar_store', label: 'Bar' },
  { value: 'food_store', label: 'Food store' },
  { value: 'kitchen', label: 'Kitchen' },
];

/** "−3" / "+2" / "0" with up to 3 decimals */
export const signed = (v: number | null | undefined) => {
  const x = Number(v || 0);
  const s = Math.abs(x).toLocaleString('en-KE', { maximumFractionDigits: 3 });
  return x < 0 ? `−${s}` : x > 0 ? `+${s}` : '0';
};

export const varColor = (v: number | null | undefined) =>
  Number(v || 0) < 0 ? ST.red : Number(v || 0) > 0 ? ST.green : ST.muted;
