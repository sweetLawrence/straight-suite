import { redirect } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function protectedLoader() {
  if (!useAuthStore.getState().accessToken) {
    throw redirect('/login')
  }
  return null
}