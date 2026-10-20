export type Role = 'staff' | 'admin' | 'superadmin'

export interface LoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: Role
    propertyId: string | null
  }
  accessToken: string
  refreshToken: string
}