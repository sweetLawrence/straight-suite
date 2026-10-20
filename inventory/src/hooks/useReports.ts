// import { useQuery } from '@tanstack/react-query';
// import {
//   fetchBillsInRange,
//   fetchPaymentsInRange,
//   fetchExceptionsInRange,
//   fetchPropertiesList,
//   DateRange,
// } from '@/lib/api/reports';

// export function useBillsReport(range: DateRange, propertyId?: string) {
//   return useQuery({
//     queryKey: ['report-bills', range, propertyId],
//     queryFn: () =>
//       fetchBillsInRange({
//         from: range.from,
//         to: range.to,
//         property_id: propertyId,
//       }),
//     enabled: !!range.from && !!range.to,
//   });
// }

// export function usePaymentsReport(range: DateRange, propertyId?: string) {
//   return useQuery({
//     queryKey: ['report-payments', range, propertyId],
//     queryFn: () =>
//       fetchPaymentsInRange({
//         from: range.from,
//         to: range.to,
//         property_id: propertyId,
//       }),
//     enabled: !!range.from && !!range.to,
//   });
// }

// export function useExceptionsReport(range: DateRange, propertyId?: string) {
//   return useQuery({
//     queryKey: ['report-exceptions', range, propertyId],
//     queryFn: () =>
//       fetchExceptionsInRange({
//         from: range.from,
//         to: range.to,
//         property_id: propertyId,
//       }),
//     enabled: !!range.from && !!range.to,
//   });
// }

// export function usePropertiesForReports() {
//   return useQuery({
//     queryKey: ['report-properties'],
//     queryFn: fetchPropertiesList,
//   });
// }













import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchBillsInRange,
  fetchPaymentsInRange,
  fetchExceptionsInRange,
  fetchPropertiesList,
  DateRange,
  getReportOverview,
  getReportActivity,
  downloadReport,
  ReportParams,
  ActivityParams,
} from '@/lib/api/reports';

export function useBillsReport(range: DateRange, propertyId?: string) {
  return useQuery({
    queryKey: ['report-bills', range, propertyId],
    queryFn: () =>
      fetchBillsInRange({
        from: range.from,
        to: range.to,
        property_id: propertyId,
      }),
    enabled: !!range.from && !!range.to,
  });
}

export function usePaymentsReport(range: DateRange, propertyId?: string) {
  return useQuery({
    queryKey: ['report-payments', range, propertyId],
    queryFn: () =>
      fetchPaymentsInRange({
        from: range.from,
        to: range.to,
        property_id: propertyId,
      }),
    enabled: !!range.from && !!range.to,
  });
}

export function useExceptionsReport(range: DateRange, propertyId?: string) {
  return useQuery({
    queryKey: ['report-exceptions', range, propertyId],
    queryFn: () =>
      fetchExceptionsInRange({
        from: range.from,
        to: range.to,
        property_id: propertyId,
      }),
    enabled: !!range.from && !!range.to,
  });
}

export function usePropertiesForReports() {
  return useQuery({
    queryKey: ['report-properties'],
    queryFn: fetchPropertiesList,
  });
}
// ─── Server-side reports ───────────────────────────────────────────

export function useReportOverview(params: ReportParams) {
  return useQuery({
    queryKey: ['report-overview', params],
    queryFn: () => getReportOverview(params),
    enabled: !!params.from && !!params.to,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useReportActivity(params: ActivityParams) {
  return useQuery({
    queryKey: ['report-activity', params],
    queryFn: () => getReportActivity(params),
    enabled: !!params.from && !!params.to,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useDownloadReport() {
  return useMutation({ mutationFn: (params: ReportParams) => downloadReport(params) });
}
