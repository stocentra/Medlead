import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './router/ProtectedRoute';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import DiscountCodesPage from './pages/discounts/DiscountCodesPage';
import NotificationsPage from './pages/NotificationsPage';
import VerificationPage from './pages/VerificationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FinancialPage from './pages/FinancialPage';
import SystemHealthPage from './pages/SystemHealthPage';
import AuditLogPage from './pages/AuditLogPage'; // New Import

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <AdminLayout />
            </ProtectedRoute>
        ),
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'analytics', element: <AnalyticsPage /> },
            { path: 'financials', element: <FinancialPage /> },
            { path: 'system-health', element: <SystemHealthPage /> },
            { path: 'verification', element: <VerificationPage /> },
            { path: 'users', element: <UsersListPage /> },
            { path: 'users/:id', element: <UserDetailPage /> },
            { path: 'discounts', element: <DiscountCodesPage /> },
            { path: 'notifications', element: <NotificationsPage /> },
            { path: 'audit-log', element: <AuditLogPage /> }, // New Route
        ]
    },
    {
        path: '*',
        element: <NotFoundPage />,
    }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;