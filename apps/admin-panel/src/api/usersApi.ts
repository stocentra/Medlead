import { User, AnalyticsStats, DashboardStats } from '@/types';
import apiClient from './index';

export const getAllUsers = async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/admin/users');
    return response.data;
};

export const getSingleUser = async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
};

export const updateUserStatus = async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>(`/admin/users/${id}`, updates);
    return response.data;
};

export const getPendingVerificationUsers = async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/admin/users/pending-verification');
    return response.data;
};

export const getAnalyticsStats = async (): Promise<AnalyticsStats> => {
    const response = await apiClient.get<AnalyticsStats>('/admin/analytics');
    return response.data;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
};