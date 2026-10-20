import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EventForm } from '@/components/events/EventForm';

export const Route = createFileRoute('/_app/events/new')({ component: NewEventPage });

function NewEventPage() {
  return (
    <>
      <Button component={Link} to="/events" variant="subtle" color="gray" size="sm" leftSection={<ArrowLeft size={15} />} mb="xs" px="xs">Events</Button>
      <PageHeader title="New event" subtitle="Saved as a quote. Confirm it to issue the invoice." />
      <EventForm />
    </>
  );
}
