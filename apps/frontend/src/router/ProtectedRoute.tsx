import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

const ProtectedRoute = () => {
  const { token, user } = useAuthStore((state) => ({ token: state.token, user: state.user }));
  const location = useLocation();

  // 1. If no token exists, the user is not authenticated. Redirect to the auth page.
  if (!token) {
    return <Navigate to="/auth" replace />
  }

  // 2. If user data is present, check their verification status.
  if (user) {
    // If the user's status is not 'verified' and they are not already on the
    // verification page, redirect them there.
    if (user.verification_status !== 'verified' && location.pathname !== '/pending-verification') {
        return <Navigate to="/pending-verification" replace />;
    }
  }
  
  // In all other cases (e.g., user is verified, or user is on the pending page),
  // render the requested route.
  return <Outlet />;
}

export default ProtectedRoute