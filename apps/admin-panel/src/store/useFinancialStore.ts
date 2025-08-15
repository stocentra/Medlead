import { create } from 'zustand';
import { FinancialReport, Expense, ExpenseSubmitData } from '@/types';
// UPDATED: Import real API functions
import { getFinancialReport } from '@/api/financialsApi';
import { getExpenses, createExpense } from '@/api/expensesApi';

interface FinancialState {
    report: FinancialReport | null;
    expenses: Expense[];
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchFinancialData: (period: 'monthly' | 'yearly') => Promise<void>;
    addExpense: (data: ExpenseSubmitData) => Promise<void>;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
    report: null,
    expenses: [],
    status: 'idle',
    error: null,

    fetchFinancialData: async (period: 'monthly' | 'yearly') => {
        set({ status: 'loading' });
        try {
            // UPDATED: Call real APIs
            const [reportData, expensesData] = await Promise.all([
                getFinancialReport(period),
                getExpenses()
            ]);
            set({ status: 'success', report: reportData, expenses: expensesData });
        } catch (e: any) {
            set({ status: 'error', error: 'Failed to fetch financial data' });
        }
    },

    addExpense: async (data: ExpenseSubmitData) => {
        try {
            // UPDATED: Call real API
            await createExpense(data);
            const currentPeriod = get().report?.timePeriod || 'monthly';
            await get().fetchFinancialData(currentPeriod);
        } catch(e) {
            console.error("Failed to add expense", e);
        }
    }
}));