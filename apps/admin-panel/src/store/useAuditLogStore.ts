import { create } from 'zustand';
import { AuditLog } from '@/types';
import { getAuditLogs } from '@/api/auditLogApi'; // UPDATED

interface AuditLogState {
    logs: AuditLog[];
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchLogs: () => Promise<void>;
}

export const useAuditLogStore = create<AuditLogState>((set) => ({
    logs: [],
    status: 'idle',
    error: null,

    fetchLogs: async () => {
        set({ status: 'loading' });
        try {
            const data = await getAuditLogs(); // UPDATED
            set({ status: 'success', logs: data });
        } catch (e: any) {
            set({ status: 'error', error: 'Failed to fetch audit logs' });
        }
    },
}));