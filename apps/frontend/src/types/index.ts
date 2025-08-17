// frontend/src/types/index.ts

/**
 * Represents the authentication response from the server,
 * including the access token and the user's basic profile.
 */
export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

// --- FIX #1 STARTS HERE ---
// 'verified' is added to the union type to include all possible statuses
// from the backend. This will fix the error in ProtectedRoute.tsx.
export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'rejected'
  | 'verified'
// --- FIX #1 ENDS HERE ---

/**
 * Represents the full user profile object.
 */
export interface User {
  id: string
  full_name: string
  email: string
  verification_status: VerificationStatus
  country: string
  professional_level: string
  system_role: string
  created_at: string
  updated_at: string
  // Optional fields from the full profile which might not always be present
  national_id?: string
  gender?: string
  phone_number?: string
  university?: string
  student_id?: string
  medical_license_number?: string
  specialty_id?: number
  country_specific_details?: any
}

/**
 * Defines the structure for a login request.
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Defines the structure for a registration request when sending to the API.
 * Includes the document file.
 */
export interface RegisterRequestWithDocument {
  full_name: string
  email: string
  password: string
  country: string
  professional_level: string
  document?: File
}

/**
 * Defines the structure for updating a user's profile.
 * All fields are optional, as the user might only update one at a time.
 */
export interface UpdateUserPayload {
  full_name?: string
  national_id?: string
  phone_number?: string
}

/**
 * Defines the structure for the change password request.
 */
export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

// --- FIX #2 STARTS HERE ---
// The Notification interface is updated to match the backend data model.
// 'content' is replaced with 'title' and 'message'.
// This will fix the error in NotificationBell.tsx.
export interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}
// --- FIX #2 ENDS HERE ---

/**
 * Defines the structure for a message in the chat history.
 */
export interface HistoryMessage {
  role: 'user' | 'model'
  content: string
}

/**
 * Defines the structure for a chat request to the AI model.
 */
export interface ChatRequest {
  query: string
  history?: HistoryMessage[]
}

/**
 * Defines the structure for verifying a discount code.
 */
export interface VerifyDiscountRequest {
  code: string;
}

/**
 * Defines the structure for the response after verifying a discount code.
 */
export interface VerifyDiscountResponse {
  valid: boolean;
  discount_percentage: number;
}