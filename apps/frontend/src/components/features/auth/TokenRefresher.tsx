import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { jwtDecode } from 'jwt-decode';

const TokenRefresher = () => {
    const { token, refreshAuthToken } = useAuthStore();

    useEffect(() => {
        if (!token) {
            return;
        }

        const decodedToken = jwtDecode(token);
        const expiresAt = (decodedToken.exp || 0) * 1000; // Expiration time in milliseconds
        const now = Date.now();
        
        // Refresh 5 minutes before the token expires
        const refreshTime = expiresAt - now - (5 * 60 * 1000); 

        if (refreshTime > 0) {
            const timerId = setTimeout(() => {
                refreshAuthToken();
            }, refreshTime);

            // Cleanup function to clear the timer if the component unmounts
            // or if the token changes for any reason.
            return () => clearTimeout(timerId);
        }

    }, [token, refreshAuthToken]);

    // This component does not render anything to the UI
    return null;
};

export default TokenRefresher;