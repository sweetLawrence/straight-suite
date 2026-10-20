import type { EventStatus } from '@/lib/api/events';

export const EVENT_STATUS: Record<EventStatus, { color: string; label: string }> = {
  quote: { color: '#868E96', label: 'Quote' },
  confirmed: { color: '#1971C2', label: 'Booked' },
  completed: { color: '#2B8A3E', label: 'Done' },
  cancelled: { color: '#E03131', label: 'Cancelled' },
};
