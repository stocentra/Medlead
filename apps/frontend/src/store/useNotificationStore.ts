import { create } from 'zustand';
import { getNotifications, markNotificationAsRead } from '@/api/authApi';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'success' | 'error'; // Corrected: 'success' is now included
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  status: 'idle',

  fetchNotifications: async () => {
    set({ status: 'loading' });
    try {
      const notifications = await getNotifications();
      const unread = notifications.filter(n => !n.is_read).length;
      set({ notifications, unreadCount: unread, status: 'success' });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ status: 'error' });
    }
  },

  markAsRead: async (id: number) => {
    const originalNotifications = get().notifications;
    // Optimistically update the UI
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert UI on failure
      set({ notifications: originalNotifications, unreadCount: get().notifications.filter(n => !n.is_read).length });
    }
  },
}));