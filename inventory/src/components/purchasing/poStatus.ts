import type { POStatus } from '@/lib/api/purchasing';

export const PO_STATUS: Record<POStatus, { color: string; label: string }> = {
  ordered: { color: '#1971C2', label: 'Ordered' },
  partially_received: { color: '#F08C00', label: 'Part received' },
  received: { color: '#2B8A3E', label: 'Received' },
  cancelled: { color: '#ADB5BD', label: 'Cancelled' },
};
