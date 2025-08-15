// In: apps/admin-panel/src/api/plansApi.ts

import apiClient from './index';
import { SubscriptionPlan } from '../types';

/**
 * Fetches all available subscription plans from the API.
 * This is used to populate the dropdown in the discount code form.
 * @returns {Promise<SubscriptionPlan[]>} A promise that resolves to an array of subscription plans.
 * @throws Will throw an error if the API call fails.
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await apiClient.get<SubscriptionPlan[]>('/admin/plans');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    // Re-throw the error to allow higher-level components (like React Query or a try/catch block in the component) to handle it.
    // This allows showing a proper error message to the user instead of silently failing.
    throw error;
  }
};