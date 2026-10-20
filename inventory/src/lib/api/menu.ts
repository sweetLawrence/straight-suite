import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface Unit {
  id: string;
  code: string;
  name: string;
  unit_type: 'weight' | 'volume' | 'count';
  base_unit_id: string | null;
  conversion_factor: string | null;
}

export async function listUnits(params?: { page?: number; limit?: number; unit_type?: string }) {
  const res = await apiClient.get<PaginatedResponse<Unit>>('/menu/units', { params });
  return res.data;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  item_type:
    | 'stock_portioned'
    | 'stock_bulk'
    | 'stock_packaged'
    | 'stock_produced'
    | 'menu'
    | 'service';
  base_unit_id: string | null;
  status: string;
  base_unit?: Unit | null;
}

export async function listItems(params?: { page?: number; limit?: number; item_type?: string; status?: string }) {
  const res = await apiClient.get<PaginatedResponse<Item>>('/menu/items', { params });
  return res.data;
}

export async function getItem(id: string) {
  const res = await apiClient.get<ApiResponse<Item>>(`/menu/items/${id}`);
  return res.data.data;
}

export interface MenuItem {
  id: string;
  item_id: string;
  property_id: string;
  display_name: string;
  price: string;
  category: string | null;
  station: 'kitchen' | 'bar' | 'both' | null;
  status: string;
  sold_out?: boolean;
  effective_from: string;
  effective_to: string | null;
  item?: Item;
  property?: { id: string; code: string; name: string };
}

export async function listMenuItems(params?: {
  page?: number;
  limit?: number;
  category?: string;
  station?: string;
  status?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<MenuItem>>('/menu/menu-items', { params });
  return res.data;
}

export async function getMenuItem(id: string) {
  const res = await apiClient.get<ApiResponse<MenuItem>>(`/menu/menu-items/${id}`);
  return res.data.data;
}

// export async function createMenuItem(data: {
//   item_id: string;
//   display_name: string;
//   price: number;
//   category?: string;
//   station?: 'kitchen' | 'bar' | 'both';
//   status?: 'active' | 'inactive' | 'discontinued';
// }) {
//   const res = await apiClient.post<ApiResponse<MenuItem>>('/menu/menu-items', data);
//   return res.data.data;
// }




// export async function createMenuItem(data: {
//   item_id?: string;
//   code?: string;
//   name?: string;
//   display_name: string;
//   price: number;
//   category?: string;
//   station?: 'kitchen' | 'bar' | 'both';
// }) {
//   const res = await apiClient.post<ApiResponse<MenuItem>>(
//     '/menu/menu-items',
//     data
//   );
//   return res.data.data;
// }




export async function createMenuItem(data: {
  item_id?: string;
  code?: string;
  name?: string;
  display_name: string;
  price: number;
  category?: string;
  station?: 'kitchen' | 'bar' | 'both';
  ingredients?: Array<{
    stock_item_id: string;
    quantity: number;
    unit_id: string;
    portion_definition_id?: string | null;
  }>;
}) {
  const res = await apiClient.post<ApiResponse<MenuItem>>(
    '/menu/menu-items',
    data
  );
  return res.data.data;
}


export interface PortionDefinition {
  id: string;
  stock_item_id: string;
  property_id: string;
  portion_name: string;
  portion_size: string;
  portion_unit_id: string;
  sell_price: string;
  status: string;
}

export async function listPortionDefinitions(params?: {
  page?: number;
  limit?: number;
  stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<PortionDefinition>>(
    '/menu/portion-definitions',
    { params }
  );
  return res.data;
}

export interface Recipe {
  id: string;
  menu_item_id: string;
  stock_item_id: string;
  portion_definition_id: string | null;
  quantity: string;
  unit_id: string;
  menu_item?: {
    id: string;
    display_name: string;
    price: string;
    station: string | null;
    status: string;
  };
  stock_item?: {
    id: string;
    code: string;
    name: string;
    item_type: string;
  };
  portion_definition?: {
    id: string;
    portion_name: string;
    portion_size: string;
    sell_price: string;
  } | null;
  unit?: {
    id: string;
    code: string;
    name: string;
  };
}

export async function listRecipes(params?: {
  page?: number;
  limit?: number;
  menu_item_id?: string;
  stock_item_id?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<Recipe>>('/menu/recipes', { params });
  return res.data;
}



export async function updateMenuItem(
  id: string,
  data: {
    display_name?: string;
    price?: number;
    category?: string;
    station?: 'kitchen' | 'bar' | 'both';
    status?: 'active' | 'inactive' | 'discontinued';
  }
) {
  const res = await apiClient.patch<ApiResponse<MenuItem>>(
    `/menu/menu-items/${id}`,
    data
  );
  return res.data.data;
}

export async function updatePortionDefinition(
  id: string,
  data: {
    portion_name?: string;
    portion_size?: number;
    portion_unit_id?: string;
    sell_price?: number;
    status?: 'active' | 'inactive';
  }
) {
  const res = await apiClient.patch<ApiResponse<PortionDefinition>>(
    `/menu/portion-definitions/${id}`,
    data
  );
  return res.data.data;
}

export async function createPortionDefinition(data: {
  stock_item_id: string;
  portion_name: string;
  portion_size: number;
  portion_unit_id: string;
  sell_price: number;
}) {
  const res = await apiClient.post<ApiResponse<PortionDefinition>>(
    '/menu/portion-definitions',
    data
  );
  return res.data.data;
}

export async function updateRecipe(
  id: string,
  data: {
    quantity?: number;
    unit_id?: string;
    portion_definition_id?: string | null;
  }
) {
  const res = await apiClient.patch<ApiResponse<Recipe>>(
    `/menu/recipes/${id}`,
    data
  );
  return res.data.data;
}

export async function createRecipe(data: {
  menu_item_id: string;
  stock_item_id: string;
  portion_definition_id?: string | null;
  quantity: number;
  unit_id: string;
}) {
  const res = await apiClient.post<ApiResponse<Recipe>>('/menu/recipes', data);
  return res.data.data;
}
export async function setMenuItemSoldOut(id: string, sold_out: boolean) {
  const res = await apiClient.post<ApiResponse<MenuItem>>(`/menu/menu-items/${id}/sold-out`, { sold_out });
  return res.data.data;
}
