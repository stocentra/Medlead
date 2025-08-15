// In: apps/admin-panel/src/types/index.ts

import { GridColDef, GridValidRowModel } from '@mui/x-data-grid'; // <-- MODIFIED: Imported GridValidRowModel

export interface User {
  id: string;
  email: string;
  full_name: string;
  country: string;
  system_role: 'user' | 'researcher' | 'verifier' | 'admin';
  professional_level: string;
  verification_status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  subscription_plan?: 'free' | 'plus' | 'pro';
  subscription_expires_at?: string;
  gender?: string;
  phone_number?: string;
  national_id?: string;
  university?: string;
  student_id?: string;
  medical_license_number?: string;
  specialty_id?: number;
  city?: string;
  verification_document_url?: string;
  account_status: 'active' | 'suspended';
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  assigned_to_user_id: string | null;
  status: 'active' | 'expired' | 'fully_used';
  plan_id?: number | null; 
}

export type DiscountCodeSubmitData = Omit<DiscountCode, 'id' | 'current_uses' | 'status'>;

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  sent_by: string;
}

export type NotificationSubmitData = Omit<Notification, 'id' | 'created_at' | 'sent_by'>;

export interface AnalyticsStats {
  // User Stats
  totalUsers: number;
  plusMembers: number;
  proMembers: number;
  freeMembers: number;
  // Engagement Stats
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  // AI & Data Flywheel Stats
  trainingDataCollected: number;
  googleSearchToolUsage: number;
  // Demographics
  userByProfessionalLevel: Record<string, number>;
  // User Behavior Analysis
  activationRate: number; // Percentage of users who started a chat
  featureAdoption_Fileupload: number; // Percentage of chats with uploads
  averageConversationLength: number; // Average messages per chat
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'Hosting' | 'API Costs' | 'Marketing' | 'Salaries' | 'Other';
  expense_date: string;
}

export type ExpenseSubmitData = Omit<Expense, 'id'>;

export interface FinancialReport {
  timePeriod: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // as a percentage
  revenueByPlan: {
    pro: number;
    plus: number;
  };
  projectedMonthlyRevenue: number;
  projectedAnnualRevenue: number;
  revenueTrend: { month: string, revenue: number }[];
  expenseTrend: { month: string, expenses: number }[];
}

export interface TimeSeriesDataPoint {
  time: string;
  usage: number;
}

export interface SystemHealthStats {
  cpuUsage: TimeSeriesDataPoint[];
  ramUsage: TimeSeriesDataPoint[];
  gpuUsage: TimeSeriesDataPoint[];
  currentCpu: number;
  currentRam: number;
  currentGpu: number;
}

export interface ServiceStatus {
  name: string;
  status: 'Operational' | 'Degraded Performance' | 'Outage';
  description: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string; // e.g., "USER_VERIFIED", "NOTIFICATION_SENT"
  details: string; // e.g., "Approved documents for user John Smith (user_id: 123)"
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  activeSubscriptions: number;
  suspendedUsers: number;
  recentUsers: User[]; // The API will return the 5 most recent users
}

// A generic type for our DataGrid columns to avoid repetition
export type AppDataGridColumns<T extends GridValidRowModel> = GridColDef<T>[]; // <-- MODIFIED: Added constraint

// Add a type for subscription plans to be fetched from the API
export interface SubscriptionPlan {
  id: number;
  name: string;
  price_monthly: number;
  is_active: boolean;
}