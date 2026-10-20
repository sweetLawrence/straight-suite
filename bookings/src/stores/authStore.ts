import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'staff' | 'admin' | 'superadmin'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  role: Role | null
  userPropertyId: string | null
  selectedPropertyId: string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  setSelectedProperty: (propertyId: string) => void
  logout: () => void
}

function decodeJwt(token: string): { role?: Role; propertyId?: string | null } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      userPropertyId: null,
      selectedPropertyId: null,
      setTokens: (accessToken, refreshToken) => {
        const payload = decodeJwt(accessToken)
        set({
          accessToken,
          refreshToken,
          role: payload?.role ?? null,
          userPropertyId: payload?.propertyId ?? null,
          selectedPropertyId: payload?.propertyId ?? get().selectedPropertyId
        })
      },
      setSelectedProperty: (propertyId) => set({ selectedPropertyId: propertyId }),
      logout: () => set({ accessToken: null, refreshToken: null, role: null, userPropertyId: null })
    }),
    { name: 'booking-admin-auth' }
  )
)