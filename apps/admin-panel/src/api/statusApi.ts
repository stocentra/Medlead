import { ServiceStatus } from "@/types";
import apiClient from './index';

export const getServiceStatus = async (): Promise<ServiceStatus[]> => {
    const response = await apiClient.get<ServiceStatus[]>('/admin/system-health/status');
    return response.data;
};