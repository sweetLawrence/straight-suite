import { apiRequest } from '../../lib/apiClient'
import type { InviteDetails } from '../../types/invite'
import type { LoginResponse } from '../../types/api'

export function getInviteDetails(token: string) {
  return apiRequest<InviteDetails>(`/invites/${token}`, { auth: false })
}

export function acceptInvite(token: string, password: string, confirmPassword: string) {
  return apiRequest<LoginResponse>('/invites/accept', {
    method: 'POST',
    body: { token, password, confirmPassword },
    auth: false
  })
}