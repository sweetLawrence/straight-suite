import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Paper, Title, Text, PasswordInput, Button, Alert, Loader, Stack } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'
import { getInviteDetails, acceptInvite } from '../features/invite/api'
import { useAuthStore } from '../stores/authStore'
import type { InviteDetails } from '../types/invite'

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoadError('No invite token was provided in this link.')
      setLoading(false)
      return
    }
    getInviteDetails(token)
      .then(setInvite)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit() {
    setSubmitError(null)
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const data = await acceptInvite(token, password, confirmPassword)
      setTokens(data.accessToken, data.refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-back-500">
      <Paper shadow="sm" p="xl" radius="md" className="w-96 border border-surface-200">
        {loading ? (
          <Loader mx="auto" display="block" />
        ) : loadError ? (
          <Stack align="center">
            <AlertTriangle size={28} className="text-red-600" />
            <Title order={3}>Invite Link Invalid</Title>
            <Alert color="red" w="100%">{loadError}</Alert>
            <Text size="sm" c="dimmed" ta="center">
              This link may have expired or already been used. Ask a superadmin to send a new invite.
            </Text>
          </Stack>
        ) : (
          <Stack>
            <Title order={2} className="text-primary-700">Set Your Password</Title>
            <Text size="sm" c="dimmed">
              Hi {invite?.firstName}, you've been added as {invite?.role === 'admin' ? 'an admin' : 'a staff member'}
              {invite?.propertyName ? ` for ${invite.propertyName}` : ''}. Set a password to activate your account.
            </Text>
            {submitError && <Alert color="red">{submitError}</Alert>}
            <PasswordInput label="New password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
            <PasswordInput label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.currentTarget.value)} />
            <Button fullWidth color="primary" loading={submitting} onClick={handleSubmit}>
              Set Password &amp; Log In
            </Button>
          </Stack>
        )}
      </Paper>
    </div>
  )
}