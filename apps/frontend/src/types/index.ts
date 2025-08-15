// Based on the 'Profile' struct in api-go/internal/models/profile.go
export interface User {
  id: string;
  email: string;
  full_name: string;
  country: string;
  system_role: string;
  professional_level: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  // Optional fields that come from the full profile fetch
  national_id?: string;
  gender?: string;
  phone_number?: string;
  university?: string;
  student_id?: string;
  medical_license_number?: string;
  specialty_id?: number;
}

// Based on LoginResponse struct in api-go/internal/auth/handlers.go
export interface AuthResponse {
  access_token: string;
  user: User;
}

// Based on LoginRequest struct in api-go/internal/auth/handlers.go
export interface LoginRequest {
  email: string;
  password: string;
}

// Based on RegisterRequest struct in api-go/internal/auth/handlers.go
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  country: string;
  professional_level: string;
}

// Based on the specialties.json file
export interface Specialty {
  id: number;
  name: string;
  created_at: string;
}

// Type for the profile update payload.
export interface UpdateUserPayload {
  full_name?: string;
  national_id?: string;
  gender?: string;
  country?: string;
  phone_number?: string;
  university?: string;
  student_id?: string;
  medical_license_number?: string;
  specialty_id?: number;
  city?: string;
}

// Type for the change password payload
export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// Type for the discount code verification request
export interface VerifyDiscountRequest {
  code: string;
}

// Type for the discount code verification response
export interface VerifyDiscountResponse {
  valid: boolean;
  discount_percentage: number;
}

// Type for a single notification object
export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}