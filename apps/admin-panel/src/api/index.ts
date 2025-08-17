// admin-panel/src/api/index.ts

import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.medlead.ir/v1' ;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling 401 errors
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      // For now, if token is invalid, log the user out.
      // A full token refresh logic can be implemented here in the future.
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient