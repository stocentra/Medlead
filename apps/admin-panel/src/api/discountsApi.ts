// In: apps/admin-panel/src/api/discountsApi.ts

import apiClient from './index';
import { DiscountCode, DiscountCodeSubmitData } from '../types';

/**
 * Fetches all discount codes from the API.
 * @returns {Promise<DiscountCode[]>} A promise that resolves to an array of discount codes.
 */
export const getDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await apiClient.get<DiscountCode[]>('/admin/discounts');
  return response.data;
};

/**
 * Creates a new discount code.
 * @param {DiscountCodeSubmitData} discountData The data for the new discount code.
 * @returns {Promise<DiscountCode>} A promise that resolves to the newly created discount code.
 */
export const createDiscountCode = async (discountData: DiscountCodeSubmitData): Promise<DiscountCode> => {
  // The backend now expects plan_id, so we ensure it's part of the payload
  const response = await apiClient.post<DiscountCode>('/admin/discounts', discountData);
  return response.data;
};

/**
 * Updates an existing discount code.
 * @param {string} id The ID of the discount code to update.
 * @param {Partial<DiscountCodeSubmitData>} discountData The fields to update.
 * @returns {Promise<DiscountCode>} A promise that resolves to the updated discount code.
 */
export const updateDiscountCode = async (id: string, discountData: Partial<DiscountCodeSubmitData>): Promise<DiscountCode> => {
  // The backend now expects plan_id, so we ensure it can be part of the payload
  const response = await apiClient.patch<DiscountCode>(`/admin/discounts/${id}`, discountData);
  return response.data;
};

/**
 * Deletes a discount code.
 * @param {string} id The ID of the discount code to delete.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export const deleteDiscountCode = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/discounts/${id}`);
};