import { apiRequest } from '../lib/apiClient'
import type { OccupancyRow, RevenueRow } from '../types/report'

export function getOccupancyReport(from: string, to: string, propertyId?: string) {
  return apiRequest<OccupancyRow[]>('/admin/reports/occupancy', { query: { from, to, propertyId } })
}

export function getRevenueReport(from: string, to: string, propertyId?: string) {
  return apiRequest<RevenueRow[]>('/admin/reports/revenue', { query: { from, to, propertyId } })
}