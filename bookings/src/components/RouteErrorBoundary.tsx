import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { Alert, Button, Stack, Title } from '@mantine/core'
import { AlertTriangle } from 'lucide-react'

export default function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  let message = 'Something went wrong loading this page.'
  if (isRouteErrorResponse(error)) {
    message = error.statusText || message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Stack align="flex-start" p="md">
      <Title order={3}>This page hit a snag</Title>
      <Alert color="red" icon={<AlertTriangle size={18} />} title="Error" variant="light">
        {message}
      </Alert>
      <Button variant="light" onClick={() => navigate(0)}>Reload this page</Button>
    </Stack>
  )
}