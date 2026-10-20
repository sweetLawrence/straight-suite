import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowLeft, Lock, MoreVertical, Unlock } from 'lucide-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import {
  useStandingMenu,
  useLockStandingMenu,
  useUnlockStandingMenu,
} from '@/hooks/useStaffMenu';
import { useAuth } from '@/lib/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { WeekGrid } from '@/components/staff-menu/WeekGrid';
import { StandingSlotModal } from '@/components/staff-menu/StandingSlotModal';
import { StaffMenuSchedule } from '@/lib/api/staffMenu';
import { getErrorMessage } from '@/lib/api/client';

export const Route = createFileRoute('/_app/staff-menu/standing')({
  component: StandingMenuPage,
});

type MealType = 'breakfast' | 'lunch' | 'supper';

function StandingMenuPage() {
  const auth = useAuth();
  const query = useStandingMenu();
  const lock = useLockStandingMenu();
  const unlock = useUnlockStandingMenu();

  const [editOpen, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editing, setEditing] = useState<{
    dayOfWeek: number;
    mealType: MealType;
    existing: StaffMenuSchedule | null;
  } | null>(null);

  const canManage = auth.hasPermission('menu.manage');

  if (query.isLoading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  const menu = query.data;
  const allSchedules = menu?.schedules || [];
  const isLocked =
    allSchedules.length > 0 &&
    allSchedules.every((s) => s.status === 'locked');
  const hasAnySlots = allSchedules.length > 0;

  const handleEdit = (
    dayOfWeek: number,
    mealType: MealType,
    existing: StaffMenuSchedule | null
  ) => {
    setEditing({ dayOfWeek, mealType, existing });
    openEdit();
  };

  const handleLock = async () => {
    try {
      await lock.mutateAsync({});
      notifications.show({
        color: 'green',
        title: 'Standing menu locked',
        message: 'No edits until unlocked.',
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
      await unlock.mutateAsync({});
      notifications.show({
        color: 'orange',
        title: 'Standing menu unlocked',
        message: 'Editable again.',
      });
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
        title="Standing Menu"
        subtitle="Applies every week until changed"
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
                  <Button
                    variant="default"
                    leftSection={<MoreVertical size={16} />}
                  >
                    Actions
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {!isLocked && hasAnySlots && (
                    <Menu.Item
                      leftSection={<Lock size={14} />}
                      onClick={handleLock}
                    >
                      Lock standing menu
                    </Menu.Item>
                  )}
                  {isLocked && (
                    <Menu.Item
                      leftSection={<Unlock size={14} />}
                      onClick={handleUnlock}
                    >
                      Unlock standing menu
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        }
      />

      <Alert color="blue" variant="light" mb="md">
        <Text size="sm">
          This is a repeating menu. It applies every week unless a specific
          week overrides it.
        </Text>
      </Alert>

      {!hasAnySlots && (
        <Alert color="gray" variant="light" mb="md">
          <Text size="sm">
            No standing items yet. Tap a cell to add one.
          </Text>
        </Alert>
      )}

      {menu && (
        <WeekGrid
          week={menu}
          onEditSlot={handleEdit}
          readOnly={isLocked || !canManage}
        />
      )}

      {editing && (
        <StandingSlotModal
          opened={editOpen}
          onClose={closeEdit}
          dayOfWeek={editing.dayOfWeek}
          mealType={editing.mealType}
          existing={editing.existing}
        />
      )}
    </>
  );
}