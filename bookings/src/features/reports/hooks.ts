import { useQuery } from '@tanstack/react-query'
import { useAdminScope } from '../../lib/useAdminScope'
import * as api from './api'

export function useReports(from: string, to: string) {
  const { propertyId } = useAdminScope()
  const occupancy = useQuery({
    queryKey: ['occupancyReport', propertyId, from, to],
    queryFn: () => api.getOccupancyReport(from, to, propertyId),
    enabled: !!from && !!to
  })
  const revenue = useQuery({
    queryKey: ['revenueReport', propertyId, from, to],
    queryFn: () => api.getRevenueReport(from, to, propertyId),
    enabled: !!from && !!to
  })
  return { occupancy, revenue }
}