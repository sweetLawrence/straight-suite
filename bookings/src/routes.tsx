import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import AuthenticatedLayout from './layout/AuthenticatedLayout'
import { protectedLoader } from './lib/protectedLoader'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BookingsPage from './pages/BookingsPage'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import RoomTypesPage from './pages/RoomTypesPage'
import PricingPage from './pages/PricingPage'
import RoomsPage from './pages/RoomsPage'
import ContentPage from './pages/ContentPage'
import StaffPage from './pages/StaffPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import SetPasswordPage from './pages/SetPasswordPage'
import InHouseGuestsPage from './pages/InHouseGuestsPage'
import MenuPage from './pages/MenuPage'
import PaymentsPage from './pages/PaymentsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to='/dashboard' replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'set-password', element: <SetPasswordPage /> },
      {
        element: <AuthenticatedLayout />,
        loader: protectedLoader,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
            errorElement: <RouteErrorBoundary />
          },

          {
            path: 'bookings',
            element: <BookingsPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'in-house',
            element: <InHouseGuestsPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'room-types',
            element: <RoomTypesPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'pricing',
            element: <PricingPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'rooms',
            element: <RoomsPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'content',
            element: <ContentPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'staff',
            element: <StaffPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'reports',
            element: <ReportsPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'settings',
            element: <SettingsPage />,
            errorElement: <RouteErrorBoundary />
          },
          {
            path: 'menu',
            element: <MenuPage />,
            errorElement: <RouteErrorBoundary />
          },
          { path: 'payments', element: <PaymentsPage />, errorElement: <RouteErrorBoundary /> }
        ]
      }
    ]
  }
], {
  // '/bookings' inside Straight Suite, empty at the site root
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
})

export default router
