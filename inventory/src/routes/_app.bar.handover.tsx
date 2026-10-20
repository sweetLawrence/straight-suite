import { createFileRoute } from '@tanstack/react-router';
import { HandoverView } from '@/components/payments/HandoverView';

export const Route = createFileRoute('/_app/bar/handover')({
  component: () => <HandoverView title="Bar Handover" />,
});
