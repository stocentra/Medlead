import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import ChatPage from '@/pages/ChatPage'
import AuthPage from '@/pages/AuthPage'
import ProtectedRoute from './ProtectedRoute'
import ProfilePage from '@/pages/ProfilePage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import ErrorPage from '@/pages/ErrorPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import SettingsPage from '@/pages/SettingsPage'
import PendingVerificationPage from '@/pages/PendingVerificationPage' // 1. Import the new page

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />, 
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <ChatPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/subscription', element: <SubscriptionPage /> },
        ],
      },
      // 2. Add the new protected route for the pending page
      {
        path: '/pending-verification',
        element: <PendingVerificationPage />,
      }
    ],
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '*',
    element: <ErrorPage statusCode={404} />,
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter