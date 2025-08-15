import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import React from 'react';

// Define props for the component to accept children
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const token = useAuthStore(state => state.token);
    const location = useLocation();

    // If there's no token, redirect to the login page
    // It saves the location the user was trying to access
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If a token exists, render the children passed to the component
    return <>{children}</>;
};

export default ProtectedRoute;