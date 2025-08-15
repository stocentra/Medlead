import { SystemHealthStats } from "@/types";
import apiClient from './index';

export const getSystemHealth = async (): Promise<SystemHealthStats> => {
    const response = await apiClient.get<SystemHealthStats>('/admin/system-health');
    return response.data;
};