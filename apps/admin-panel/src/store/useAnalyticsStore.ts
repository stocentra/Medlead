import { create } from 'zustand';
import { AnalyticsStats } from '@/types';
import { getAnalyticsStats } from '@/api/usersApi';

interface AnalyticsState {
    stats: AnalyticsStats | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchStats: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    stats: null,
    status: 'idle',
    error: null,

    fetchStats: async () => {
        set({ status: 'loading' });
        try {
            const data = await getAnalyticsStats();
            set({ status: 'success', stats: data });
        } catch (e: any) {
            set({ status: 'error', error: 'Failed to fetch analytics stats' });
        }
    },
}));