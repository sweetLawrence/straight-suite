import { useState, useEffect } from 'react'
import {
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Paper,
  Loader
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../stores/authStore'
import {
  usePropertySettings,
  useUpdatePropertySettings
} from '../features/property/hooks'
import { useRegisterC2bUrls } from '../features/payments/hooks'

export default function SettingsPage () {
  const role = useAuthStore(s => s.role)
  const { data: property, isLoading } = usePropertySettings()
  const updateSettings = useUpdatePropertySettings()
  const canEdit = role === 'admin' || role === 'superadmin'

  const [c2bBaseUrl, setC2bBaseUrl] = useState('')
  const registerC2b = useRegisterC2bUrls()

  const form = useForm({
    initialValues: {
      contactEmail: '',
      contactPhone: '',
      address: '',
      checkInTime: '',
      checkOutTime: ''
    }
  })

  function handleRegisterC2b() {
    if (!c2bBaseUrl) return
    registerC2b.mutate(c2bBaseUrl, {
      onSuccess: () => notifications.show({ message: 'C2B URLs registered with Daraja.', color: 'green' }),
      onError: (err: any) => notifications.show({ message: err.message, color: 'red' })
    })
  }

  useEffect(() => {
    if (property) {
      form.setValues({
        contactEmail: property.contactEmail ?? '',
        contactPhone: property.contactPhone ?? '',
        address: property.address ?? '',
        checkInTime: property.checkInTime?.slice(0, 5) ?? '',
        checkOutTime: property.checkOutTime?.slice(0, 5) ?? ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property])

  function handleSubmit (values: typeof form.values) {
    updateSettings.mutate(values, {
      onSuccess: () =>
        notifications.show({ message: 'Settings saved.', color: 'green' }),
      onError: (err: any) =>
        notifications.show({ message: err.message, color: 'red' })
    })
  }

  if (isLoading || !property) return <Loader />

  return (
    <Stack gap='lg'>
      <div>
        <Title order={2} className='text-primary-700'>
          Property Settings - {property.name}
        </Title>
        <Text size='sm' c='dimmed'>
          {canEdit
            ? 'Contact details and check-in/out times.'
            : 'View-only - ask an admin to make changes.'}
        </Text>
      </div>

      <Paper withBorder p='md' radius='md' maw={420}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label='Contact email'
              {...form.getInputProps('contactEmail')}
              disabled={!canEdit}
            />
            <TextInput
              label='Contact phone'
              {...form.getInputProps('contactPhone')}
              disabled={!canEdit}
            />
            <TextInput
              label='Address'
              {...form.getInputProps('address')}
              disabled={!canEdit}
            />
            <TextInput
              label='Check-in time (HH:mm)'
              {...form.getInputProps('checkInTime')}
              disabled={!canEdit}
            />
            <TextInput
              label='Check-out time (HH:mm)'
              {...form.getInputProps('checkOutTime')}
              disabled={!canEdit}
            />
            {canEdit && (
              <Button
                type='submit'
                color='primary'
                loading={updateSettings.isPending}
                mt='sm'
              >
                Save
              </Button>
            )}
          </Stack>
        </form>
      </Paper>

      {role === 'superadmin' && (
        <Paper withBorder p='md' radius='md' maw={420}>
          {/* <Text fw={600} mb='xs'>C2B Setup (dev only - re-run whenever your ngrok URL changes)</Text> */}
          <Text fw={600} mb='xs'>C2B Setup</Text>
          <TextInput
            label='Public base URL'
            placeholder='https://callback.com'
            value={c2bBaseUrl}
            onChange={(e) => setC2bBaseUrl(e.currentTarget.value)}
          />
          <Button 
            mt='sm' 
            size='xs' 
            onClick={handleRegisterC2b} 
            loading={registerC2b.isPending}
          >
            Register with Daraja
          </Button>
        </Paper>
      )}
    </Stack>
  )
}
