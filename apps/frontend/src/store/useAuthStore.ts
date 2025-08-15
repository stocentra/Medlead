import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginRequest, RegisterRequest } from '@/types'
import { loginUser, registerUser, refreshAccessToken } from '@/api/authApi'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null // To be used when refresh logic is fully implemented
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearStatus: () => void
  refreshAuthToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      status: 'idle',
      message: null,

      login: async (credentials) => {
        set({ status: 'loading', message: null })
        try {
          const data = await loginUser(credentials)
          set({
            status: 'success',
            user: data.user,
            token: data.access_token,
            // When backend provides it, we will store the refresh token here:
            // refreshToken: data.refresh_token, 
          })
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Login failed. Please try again.'
          set({ status: 'error', message: errorMessage, user: null, token: null })
          throw new Error(errorMessage)
        }
      },

      register: async (data: RegisterRequest) => {
        set({ status: 'loading', message: null })
        try {
          const registeredUser = await registerUser(data)
          const successMessage = `Registration successful for ${registeredUser.email}. Please check your inbox to verify your email address.`
          set({ status: 'success', message: successMessage })
        } catch (error: any) {
          const errorMessage =
            error.response?.data ||
            'Registration failed. Please try again.'
          set({ status: 'error', message: errorMessage })
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        // Clear all session-related data
        set({ user: null, token: null, refreshToken: null, status: 'idle', message: null })
      },

      clearStatus: () => {
        set({ status: 'idle', message: null })
      },
      
      refreshAuthToken: async () => {
        try {
          console.log("Attempting to refresh token...");
          const { access_token } = await refreshAccessToken();
          set({ token: access_token });
          console.log("Token refreshed successfully!");
        } catch (error) {
          console.error("Failed to refresh token, logging out.", error);
          // If the refresh attempt fails, log the user out completely.
          set({ user: null, token: null, refreshToken: null });
        }
      }
    }),
    {
      name: 'medlead-auth',
    },
  ),
)