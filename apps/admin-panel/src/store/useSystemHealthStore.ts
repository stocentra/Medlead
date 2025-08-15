import { create } from 'zustand';
import { SystemHealthStats } from '@/types';
// UPDATED: Import the real API function
import { getSystemHealth } from '@/api/systemHealthApi';

interface SystemHealthState {
    stats: SystemHealthStats | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchSystemHealth: () => Promise<void>;
}

export const useSystemHealthStore = create<SystemHealthState>((set) => ({
    stats: null,
    status: 'idle',
    error: null,

    fetchSystemHealth: async () => {
        // Set loading only if there's no data yet, for a smoother refresh
        set(state => ({ ...state, status: state.stats ? 'success' : 'loading' }));
        try {
            // UPDATED: Call the real API
            const data = await getSystemHealth();
            set({ status: 'success', stats: data });
        } catch (e: any) {
            set({ status: 'error', error: 'Failed to fetch system health' });
        }
    },
}));