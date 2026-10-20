// // import React from 'react'
// // import { useEffect } from 'react'
// // import ReactDOM from 'react-dom/client'
// // import { MantineProvider } from '@mantine/core'
// // import '@mantine/dates/styles.css'
// // import '@mantine/notifications/styles.css'
// // import { Notifications } from '@mantine/notifications'
// // import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// // import { RouterProvider } from 'react-router-dom'
// // import router from './routes'
// // import { theme } from './theme'
// // import './index.css'

// // import { checkForUpdates } from './utils/updater'

// // const queryClient = new QueryClient({
// //   defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
// // })

// // useEffect(() => {
// //   checkForUpdates()
// // }, [])



// // ReactDOM.createRoot(document.getElementById('root')!).render(
// //   <React.StrictMode>
// //     <MantineProvider theme={theme} defaultColorScheme='light'>
    
// //       <Notifications
// //         position='top-right'
// //         autoClose={2500}
// //         limit={4}
// //         // notificationProps={{ radius: 'md', withBorder: true }}
// //       />
// //       <QueryClientProvider client={queryClient}>
// //         <RouterProvider router={router} />
// //       </QueryClientProvider>
// //     </MantineProvider>
// //   </React.StrictMode>
// // )
































// import React, { useEffect } from 'react'
// import ReactDOM from 'react-dom/client'
// import { MantineProvider } from '@mantine/core'
// import '@mantine/dates/styles.css'
// import '@mantine/notifications/styles.css'
// import { Notifications } from '@mantine/notifications'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { RouterProvider } from 'react-router-dom'
// import router from './routes'
// import { theme } from './theme'
// import './index.css'

// import { checkForUpdates } from './utils/updater'

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       refetchOnWindowFocus: false
//     }
//   }
// })

// function App() {
//   useEffect(() => {
//     checkForUpdates()
//   }, [])

//   return (
//     <React.StrictMode>
//       <MantineProvider theme={theme} defaultColorScheme='light'>
//         <Notifications
//           position='top-right'
//           autoClose={2500}
//           limit={4}
//         />

//         <QueryClientProvider client={queryClient}>
//           <RouterProvider router={router} />
//         </QueryClientProvider>
//       </MantineProvider>
//     </React.StrictMode>
//   )
// }

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <App />
// )











import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { MantineProvider } from '@mantine/core'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

import { Notifications } from '@mantine/notifications'

import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'

import { RouterProvider } from 'react-router-dom'

import router from './routes'
import { theme } from './theme'
import './index.css'

import {
  checkForUpdates,
  type UpdateProgress
} from './utils/updater'

import UpdateModal from './components/UpdateModal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

function App() {
  const [updateProgress, setUpdateProgress] =
    useState<UpdateProgress>({
      state: 'idle',
      downloaded: 0,
      total: 0,
      percentage: 0
    })

  useEffect(() => {
    checkForUpdates(setUpdateProgress)
  }, [])

  return (
    <React.StrictMode>
      <MantineProvider
        theme={theme}
        defaultColorScheme='light'
      >
        <Notifications
          position='top-right'
          autoClose={2500}
          limit={4}
        />

        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>

        <UpdateModal
          progress={updateProgress}
        />
      </MantineProvider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <App />
)