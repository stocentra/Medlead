import { Expense, ExpenseSubmitData } from "@/types";
import apiClient from './index';

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>('/admin/financials/expenses');
    return response.data;
};

export const createExpense = async (data: ExpenseSubmitData): Promise<Expense> => {
    const response = await apiClient.post<Expense>('/admin/financials/expenses', data);
    return response.data;
};