import { AuditLog } from "@/types";
import apiClient from './index';

export const getAuditLogs = async (): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>('/admin/audit-logs');
    return response.data;
};