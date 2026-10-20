import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './styles/index.css';

import { queryClient } from '@/lib/query/client';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { useAuth } from '@/lib/auth/useAuth';
import { routeTree } from './routeTree.gen';
import { theme } from './theme';


import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { BASE } from '@/lib/utils/basePath';
dayjs.extend(isoWeek);

const router = createRouter({
  routeTree,
  basepath: BASE || '/',
  context: {
    auth: undefined!,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light"> 
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>
);