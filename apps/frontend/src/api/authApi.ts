import apiClient from './index'
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  UpdateUserPayload, 
  ChangePasswordPayload, 
  Notification,
  VerifyDiscountRequest,
  VerifyDiscountResponse
} from '@/types'

/**
 * Sends a login request to the server.
 * @param credentials - The user's email and password.
 * @returns A promise that resolves to the authentication response, including token and user data.
 */
export const loginUser = async (
  credentials: LoginRequest,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    '/auth/login',
    credentials,
  )
  return response.data
}

/**
 * Sends a registration request to the server.
 * @param data - The new user's registration details.
 * @returns A promise that resolves to the newly created user's profile.
 */
export const registerUser = async (data: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data)
  return response.data
}

/**
 * Fetches the full profile of the currently authenticated user.
 * @returns A promise that resolves to the user's full profile data.
 */
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me')
  return response.data
}

/**
 * Sends an email verification token to the server.
 * @param token - The verification token from the email link.
 * @returns A promise that resolves to the success message from the server.
 */
export const verifyEmail = async (token: string): Promise<string> => {
  const response = await apiClient.get<string>(`/auth/verify-email?token=${token}`, {
    // Prevent axios from trying to parse the plain text response as JSON
    transformResponse: [(data) => data],
  });
  return response.data;
};

/**
 * Sends a request to update the user's profile.
 * @param payload - An object containing the fields to be updated.
 * @returns A promise that resolves to the updated user profile.
 */
export const updateUserProfile = async (payload: UpdateUserPayload): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me', payload);
  return response.data;
};

/**
 * Sends a request to change the user's password.
 * @param payload - An object containing the current and new passwords.
 * @returns A promise that resolves when the password has been changed.
 */
export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.post('/users/change-password', payload);
};

/**
 * Uploads a verification document for the user.
 * @param file - The file to be uploaded.
 * @returns A promise that resolves when the upload is complete.
 */
export const uploadVerificationDocument = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('document', file);

  await apiClient.post('/users/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Verifies a discount code with the server.
 * @param payload - An object containing the discount code.
 * @returns A promise that resolves to the verification response.
 */
export const verifyDiscountCode = async (payload: VerifyDiscountRequest): Promise<VerifyDiscountResponse> => {
  // IMPORTANT: The backend endpoint '/v1/discounts/verify' is a placeholder.
  console.log("Verifying discount code:", payload.code);
  const response = await apiClient.post<VerifyDiscountResponse>('/discounts/verify', payload);
  return response.data;
};

/**
 * Fetches all notifications for the currently authenticated user.
 * @returns A promise that resolves to an array of notifications.
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>('/users/notifications');
  return response.data;
};

/**
 * Marks a specific notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 * @returns A promise that resolves when the operation is complete.
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  // IMPORTANT: The backend endpoint '/v1/users/notifications/{id}/read' is a placeholder.
  await apiClient.post(`/users/notifications/${notificationId}/read`);
};

// --- Token Refresh ---

interface RefreshResponse {
  access_token: string;
}

/**
 * Refreshes the access token using the refresh token.
 * @returns A promise that resolves to the new access token.
 */
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const response = await apiClient.post<RefreshResponse>('/auth/refresh', {});
  return response.data;
};