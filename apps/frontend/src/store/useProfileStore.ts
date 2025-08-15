import { create } from 'zustand'
import { getMe, updateUserProfile, uploadVerificationDocument } from '@/api/authApi'
import { User, UpdateUserPayload } from '@/types'

interface ProfileState {
  profile: User | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (data: UpdateUserPayload) => Promise<void>
  uploadDocument: (file: File) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  status: 'idle',
  error: null,
  
  fetchProfile: async () => {
    set({ status: 'loading', error: null })
    try {
      const userProfile = await getMe()
      set({ profile: userProfile, status: 'success' })
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch profile.'
      set({ status: 'error', error: errorMessage })
    }
  },

  updateProfile: async (data: UpdateUserPayload) => {
    set({ status: 'loading', error: null });
    try {
      const updatedProfile = await updateUserProfile(data);
      set({ profile: updatedProfile, status: 'success' });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update profile.';
      set({ status: 'error', error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  uploadDocument: async (file: File) => {
    set({ status: 'loading', error: null });
    try {
      await uploadVerificationDocument(file);
      // After a successful upload, refetch the profile to get the updated status
      await get().fetchProfile(); 
      set({ status: 'success' });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to upload document.';
      set({ status: 'error', error: errorMessage });
      throw new Error(errorMessage);
    }
  }
}));