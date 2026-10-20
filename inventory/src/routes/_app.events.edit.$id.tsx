import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { EventForm } from '@/components/events/EventForm';
import { useEvent } from '@/hooks/useEvents';

export const Route = createFileRoute('/_app/events/edit/$id')({ component: EditEventPage });

function EditEventPage() {
  const { id } = Route.useParams();
  const q = useEvent(id);
  if (q.isLoading) return <LoadingState />;
  if (!q.data) return <EmptyState title="Event not found" />;
  return (
    <>
      <Button component={Link} to={`/events/${id}`} variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">Back</Button>
      <PageHeader title={`Edit ${q.data.title}`} subtitle={q.data.invoice_ref ? `Invoice ${q.data.invoice_ref} updates too` : 'Quote'} />
      <EventForm event={q.data} />
    </>
  );
}
