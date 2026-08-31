// Single entry point for data access. Everything in the app imports from here —
// never from mockBackend or client directly — so switching to the real Flask API
// is a matter of setting VITE_API_URL and nothing else.

import { USE_MOCK_BACKEND } from './viteEnv';
import * as mock from './mockBackend';
import { api } from './client';
export * as authApi from './auth';
export * as parcelsApi from './parcels';
import * as parcelsApi from './parcels';

/** Which implementation is live. The admin console prints this so it's never a mystery. */
export const usingMockBackend = USE_MOCK_BACKEND;

// The HTTP side is written against the endpoints the Flask app is expected to expose.
// Shapes match the mock exactly, which is what makes the two interchangeable.
const unsupported = (feature) => () => {
  throw new Error(`${feature} is not available from the live backend yet.`);
};

const asOrder = (parcel) => {
  if (!parcel) return null;
  const point = (place) => ({ name: place?.address || '', label: place?.address || '', lat: place?.lat, lng: place?.lng });
  return {
    id: parcel.id,
    trackingNumber: parcel.trackingNumber,
    status: parcel.status,
    transport: { mode: parcel.transportMode, label: parcel.transportLabel },
    pickup: point(parcel.pickup),
    destination: point(parcel.destination),
    presentLocation: parcel.presentLocation,
    route: { distanceKm: parcel.distance, durationSeconds: Number(parcel.duration || 0) * 60 },
    pricing: { total: parcel.price },
    courier: parcel.deliveryAgent,
    createdAt: parcel.createdAt,
    updatedAt: parcel.updatedAt,
  };
};

const asOrders = (parcels) => parcels.map(asOrder);

const backendTransportMode = {
  ROAD: 'TRUCK',
  MOTORBIKE: 'MOTORBIKE',
  AIR: 'AIR',
  SHIP: 'SHIP',
};

const createLiveOrder = async (draft) => {
  const weightKg = Number(draft.parcel?.weightKg);
  const categories = await parcelsApi.listWeightCategories();
  const category = categories.find(
    (entry) => weightKg >= Number(entry.min_weight) && weightKg <= Number(entry.max_weight),
  );
  const transportMode = backendTransportMode[draft.transport?.mode];

  if (!category) throw new Error('The selected parcel weight is not supported.');
  if (!transportMode) throw new Error('The selected transport mode is not available from the live backend.');

  return asOrder(
    await parcelsApi.createParcel({
      weightCategoryId: category.id,
      pickup: {
        address: draft.pickup?.label,
        lat: draft.pickup?.lat,
        lng: draft.pickup?.lng,
      },
      destination: {
        address: draft.destination?.label,
        lat: draft.destination?.lat,
        lng: draft.destination?.lng,
      },
      distanceKm: draft.route?.distanceKm,
      durationSeconds: draft.route?.durationSeconds,
      transportMode,
    }),
  );
};

const http = {
  requestOtp: (payload) => api('/auth/otp', { method: 'POST', body: payload }),
  verifyOtp: (payload) => api('/auth/verify', { method: 'POST', body: payload }),
  getSession: () => api('/auth/session'),
  signOut: () => api('/auth/session', { method: 'DELETE' }),

  createOrder: createLiveOrder,
  getOrder: async (id) => asOrder(await parcelsApi.getParcel(id)),
  listOrders: async () => asOrders(await parcelsApi.listParcels()),
  listAllOrders: async () => asOrders(await parcelsApi.listAllParcels()),
  updateOrderStatus: async (id, status) => asOrder(await parcelsApi.updateParcelStatus(id, status)),
  updateCourierPosition: unsupported('Courier position updates'),
  // §25 — dispatch finds and attaches a pickup agent. The server owns the matching;
  // the client only asks. Must be idempotent: the confirmation screen may retry.
  assignAgent: unsupported('Delivery-agent assignment'),
  // §26 — staff-only: where the parcel currently is, in words.
  updatePresentLocation: async (id, payload) => asOrder(await parcelsApi.updatePresentLocation(id, payload)),
  // §26 — which transport capacity dispatch can book into today.
  getFleet: unsupported('Transport capacity'),
  setFleetStatus: unsupported('Transport capacity'),
  // Staff-only on the server. The console gates the button, the route gates the data.
  verifyWeight: unsupported('Weight verification'),

  // §27 — the rest of the admin portal. Everything under /admin is staff-only, and
  // the three account routes are administrator-only; see src/lib/roles.js for the
  // grant table the Flask side has to mirror.
  listUsers: () => api('/admin/users'),
  setUserRole: (id, role) => api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setUserSuspended: (id, suspended) =>
    api(`/admin/users/${id}/suspension`, { method: 'PATCH', body: { suspended } }),
  listCouriers: () => api('/admin/couriers'),
  setCourierShift: (id, onShift) =>
    api(`/admin/couriers/${id}/shift`, { method: 'PATCH', body: { onShift } }),
  listAuditLog: () => api('/admin/audit'),
  listNotifications: () => api('/admin/notifications'),
  getSettings: () => api('/settings'),
  updateSettings: (patch) => api('/admin/settings', { method: 'PATCH', body: patch }),
  // Demo-only: there is nothing to re-seed on a real database, and a button that
  // wiped one would be the worst button in the product.
  resetDemoData: () => {
    throw new Error('Demo data can only be reset against the local demo backend.');
  },
  changeDestination: async (id, payload) => asOrder(await parcelsApi.updateDestination(id, payload.destination || payload)),
  cancelOrder: async (id) => asOrder(await parcelsApi.cancelParcel(id)),

  seedIfEmpty: () => {},
  // No storage events across a network, so fall back to polling. Swap for SSE or a
  // websocket when the backend can push.
  subscribe: (listener) => {
    const timer = setInterval(listener, 5000);
    return () => clearInterval(timer);
  }
};

const impl = USE_MOCK_BACKEND ? mock : http;

export const requestOtp = (...args) => impl.requestOtp(...args);
export const verifyOtp = (...args) => impl.verifyOtp(...args);
export const getSession = (...args) => impl.getSession(...args);
export const signOut = (...args) => impl.signOut(...args);

export const createOrder = (...args) => impl.createOrder(...args);
export const getOrder = (...args) => impl.getOrder(...args);
export const listOrders = (...args) => impl.listOrders(...args);
export const listAllOrders = (...args) => impl.listAllOrders(...args);
export const updateOrderStatus = (...args) => impl.updateOrderStatus(...args);
export const updateCourierPosition = (...args) => impl.updateCourierPosition(...args);
export const assignAgent = (...args) => impl.assignAgent(...args);
export const updatePresentLocation = (...args) => impl.updatePresentLocation(...args);
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

export { MOCK_OTP, DEFAULT_SETTINGS } from './mockBackend';
export * from './geo';
