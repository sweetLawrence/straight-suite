import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useRoomTypes() {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['roomTypes', propertyId],
    queryFn: () => api.listRoomTypes(propertyId)
  })
}

export function useRoomTypeOptions() {
  return useRoomTypes() // same data, kept as a separate name so intent is clear at each call site
}

export function useRoomType(id: string | null) {
  const { propertyId } = useAdminScope()
  return useQuery({
    queryKey: ['roomType', propertyId, id],
    queryFn: () => api.getRoomType(id as string, propertyId),
    enabled: !!id
  })
}

function useInvalidateRoomTypes() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['roomTypes'] })
    qc.invalidateQueries({ queryKey: ['roomType'] })
  }
}

export function useCreateRoomType() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: (input: api.RoomTypeInput) => api.createRoomType(input, propertyId),
    onSuccess: invalidate
  })
}

export function useUpdateRoomType() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.RoomTypeInput & { isActive: boolean }> }) =>
      api.updateRoomType(id, input, propertyId),
    onSuccess: invalidate
  })
}

export function useDeactivateRoomType() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: (id: string) => api.deactivateRoomType(id, propertyId),
    onSuccess: invalidate
  })
}

export function useUploadRoomTypeImage() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: async ({ roomTypeId, file }: { roomTypeId: string; file: File }) => {
      const uploaded = await api.uploadMedia(file, propertyId)
      return api.addRoomTypeImage(roomTypeId, uploaded.url, false, propertyId)
    },
    onSuccess: invalidate
  })
}

export function useSetRoomTypeImageCover() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: ({ roomTypeId, imageId }: { roomTypeId: string; imageId: string }) =>
      api.setRoomTypeImageCover(roomTypeId, imageId, propertyId),
    onSuccess: invalidate
  })
}

export function useDeleteRoomTypeImage() {
  const { propertyId } = useAdminScope()
  const invalidate = useInvalidateRoomTypes()
  return useMutation({
    mutationFn: ({ roomTypeId, imageId }: { roomTypeId: string; imageId: string }) =>
      api.deleteRoomTypeImage(roomTypeId, imageId, propertyId),
    onSuccess: invalidate
  })
}