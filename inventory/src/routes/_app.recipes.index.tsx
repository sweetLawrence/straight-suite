import { createFileRoute } from '@tanstack/react-router';
import { ActionIcon, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { useRecipesList } from '@/hooks/useMenu';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { CreateRecipeModal } from '@/components/menu/CreateRecipeModal';
import { EditRecipeModal } from '@/components/menu/EditRecipeModal';
import { Recipe } from '@/lib/api/menu';
import { formatNumber } from '@/lib/utils/format';
import { Can } from '@/components/Can';

export const Route = createFileRoute('/_app/recipes/')({
  component: RecipesPage,
});

function RecipesPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Recipe | null>(null);

  const [createOpen, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [editOpen, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);

  const query = useRecipesList({ page, limit: 20 });
  const canManage = auth.hasPermission('menu.manage');

  const columns: Column<Recipe>[] = [
    {
      key: 'menu_item',
      header: 'Menu Item',
      render: (r) => r.menu_item?.display_name || '-',
    },
    {
      key: 'stock_item',
      header: 'Ingredient',
      render: (r) => r.stock_item?.name || '-',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (r) => formatNumber(r.quantity, 3),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        canManage ? (
          <ActionIcon
            variant="subtle"
            onClick={() => {
              setSelected(r);
              openEdit();
            }}
          >
            <Pencil size={16} />
          </ActionIcon>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Recipes"
        subtitle="Ingredients consumed per menu item"
        actions={
          canManage ? (
            <Can perm="menu.manage">
            <Button leftSection={<Plus size={16} />} onClick={openCreate}>
              Add Recipe Line
            </Button>
            </Can>
          ) : undefined
        }
      />
      <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? 'Failed to load recipes' : null}
        rowKey={(r) => r.id}
        meta={query.data?.meta}
        onPageChange={setPage}
        emptyTitle="No recipes"
        emptyDescription="Link menu items to the ingredients they use."
      />
      <CreateRecipeModal opened={createOpen} onClose={closeCreate} />
      <EditRecipeModal opened={editOpen} onClose={closeEdit} recipe={selected} />
    </>
  );
}