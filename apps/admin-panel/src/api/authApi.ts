import apiClient from './index'; 
import { AdminUser } from '@/store/useAuthStore';

export interface AdminLoginRequest {
    email: string;
    password: string;
}

export interface AdminAuthResponse {
    access_token: string;
    user: AdminUser;
}

export const loginAdmin = async (credentials: AdminLoginRequest): Promise<AdminAuthResponse> => {
    const response = await apiClient.post<AdminAuthResponse>('/admin/auth/login', credentials);
    return response.data;
};