import { FinancialReport } from "@/types";
import apiClient from './index';

export const getFinancialReport = async (period: 'monthly' | 'yearly'): Promise<FinancialReport> => {
    const response = await apiClient.get<FinancialReport>('/admin/financials/report', {
        params: { period }
    });
    return response.data;
};