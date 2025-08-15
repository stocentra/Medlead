// In: apps/admin-panel/src/store/useDiscountStore.ts

import { create } from 'zustand';
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from '../api/discountsApi';
import { getSubscriptionPlans } from '../api/plansApi'; // <-- MODIFIED: Import plans API
import { DiscountCode, DiscountCodeSubmitData, SubscriptionPlan } from '../types';

interface DiscountState {
  discountCodes: DiscountCode[];
  plans: SubscriptionPlan[]; // <-- MODIFIED: Add state for plans
  isLoading: boolean;
  isLoadingPlans: boolean; // <-- MODIFIED: Add loading state for plans
  error: string | null;
  fetchDiscountCodes: () => Promise<void>;
  addDiscountCode: (data: DiscountCodeSubmitData) => Promise<void>;
  editDiscountCode: (id: string, data: Partial<DiscountCodeSubmitData>) => Promise<void>;
  removeDiscountCode: (id: string) => Promise<void>;
  fetchSubscriptionPlans: () => Promise<void>; // <-- MODIFIED: Add action for fetching plans
}

export const useDiscountStore = create<DiscountState>((set) => ({
  discountCodes: [],
  plans: [], // <-- MODIFIED: Initialize plans state
  isLoading: false,
  isLoadingPlans: false, // <-- MODIFIED: Initialize plans loading state
  error: null,

  fetchDiscountCodes: async () => {
    set({ isLoading: true, error: null });
    try {
      const codes = await getDiscountCodes();
      set({ discountCodes: codes, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch discount codes';
      set({ isLoading: false, error });
    }
  },

  addDiscountCode: async (data) => {
    try {
      const newCode = await createDiscountCode(data);
      set((state) => ({
        discountCodes: [...state.discountCodes, newCode],
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create discount code';
      set({ error });
      throw new Error(error); // Re-throw for the form to catch
    }
  },

  editDiscountCode: async (id, data) => {
    try {
      const updatedCode = await updateDiscountCode(id, data);
      set((state) => ({
        discountCodes: state.discountCodes.map((c) => (c.id === id ? updatedCode : c)),
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update discount code';
      set({ error });
      throw new Error(error); // Re-throw for the form to catch
    }
  },

  removeDiscountCode: async (id) => {
    try {
      await deleteDiscountCode(id);
      set((state) => ({
        discountCodes: state.discountCodes.filter((c) => c.id !== id),
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete discount code';
      set({ error });
    }
  },
  
  // <-- MODIFIED: Implement the new action
  fetchSubscriptionPlans: async () => {
    set({ isLoadingPlans: true });
    try {
      const plansData = await getSubscriptionPlans();
      set({ plans: plansData, isLoadingPlans: false });
    } catch (err) {
      // Error is already logged in the API layer, just update state here
      set({ isLoadingPlans: false });
    }
  },
}));