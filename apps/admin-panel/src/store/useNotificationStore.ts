import { create } from 'zustand';
import { Notification, NotificationSubmitData } from '@/types';
import { getAllNotifications, createNotification } from '@/api/notificationsApi';

interface NotificationState {
    notifications: Notification[];
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    fetchNotifications: () => Promise<void>;
    // THE FIX: The signature now correctly expects only one argument.
    sendNotification: (data: NotificationSubmitData) => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    status: 'idle',
    error: null,

    fetchNotifications: async () => {
        set({ status: 'loading' });
        try {
            const data = await getAllNotifications();
            set({ status: 'success', notifications: data });
        } catch (e: any) {
            set({ status: 'error', error: 'Failed to fetch notifications' });
        }
    },

    sendNotification: async (data: NotificationSubmitData) => {
        try {
            const newNotification = await createNotification(data);
            set(state => ({
                notifications: [newNotification, ...state.notifications]
            }));
            return true;
        } catch (e: any) {
            console.error('Failed to send notification:', e);
            return false;
        }
    },
}));