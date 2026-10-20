import { createFileRoute, redirect } from '@tanstack/react-router'

// Bar approvals now live with every other approval on one page
export const Route = createFileRoute('/_app/bar-approvals')({
  beforeLoad: () => {
    throw redirect({ to: '/approvals' })
  }
})
