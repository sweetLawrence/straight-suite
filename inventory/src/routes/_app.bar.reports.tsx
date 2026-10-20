import { createFileRoute } from '@tanstack/react-router'
import { Alert, Text } from '@mantine/core'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

export const Route = createFileRoute('/_app/bar/reports')({
  component: BarReportsPage
})

function BarReportsPage () {
  return (
    <>
      <PageHeader title='Bar Reports' subtitle='Bar-only revenue' />
      <Alert icon={<Info size={16} />} color='blue' variant='light'>
        <Text size='sm'>
          Bar-specific reports are coming soon. For now, use the main Reports
          page - data is filtered automatically based on your role.
        </Text>
      </Alert>
    </>
  )
}
