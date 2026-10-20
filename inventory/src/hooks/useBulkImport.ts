// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import {
//   getBulkStatus,
//   listBulkFiles,
//   uploadBulkFile,
//   reimportBulkFile
// } from '@/lib/api/bulkImport'

// export function useBulkStatus () {
//   return useQuery({
//     queryKey: ['bulk-import', 'status'],
//     queryFn: getBulkStatus
//   })
// }

// export function useBulkFiles () {
//   return useQuery({
//     queryKey: ['bulk-import', 'files'],
//     queryFn: listBulkFiles
//   })
// }

// // A committed import changes almost everything - refresh all cached lists.
// function useRefreshAfterImport () {
//   const qc = useQueryClient()
//   return (committed: boolean) => {
//     if (committed) qc.invalidateQueries()
//     else qc.invalidateQueries({ queryKey: ['bulk-import'] })
//   }
// }

// export function useUploadBulkFile () {
//   const refresh = useRefreshAfterImport()
//   return useMutation({
//     mutationFn: uploadBulkFile,
//     onSuccess: r => refresh(r.committed)
//   })
// }

// export function useReimportBulkFile () {
//   const refresh = useRefreshAfterImport()
//   return useMutation({
//     mutationFn: reimportBulkFile,
//     onSuccess: r => refresh(r.committed)
//   })
// }

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBulkStatus,
  listBulkFiles,
  uploadBulkFile,
  reimportBulkFile,
  getProductOptions,
  createProducts
} from '@/lib/api/bulkImport'

export function useBulkStatus () {
  return useQuery({
    queryKey: ['bulk-import', 'status'],
    queryFn: getBulkStatus
  })
}

export function useBulkFiles () {
  return useQuery({
    queryKey: ['bulk-import', 'files'],
    queryFn: listBulkFiles
  })
}

// A committed import changes almost everything - refresh all cached lists.
function useRefreshAfterImport () {
  const qc = useQueryClient()
  return (committed: boolean) => {
    if (committed) qc.invalidateQueries()
    else qc.invalidateQueries({ queryKey: ['bulk-import'] })
  }
}

export function useUploadBulkFile () {
  const refresh = useRefreshAfterImport()
  return useMutation({
    mutationFn: uploadBulkFile,
    onSuccess: r => refresh(r.committed)
  })
}

export function useReimportBulkFile () {
  const refresh = useRefreshAfterImport()
  return useMutation({
    mutationFn: reimportBulkFile,
    onSuccess: r => refresh(r.committed)
  })
}

export function useProductOptions () {
  return useQuery({ queryKey: ['product-options'], queryFn: getProductOptions })
}

export function useCreateProducts () {
  const refresh = useRefreshAfterImport()
  return useMutation({
    mutationFn: createProducts,
    onSuccess: r => refresh(r.committed)
  })
}
