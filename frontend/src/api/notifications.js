import { api } from './client';

const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : '';
};

export const listNotifications = ({ page = 1, perPage = 20, unreadOnly = false } = {}) =>
  api(`/notifications${query({ page, per_page: perPage, unread: unreadOnly || undefined })}`);

export const getUnreadNotificationCount = () => api('/notifications/unread-count');

export const markNotificationRead = (notificationId) =>
  api(`/notifications/${notificationId}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () => api('/notifications/read-all', { method: 'PATCH' });

export const getNotificationPreferences = () => api('/notification-preferences');

export const updateNotificationPreferences = (values) =>
  api('/notification-preferences', { method: 'PATCH', body: values });
