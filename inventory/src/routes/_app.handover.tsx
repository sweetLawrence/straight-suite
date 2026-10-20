import { createFileRoute } from '@tanstack/react-router'
import { HandoverView } from '@/components/payments/HandoverView'

export const Route = createFileRoute('/_app/handover')({
  component: () => <HandoverView title='My Handover' />
})
