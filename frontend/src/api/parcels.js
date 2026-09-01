// Parcel endpoints (BACKENDPRD §8–§15).
//
// Parcel CRUD screens belong to other members of the team; this module exists so that
// when those screens are written the HTTP layer is already here, already sends the
// bearer token and already normalises coordinates the same way the map does.

import { get, patch, post } from './client';

/** Backend parcel → the flat shape the UI and the map both read. */
export function normalizeParcel(raw) {
  if (!raw) return null;
  const point = (lat, lng) =>
    lat == null || lng == null ? null : { lat: Number(lat), lng: Number(lng) };

  return {
    id: raw.id,
    trackingNumber: raw.tracking_number ?? raw.trackingNumber,
    status: raw.status,
    transportMode: raw.transport_mode ?? raw.transportMode,
    transportLabel: raw.transport_label ?? raw.transportLabel,
    deliveryAgent: raw.delivery_agent ?? raw.deliveryAgent ?? null,
    price: raw.price == null ? null : Number(raw.price),
    distance: raw.distance == null ? null : Number(raw.distance),
    duration: raw.duration == null ? null : Number(raw.duration),
    owner: raw.owner ?? null,
    weightCategoryId: raw.weight_category_id ?? raw.weightCategoryId,
    pickup: {
      address: raw.pickup_address ?? raw.pickupAddress ?? '',
      ...point(raw.pickup_latitude ?? raw.pickupLatitude, raw.pickup_longitude ?? raw.pickupLongitude),
    },
    destination: {
      address: raw.destination_address ?? raw.destinationAddress ?? '',
      ...point(
        raw.destination_latitude ?? raw.destinationLatitude,
        raw.destination_longitude ?? raw.destinationLongitude,
      ),
    },
    presentLocation: point(
      raw.present_latitude ?? raw.presentLatitude,
      raw.present_longitude ?? raw.presentLongitude,
    ),
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

const many = (data) =>
  (Array.isArray(data) ? data : (data?.items ?? data?.parcels ?? data?.data ?? [])).map(normalizeParcel);

export const listParcels = async () => many(await get('/parcels'));
export const getParcel = async (id) => normalizeParcel(await get(`/parcels/${id}`));
export const trackParcel = async (trackingNumber) =>
  normalizeParcel(await get(`/parcels/track/${encodeURIComponent(trackingNumber)}`));

export const createParcel = async (draft) => normalizeParcel(await post('/parcels', draft));
export const listWeightCategories = () => get('/weight-categories');
export const updateDestination = async (id, destination) =>
  normalizeParcel(await patch(`/parcels/${id}/destination`, destination));
export const cancelParcel = async (id) => normalizeParcel(await patch(`/parcels/${id}/cancel`));

export const getStatusHistory = (id) => get(`/parcels/${id}/history`);

// Admin-only on the server (§13–§15). The UI gates the button, the route gates the data.
export const listAllParcels = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  ).toString();
  return many(await get(`/admin/parcels${query ? `?${query}` : ''}`));
};
export const updateParcelStatus = async (id, status) =>
  normalizeParcel(await patch(`/admin/parcels/${id}/status`, { status }));
export const updatePresentLocation = async (id, { lat, lng }) =>
  normalizeParcel(await patch(`/admin/parcels/${id}/location`, { latitude: lat, longitude: lng }));
