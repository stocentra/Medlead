import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getNotifications, markNotificationAsRead } from '@/api/authApi'
// --- FIX STARTS HERE ---
// Import the corrected Notification type from the central types file.
import { Notification } from '@/types'
// --- FIX ENDS HERE ---

// The old, incorrect local interface for Notification has been removed.

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, _get) => ({
      notifications: [],
      unreadCount: 0,

      fetchNotifications: async () => {
        try {
          const notifications = await getNotifications()
          const unreadCount = notifications.filter((n) => !n.is_read).length
          set({ notifications, unreadCount })
        } catch (error) {
          console.error('Failed to fetch notifications:', error)
        }
      },

      markAsRead: async (id: number) => {
        // Optimistically update the UI
        set((state) => {
          const alreadyRead = state.notifications.find(n => n.id === id)?.is_read;
          if (alreadyRead) return state; // No change if already read

          return {
            notifications: state.notifications.map((notif) =>
              notif.id === id ? { ...notif, is_read: true } : notif
            ),
            unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
          }
        })
        // Then, send the request to the backend
        try {
          await markNotificationAsRead(id)
        } catch (error) {
          console.error(`Failed to mark notification ${id} as read:`, error)
          // Optional: Revert state change on API failure if needed
        }
      },

      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      },
    }),
    {
      name: 'notification-storage',
    }
  )
)