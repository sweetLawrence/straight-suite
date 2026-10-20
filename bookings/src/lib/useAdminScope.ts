import { useAuthStore } from '../stores/authStore'

export function useAdminScope() {
  const role = useAuthStore((s) => s.role)
  const selectedPropertyId = useAuthStore((s) => s.selectedPropertyId)
  return { propertyId: role === 'superadmin' ? selectedPropertyId ?? undefined : undefined }
}