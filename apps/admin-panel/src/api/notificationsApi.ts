import { Notification, NotificationSubmitData } from '@/types';
import apiClient from './index';

export const getAllNotifications = async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/admin/notifications');
    return response.data;
};

export const createNotification = async (data: NotificationSubmitData): Promise<Notification> => {
    const response = await apiClient.post<Notification>('/admin/notifications', data);
    return response.data;
};