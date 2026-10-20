import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'
import type { RoomStatus } from '../../types/room'

export function useRooms(roomTypeId?: string, status?: string) {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['rooms', propertyId, roomTypeId, status],
    queryFn: () => api.listRooms(propertyId, roomTypeId, status)
  })
}

function useInvalidateRooms() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['rooms'] })
}

export function useCreateRoom() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (input: api.RoomInput) => api.createRoom(input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateRoom() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.RoomInput> }) =>
      api.updateRoom(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateRoomStatus() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      api.updateRoomStatus(id, status, propertyId),
    onSuccess: invalidate
  })
}

export function useDeleteRoom() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (id: string) => api.deleteRoom(id, propertyId),
    onSuccess: invalidate
  })
}