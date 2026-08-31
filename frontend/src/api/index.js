// Single entry point for data access.
//
// The application can use either the local mock backend or the real Flask API.
// The newer auth and parcel modules are re-exported here so consumers can use:
//
//   import * as authApi from '../api';
//   import * as parcelsApi from '../api';
//
// without importing implementation files directly.

import { USE_MOCK_BACKEND } from './viteEnv';
import * as mock from './mockBackend';

import * as authApi from './auth';
import * as parcelsApi from './parcels';

import { api } from './client';

export const usingMockBackend = USE_MOCK_BACKEND;

/*
 * Legacy/demo HTTP API.
 *
 * Keep these exports because existing screens in the project still use them.
 */
const http = {
  requestOtp: (payload) =>
    api('/auth/otp', { method: 'POST', body: payload }),

  verifyOtp: (payload) =>
    api('/auth/verify', { method: 'POST', body: payload }),

  getSession: () => api('/auth/session'),

  signOut: () =>
    api('/auth/session', { method: 'DELETE' }),

  createOrder: (draft) =>
    api('/orders', { method: 'POST', body: draft }),

  getOrder: (id) =>
    api(`/orders/${id}`),

  listOrders: (userId) =>
    api(`/orders${userId ? `?user=${encodeURIComponent(userId)}` : ''}`),

  listAllOrders: () =>
    api('/admin/orders'),

  updateOrderStatus: (id, status) =>
    api(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  updateCourierPosition: (id, position) =>
    api(`/orders/${id}/courier`, {
      method: 'PATCH',
      body: position,
    }),

  assignAgent: (id) =>
    api(`/orders/${id}/assign`, {
      method: 'POST',
    }),

  updatePresentLocation: (id, payload) =>
    api(`/orders/${id}/location`, {
      method: 'PATCH',
      body: payload,
    }),

  getFleet: () =>
    api('/transport/availability'),

  setFleetStatus: (mode, status) =>
    api('/admin/transport/availability', {
      method: 'PATCH',
      body: { mode, status },
    }),

  verifyWeight: (id, payload) =>
    api(`/admin/orders/${id}/weight`, {
      method: 'PATCH',
      body: payload,
    }),

  listUsers: () =>
    api('/admin/users'),

  setUserRole: (id, role) =>
    api(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),

  setUserSuspended: (id, suspended) =>
    api(`/admin/users/${id}/suspension`, {
      method: 'PATCH',
      body: { suspended },
    }),

  listCouriers: () =>
    api('/admin/couriers'),

  setCourierShift: (id, onShift) =>
    api(`/admin/couriers/${id}/shift`, {
      method: 'PATCH',
      body: { onShift },
    }),

  listAuditLog: () =>
    api('/admin/audit'),

  listNotifications: () =>
    api('/admin/notifications'),

  getSettings: () =>
    api('/settings'),

  updateSettings: (patch) =>
    api('/admin/settings', {
      method: 'PATCH',
      body: patch,
    }),

  resetDemoData: () => {
    throw new Error(
      'Demo data can only be reset against the local demo backend.',
    );
  },

  changeDestination: (id, payload) =>
    api(`/orders/${id}/destination`, {
      method: 'PATCH',
      body: payload,
    }),

  cancelOrder: (id) =>
    api(`/orders/${id}/cancel`, {
      method: 'POST',
    }),

  seedIfEmpty: () => {},

  subscribe: (listener) => {
    const timer = setInterval(listener, 5000);
    return () => clearInterval(timer);
  },
};

const impl = USE_MOCK_BACKEND ? mock : http;

/*
 * Legacy/demo API exports.
 */
export const requestOtp = (...args) => impl.requestOtp(...args);
export const verifyOtp = (...args) => impl.verifyOtp(...args);
export const getSession = (...args) => impl.getSession(...args);
export const signOut = (...args) => impl.signOut(...args);

export const createOrder = (...args) => impl.createOrder(...args);
export const getOrder = (...args) => impl.getOrder(...args);
export const listOrders = (...args) => impl.listOrders(...args);
export const listAllOrders = (...args) => impl.listAllOrders(...args);
export const updateOrderStatus = (...args) => impl.updateOrderStatus(...args);
export const updateCourierPosition = (...args) =>
  impl.updateCourierPosition(...args);
export const assignAgent = (...args) => impl.assignAgent(...args);
export const updatePresentLocation = (...args) =>
  impl.updatePresentLocation(...args);
export const getFleet = (...args) => impl.getFleet(...args);
export const setFleetStatus = (...args) => impl.setFleetStatus(...args);
export const verifyWeight = (...args) => impl.verifyWeight(...args);

export const listUsers = (...args) => impl.listUsers(...args);
export const setUserRole = (...args) => impl.setUserRole(...args);
export const setUserSuspended = (...args) => impl.setUserSuspended(...args);
export const listCouriers = (...args) => impl.listCouriers(...args);
export const setCourierShift = (...args) => impl.setCourierShift(...args);
export const listAuditLog = (...args) => impl.listAuditLog(...args);
export const listNotifications = (...args) => impl.listNotifications(...args);
export const getSettings = (...args) => impl.getSettings(...args);
export const updateSettings = (...args) => impl.updateSettings(...args);
export const resetDemoData = (...args) => impl.resetDemoData(...args);
export const changeDestination = (...args) => impl.changeDestination(...args);
export const cancelOrder = (...args) => impl.cancelOrder(...args);

export const seedIfEmpty = (...args) => impl.seedIfEmpty(...args);
export const subscribe = (...args) => impl.subscribe(...args);

/*
 * New Flask API.
 *
 * These are deliberately exported separately from the legacy API above.
 */
export { authApi };
export { parcelsApi };

export * from './geo';

export { MOCK_OTP, DEFAULT_SETTINGS } from './mockBackend';
