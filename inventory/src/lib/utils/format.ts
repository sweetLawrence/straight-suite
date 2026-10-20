import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'KES 0.00';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return 'KES 0.00';
  return `KES ${n.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '0';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return dayjs(value).format('DD MMM YYYY');
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return dayjs(value).format('DD MMM YYYY, HH:mm');
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return dayjs(value).fromNow();
}
/**
 * Show a piece count as packs + loose pieces, e.g. 140 with 30 per packet →
 * "4 packets + 20". Stock is always stored in pieces; this is display only.
 * Returns null when the item isn't packed (or the count isn't a whole number).
 */
export function formatPacks(
  pieces: number | string | null | undefined,
  packSize: number | null | undefined,
  packLabel?: string | null
): string | null {
  const n = Number(pieces);
  if (!packSize || packSize <= 0 || !Number.isFinite(n) || n < 0) return null;
  if (Math.abs(n - Math.round(n)) > 1e-6) return null;
  const whole = Math.round(n);
  const packs = Math.floor(whole / packSize);
  const loose = whole - packs * packSize;
  const label = packLabel || 'pack';
  const plural = (k: number) => (k === 1 ? label : `${label}s`);
  if (packs === 0) return `${loose} loose`;
  return loose ? `${packs} ${plural(packs)} + ${loose}` : `${packs} ${plural(packs)}`;
}

/** Quantities: 7 not 7.000; 0.5 kg stays 0.5 */
export function formatQty(value: number | string | null | undefined, maxDecimals = 3): string {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('en-KE', { maximumFractionDigits: maxDecimals });
}
