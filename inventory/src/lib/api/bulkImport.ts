import { apiClient, ApiResponse } from './client';

export type BulkKind = 'setup' | 'operations';
export type BulkMode = 'validate' | 'import';

export interface BulkStep {
  key: 'reference' | 'setup' | 'operations';
  label: string;
  done: boolean;
  ready?: boolean;
  note?: string;
}

export interface BulkStatus {
  counts: Record<string, number>;
  steps: BulkStep[];
  stored_files: number;
}

export interface SheetResult {
  rows: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: number;
}

export interface RowError {
  sheet: string;
  row: number | null;
  column: string | null;
  message: string;
}

export interface StoredFile {
  id: string;
  kind: BulkKind;
  original_name: string;
  stored_name: string;
  size: number;
  uploaded_at: string;
  uploaded_by: { id: string; name: string | null };
  sheets: Record<string, SheetResult>;
  upload_order: number;
}

export interface BulkResult {
  ok: boolean;
  dry_run: boolean;
  committed: boolean;
  kind: BulkKind;
  file_name?: string;
  sheets: Record<string, SheetResult>;
  errors: RowError[];
  ignored_sheets: string[];
  stored?: StoredFile;
}

const BASE = '/admin/bulk-import';

export async function getBulkStatus() {
  const res = await apiClient.get<ApiResponse<BulkStatus>>(`${BASE}/status`);
  return res.data.data;
}

export async function listBulkFiles() {
  const res = await apiClient.get<ApiResponse<StoredFile[]>>(`${BASE}/files`);
  return res.data.data;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export async function uploadBulkFile(args: {
  file: File;
  expectedKind: BulkKind;
  mode: BulkMode;
}) {
  const res = await apiClient.post<ApiResponse<BulkResult>>(`${BASE}/upload`, {
    file_name: args.file.name,
    file_base64: await fileToBase64(args.file),
    expected_kind: args.expectedKind,
    mode: args.mode,
  });
  return res.data.data;
}

export async function reimportBulkFile(args: { id: string; mode: BulkMode }) {
  const res = await apiClient.post<ApiResponse<BulkResult>>(
    `${BASE}/files/${args.id}/reimport`,
    { mode: args.mode }
  );
  return res.data.data;
}

// Downloads go through axios so the auth header is sent.
async function download(path: string, fallbackName: string) {
  const res = await apiClient.get<Blob>(path, { responseType: 'blob' });
  const disposition = String(res.headers['content-disposition'] || '');
  const match = disposition.match(/filename="?([^"]+)"?/);
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = match ? match[1] : fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadTemplate = (kind: BulkKind) =>
  download(`${BASE}/template/${kind}`, `${kind}-template.xlsx`);

export const downloadExport = (kind: BulkKind) =>
  download(`${BASE}/export/${kind}`, `${kind}.xlsx`);

export const downloadStoredFile = (file: StoredFile) =>
  download(`${BASE}/files/${file.id}/download`, file.original_name);

// ─── New product form ──────────────────────────────────────────────

export type ProductKind = 'produced' | 'packaged' | 'ingredient' | 'portioned';

export interface ProductOptions {
  units: { code: string; name: string }[];
  properties: { code: string; name: string }[];
  items: { code: string; name: string; item_type: string; unit: string | null }[];
}

export interface ProductInput {
  code: string;
  name: string;
  kind: ProductKind;
  unit: string;
  properties?: string | null;
  price?: number | null;
  category?: string | null;
  station?: string | null;
  store_type?: string | null;
  reorder_level?: number | null;
  pack_size?: number | null;
  pack_label?: string | null;
  ingredients?: string | null;
  portion_name?: string | null;
  portion_size?: number | null;
  portion_unit?: string | null;
}

export async function getProductOptions() {
  const res = await apiClient.get<ApiResponse<ProductOptions>>('/products/options');
  return res.data.data;
}

export async function createProducts(args: { products: ProductInput[]; mode: BulkMode }) {
  const res = await apiClient.post<ApiResponse<BulkResult>>('/products', args);
  return res.data.data;
}
