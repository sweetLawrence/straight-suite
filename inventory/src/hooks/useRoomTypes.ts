import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRoomTypes, saveRoomType } from '@/lib/api/roomTypes';

export function useRoomTypes(propertyId?: string | null, enabled = true) {
  return useQuery({ queryKey: ['room-types', propertyId ?? 'mine'], queryFn: () => listRoomTypes(propertyId ?? undefined), enabled });
}

export function useSaveRoomType() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: saveRoomType, onSuccess: () => qc.invalidateQueries({ queryKey: ['room-types'] }) });
}
