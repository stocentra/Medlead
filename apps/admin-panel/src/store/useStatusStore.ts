import { create } from 'zustand';
import { ServiceStatus } from '@/types';
// UPDATED: Import real API function
import { getServiceStatus } from '@/api/statusApi';

interface StatusState {
    services: ServiceStatus[];
    status: 'idle' | 'loading' | 'success' | 'error';
    lastUpdated: Date | null;
    fetchStatuses: () => Promise<void>;
}

export const useStatusStore = create<StatusState>((set) => ({
    services: [],
    status: 'idle',
    lastUpdated: null,

    fetchStatuses: async () => {
        try {
            // UPDATED: Call real API
            const data = await getServiceStatus();
            set({ status: 'success', services: data, lastUpdated: new Date() });
        } catch (e) {
            console.error('Failed to fetch statuses', e);
            set({ status: 'error' });
        }
    },
}));