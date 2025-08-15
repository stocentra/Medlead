import { create } from 'zustand'
import { changePassword } from '@/api/authApi'
import { ChangePasswordPayload } from '@/types'

interface SettingsState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
  changeUserPassword: (data: ChangePasswordPayload) => Promise<void>
  resetStatus: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  status: 'idle',
  message: null,
  
  changeUserPassword: async (data) => {
    set({ status: 'loading', message: null });
    try {
      await changePassword(data);
      set({ status: 'success', message: 'Password updated successfully!' });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update password.';
      set({ status: 'error', message: errorMessage });
      throw new Error(errorMessage);
    }
  },

  resetStatus: () => {
    set({ status: 'idle', message: null });
  }
}));