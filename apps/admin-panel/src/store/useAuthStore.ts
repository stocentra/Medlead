import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginAdmin, AdminLoginRequest, AdminAuthResponse } from '@/api/authApi';

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    system_role: 'admin' | 'verifier';
}

interface AuthState {
    user: AdminUser | null;
    token: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string | null;
    login: (credentials: AdminLoginRequest) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            status: 'idle',
            message: null,
            login: async (credentials: AdminLoginRequest) => {
                set({ status: 'loading', message: null });
                try {
                    const response: AdminAuthResponse = await loginAdmin(credentials);
                    set({
                        status: 'success',
                        user: response.user,
                        token: response.access_token,
                    });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Login failed. Please check credentials.';
                    set({ status: 'error', message: errorMessage, user: null, token: null });
                    throw new Error(errorMessage);
                }
            },
            logout: () => {
                set({ user: null, token: null, status: 'idle', message: null });
            },
        }),
        {
            name: 'medlead-admin-auth',
        }
    )
);