import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/useAuth';

/**
 * Asks the server every 3 seconds whether anything changed (an approval, a handover, a dispatch...).
 * When it did, every list on screen refreshes at once, so the person who asked sees the answer straight away.
 */
export function useLivePulse() {
  const auth = useAuth();
  const qc = useQueryClient();
  const last = useRef<number | null>(null);
  const q = useQuery({
    queryKey: ['live', 'pulse'],
    queryFn: async () => (await apiClient.get<{ data: { v: number } }>('/live/pulse')).data.data.v,
    enabled: !!auth.user,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  useEffect(() => {
    if (q.data == null) return;
    if (last.current != null && last.current !== q.data) {
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'live' });
    }
    last.current = q.data;
  }, [q.data, qc]);
}
