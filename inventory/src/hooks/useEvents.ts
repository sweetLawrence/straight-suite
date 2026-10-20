import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/events';
import type { EventInput } from '@/lib/api/events';

const refresh = (qc: ReturnType<typeof useQueryClient>) =>
  ['events', 'event', 'notifications', 'ledger', 'ledger-summary', 'batches'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

export const useEvents = (params: { page?: number; limit?: number; when?: string; status?: string }) =>
  useQuery({ queryKey: ['events', params], queryFn: () => api.listEvents(params), placeholderData: keepPreviousData });
export const useEvent = (id: string | undefined) => useQuery({ queryKey: ['event', id], queryFn: () => api.getEvent(id!), enabled: !!id });

export function useSaveEvent(id?: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: EventInput) => (id ? api.updateEvent(id, data) : api.createEvent(data)), onSuccess: () => refresh(qc) });
}

/** One hook for the buttons on the event page */
export function useEventAction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a:
      | { kind: 'confirm' }
      | { kind: 'complete' }
      | { kind: 'cancel'; reason: string }
      | { kind: 'payment'; amount: number; method: string; reference?: string; notes?: string }
      | { kind: 'issue' | 'return'; lineId: string; quantity: number }) => {
      switch (a.kind) {
        case 'confirm': return api.confirmEvent(id);
        case 'complete': return api.completeEvent(id);
        case 'cancel': return api.cancelEvent(id, a.reason);
        case 'payment': return api.addEventPayment(id, a);
        case 'issue': return api.issueEventStock(id, a.lineId, a.quantity);
        case 'return': return api.returnEventStock(id, a.lineId, a.quantity);
      }
    },
    onSuccess: () => refresh(qc),
  });
}
