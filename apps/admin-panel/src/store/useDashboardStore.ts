import { create } from 'zustand';
import { User, DashboardStats } from '@/types';
// UPDATED: Import real API function
import { getDashboardStats } from '@/api/usersApi';

interface DashboardState {
    stats: Omit<DashboardStats, 'recentUsers'>; // Stats without the user list
    recentUsers: User[];
    status: 'idle' | 'loading' | 'success' | 'error';
    fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    stats: {
        totalUsers: 0,
        pendingVerifications: 0,
        activeSubscriptions: 0,
        suspendedUsers: 0,
    },
    recentUsers: [],
    status: 'idle',

    fetchDashboardData: async () => {
        set({ status: 'loading' });
        try {
            // UPDATED: Call the new real API endpoint
            const data = await getDashboardStats();
            const { recentUsers, ...stats } = data;
            set({ stats, recentUsers, status: 'success' });
        } catch (error) {
            set({ status: 'error' });
        }
    },
}));