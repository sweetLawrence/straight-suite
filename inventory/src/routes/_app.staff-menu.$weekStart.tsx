import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  ArrowLeft,
  Lock,
  MoreVertical,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  useStaffMenuWeek,
  useLockStaffMenuWeek,
  useUnlockStaffMenuWeek,
  useDeleteStaffMenuWeek,
} from '@/hooks/useStaffMenu';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { WeekGrid } from '@/components/staff-menu/WeekGrid';
import { EditSlotModal } from '@/components/staff-menu/EditSlotModal';
import { StaffMenuSchedule } from '@/lib/api/staffMenu';
import { getErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils/format';

export const Route = createFileRoute('/_app/staff-menu/$weekStart')({
  component: WeekDetailPage,
});

type MealType = 'breakfast' | 'lunch' | 'supper';

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return `${start.toLocaleDateString('en-KE', opts)} – ${end.toLocaleDateString('en-KE', opts)}`;
}

function WeekDetailPage() {
  const { weekStart } = Route.useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const query = useStaffMenuWeek(weekStart);
  const lock = useLockStaffMenuWeek();
  const unlock = useUnlockStaffMenuWeek();
  const del = useDeleteStaffMenuWeek();

  const [editOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [editing, setEditing] = useState<{
    dayOfWeek: number;
    mealType: MealType;
    existing: StaffMenuSchedule | null;
  } | null>(null);

  const canManage = auth.hasPermission('menu.manage');

  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data) {
    return <EmptyState title="Week not found" />;
  }

  const week = query.data;
  const allSchedules = week.schedules || [];
  const isLocked = allSchedules.length > 0 && allSchedules.every((s) => s.status === 'locked');
  const hasAnySlots = allSchedules.length > 0;

  const handleEditSlot = (
    dayOfWeek: number,
    mealType: MealType,
    existing: StaffMenuSchedule | null
  ) => {
    setEditing({ dayOfWeek, mealType, existing });
    openEdit();
  };

  const handleLock = async () => {
    try {
      await lock.mutateAsync({ weekStart });
      notifications.show({
        color: 'green',
        title: 'Week locked',
        message: 'Slots can no longer be edited.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const handleUnlock = async () => {
    try {
      await unlock.mutateAsync({ weekStart });
      notifications.show({
        color: 'orange',
        title: 'Week unlocked',
        message: 'Slots are editable again.',
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft week? This cannot be undone.')) return;
    try {
      await del.mutateAsync({ weekStart });
      notifications.show({
  color: 'orange',
  title: 'Week deleted',
  message: 'The schedule has been removed.',
});
      navigate({ to: '/staff-menu' });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Failed',
        message: getErrorMessage(err),
      });
    }
  };

  return (
    <>
      <Link to="/staff-menu" style={{ textDecoration: 'none' }}>
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} mb="sm">
          Back to weeks
        </Button>
      </Link>

      <PageHeader
        title={`Week of ${formatWeekRange(weekStart)}`}
        subtitle={`${allSchedules.length} slot${allSchedules.length === 1 ? '' : 's'} planned`}
        actions={
          <Group gap="sm">
            <Badge
              variant="light"
              color={isLocked ? 'red' : 'blue'}
              size="lg"
            >
              {isLocked ? 'Locked' : 'Draft'}
            </Badge>

            {canManage && (
              <Menu shadow="md" position="bottom-end">
                <Menu.Target>
                  <Button variant="default" leftSection={<MoreVertical size={16} />}>
                    Actions
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {!isLocked && hasAnySlots && (
                    <Menu.Item
                      leftSection={<Lock size={14} />}
                      onClick={handleLock}
                    >
                      Lock week
                    </Menu.Item>
                  )}
                  {isLocked && (
                    <Menu.Item
                      leftSection={<Unlock size={14} />}
                      onClick={handleUnlock}
                    >
                      Unlock week
                    </Menu.Item>
                  )}
                  {!isLocked && (
                    <Menu.Item
                      color="red"
                      leftSection={<Trash2 size={14} />}
                      onClick={handleDelete}
                    >
                      Delete week
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        }
      />

      {isLocked && (
        <Alert
          icon={<Lock size={16} />}
          color="red"
          variant="light"
          mb="md"
        >
          <Text size="sm">
            This week is locked. Slots cannot be edited until the week is
            unlocked. Only a manager or MD can unlock.
          </Text>
        </Alert>
      )}

      {!hasAnySlots && (
        <Alert icon={<Lock size={16} />} color="blue" variant="light" mb="md">
          <Text size="sm">
            No slots planned yet. Tap a cell to add items for that day and meal.
          </Text>
        </Alert>
      )}

      <WeekGrid
        week={week}
        onEditSlot={handleEditSlot}
        readOnly={isLocked || !canManage}
      />

      {editing && (
        <EditSlotModal
          opened={editOpen}
          onClose={closeEdit}
          weekStart={weekStart}
          dayOfWeek={editing.dayOfWeek}
          mealType={editing.mealType}
          existing={editing.existing}
        />
      )}
    </>
  );
}