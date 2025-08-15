import { create } from 'zustand'
import { verifyDiscountCode } from '@/api/authApi'

interface SubscriptionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string | null
  appliedCode: string | null
  discountPercentage: number
  applyDiscountCode: (code: string) => Promise<void>
  removeDiscountCode: () => void
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: 'idle',
  message: null,
  appliedCode: null,
  discountPercentage: 0,

  applyDiscountCode: async (code: string) => {
    set({ status: 'loading', message: null });
    try {
      const response = await verifyDiscountCode({ code });
      if (response.valid) {
        set({
          status: 'success',
          message: `Success! ${response.discount_percentage}% discount applied.`,
          appliedCode: code,
          discountPercentage: response.discount_percentage,
        });
      } else {
        throw new Error("Invalid or expired discount code.");
      }
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'Invalid discount code.';
      set({
        status: 'error',
        message: errorMessage,
        appliedCode: null,
        discountPercentage: 0,
      });
      throw new Error(errorMessage);
    }
  },

  removeDiscountCode: () => {
    set({
      status: 'idle',
      message: null,
      appliedCode: null,
      discountPercentage: 0,
    });
  },
}));