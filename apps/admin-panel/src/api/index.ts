import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const getApiBaseUrl = () => {
    // Vite provides these environment variables automatically.
    // import.meta.env.PROD is true when running the 'build' command.
    if (import.meta.env.PROD) {
        const prodUrl = import.meta.env.VITE_API_BASE_URL;
        if (!prodUrl) {
            console.error("FATAL ERROR: VITE_API_BASE_URL is not defined in the production environment.");
        }
        return prodUrl;
    }
    // In development, you can set a default for convenience.
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/v1';
};

const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to automatically add the authentication token to every request.
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;