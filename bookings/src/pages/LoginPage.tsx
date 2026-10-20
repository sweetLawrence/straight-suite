import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput, PasswordInput, Button, Alert } from '@mantine/core'
import { apiRequest, ApiError } from '../lib/apiClient'
import { useAuthStore } from '../stores/authStore'
import type { LoginResponse } from '../types/api'
import { getVersion } from '@tauri-apps/api/app'

export default function LoginPage () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState('')
  const setTokens = useAuthStore(s => s.setTokens)
  const navigate = useNavigate()

  async function handleSubmit () {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false
      })
      setTokens(data.accessToken, data.refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown (e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  useEffect(() => {
    // Only works inside the desktop app; in a browser or inside Straight Suite it is skipped
    getVersion().then(setVersion).catch(() => {})
  }, [])

  return (
    <div className='min-h-screen flex bg-back-500'>
      {/* Brand panel - explicit colors so it renders regardless of theme config */}
      <div
        className='hidden lg:flex lg:w-[42%] relative flex-col justify-between px-12 py-14 overflow-hidden'
        style={{ backgroundColor: '#0F1E33', color: '#FFFFFF' }}
      >
        <div
          className='absolute inset-0 opacity-[0.07] pointer-events-none'
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, #FFFFFF 0, #FFFFFF 1px, transparent 1px, transparent 14px)'
          }}
        />

        <div className='relative'>
          <span
            className='font-mono text-[11px] tracking-[0.25em] uppercase'
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Straight Group
          </span>
          <h1 className='font-serif text-4xl leading-tight mt-6 max-w-sm'>
            Property management, in one place.
          </h1>
          <p
            className='mt-4 max-w-sm text-sm leading-relaxed'
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Manage rooms, rates, offers and inquiries across every property from
            a single admin console.
          </p>
        </div>

        {/* Brand panel footer with Easter egg */}
        <div
          className='relative pt-6 flex items-center justify-between'
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <div className='flex items-center gap-3 min-w-0'>
            <span
              className='font-mono text-[11px] tracking-wider whitespace-nowrap'
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              CENTURION HOTEL &middot; MUM&apos;S GARDEN RESORT
            </span>
            
            {/*  EASTER EGG: "You have my power." */}
            <span
              className='font-mono text-[11px] tracking-wider cursor-pointer transition-all duration-500 whitespace-nowrap'
              style={{
                color: 'rgba(255,255,255,0)',
                opacity: 0,
                background: 'transparent',
                textShadow: '0 0 0px transparent'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.color = '#FFFFFF'
                e.currentTarget.style.textShadow = '0 0 20px #FF0000, 0 0 40px #FFFFFF, 0 0 60px #0033A0'
                e.currentTarget.style.transition = 'all 0.5s ease'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '0'
                e.currentTarget.style.color = 'rgba(255,255,255,0)'
                e.currentTarget.style.textShadow = '0 0 0px transparent'
              }}
              onClick={() => window.open('https://www.chainforge.systems', '_blank')}
            >
              "My power is now yours"-Lawrence
            </span>
          </div>

          <span
            className='w-1.5 h-1.5 rounded-full flex-shrink-0'
            style={{ backgroundColor: '#C9A227' }}
          />
        </div>
      </div>

      {/* Form panel */}
      <div className='flex-1 flex items-center justify-center px-6 sm:px-12'>
        <div className='w-full max-w-sm'>
          <div className='lg:hidden mb-8'>
            <span className='font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/60'>
              Straight Group
            </span>
          </div>

          <span className='font-mono text-[11px] tracking-[0.25em] uppercase text-primary-700/50'>
            Admin Console
          </span>
          <h2 className='font-serif text-3xl text-primary-700 mt-2 mb-1'>
            Sign in
          </h2>
          <p className='text-sm text-surface-500 mb-8'>
            Enter your credentials to access the dashboard.
          </p>

          {error && (
            <Alert color='red' mb='md' radius='sm' variant='light'>
              {error}
            </Alert>
          )}

          <div className='space-y-4'>
            <TextInput
              label='Email'
              placeholder='you@straightgroup.co.ke'
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              radius='sm'
            />
            <PasswordInput
              label='Password'
              placeholder='••••••••'
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              radius='sm'
            />
          </div>

          <Button
            fullWidth
            loading={loading}
            onClick={handleSubmit}
            color='primary'
            radius='sm'
            mt='xl'
            size='md'
          >
            Sign in
          </Button>

          <div className='mt-8 border-t border-surface-200 pt-6 flex items-center justify-between'>
            <p className='text-xs text-surface-400'>
              Restricted access &middot; Staff and administrators only
            </p>

            {version && (
              <span className='font-mono text-[10px] text-surface-300'>
                v{version}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}