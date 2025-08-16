// frontend/src/types/index.ts

export interface User {
  id: string
  email: string
  full_name: string
  country: string
  professional_level: string
  verification_status: 'not_submitted' | 'pending' | 'verified' | 'rejected'
  phone_number?: string
  university?: string
  student_id?: string
  medical_license_number?: string
  specialty_id?: number
  national_id?: string
  gender?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  country: string
  professional_level: string
}

// +++ Added for document upload during registration
export interface RegisterRequestWithDocument extends RegisterRequest {
  document?: File;
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  query: string
  history: ChatMessage[]
}

export interface ChatResponse {
  response: string
}

export interface UpdateUserPayload {
    full_name?: string;
    phone_number?: string;
    national_id?: string;
    university?: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
}

export interface Notification {
    id: number;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface VerifyDiscountRequest {
    code: string;
}

export interface VerifyDiscountResponse {
    valid: boolean;
    discount_percentage?: number;
    plan_name?: string;
}