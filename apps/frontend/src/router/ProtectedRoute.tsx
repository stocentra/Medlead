import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

const ProtectedRoute = () => {
  const { token, user } = useAuthStore((state) => ({ token: state.token, user: state.user }));
  const location = useLocation();

  // 1. If there's no token, redirect to the auth page.
  if (!token) {
    return <Navigate to="/auth" replace />
  }

  // 2. If there is a token and user data, check their verification status.
  if (user) {
    // If the user is verified, grant access to the requested page.
    if (user.verification_status === 'verified') {
        return <Outlet />;
    }
    // If the user is NOT verified, and they are not already on the pending page,
    // redirect them to the pending page.
    if (user.verification_status !== 'verified' && location.pathname !== '/pending-verification') {
        return <Navigate to="/pending-verification" replace />;
    }
  }
  
  // Render the child component (e.g., the pending page itself) if none of the above conditions are met.
  return <Outlet />;
}

export default ProtectedRoute