// Geocoding + routing behind one interface (§6, §7).
//
// Browser geocoding/autocomplete plus backend routing behind one interface (§6, §7).
// The backend owns route distance and duration because parcel prices are derived
// from those fields server-side.

import { loadGoogleMaps } from '../lib/loadGoogleMaps';
import { api } from './client';

/** Nairobi. Search results are biased toward it so local queries rank first. */
export const CITY_CENTER = { lat: -1.2921, lng: 36.8219 };

const PHOTON = 'https://photon.komoot.io/api';
/** Straight-line km. Used by tests and local display helpers. */
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Photon feature → the flat shape the UI stores on an order. */
function toPlace(feature) {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties || {};
  const line = [p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street || p.name, p.district]
    .filter(Boolean)
    .join(', ');
  const area = [p.city || p.county, p.state].filter(Boolean).join(', ');
  return {
    id: `${p.osm_type || 'x'}${p.osm_id || `${lat}${lng}`}`,
    label: [line || p.name, area].filter(Boolean).join(' · ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    name: p.name || line || 'Dropped pin',
    lat,
    lng
  };
}

/**
 * Address autocomplete. Callers debounce and pass an AbortSignal so superseded
 * keystrokes don't race. Returns [] rather than throwing when the network is down —
 * an empty dropdown degrades better than an error under a search box.
 */
export async function searchPlaces(query, { signal, limit = 6 } = {}) {
  const q = (query || '').trim();
  if (q.length < 3) return [];

  try {
    const maps = await loadGoogleMaps();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const predictions = await new Promise((resolve) => {
      new maps.places.AutocompleteService().getPlacePredictions(
        { input: q, locationBias: { center: CITY_CENTER, radius: 50000 } },
        (results, status) => resolve(status === maps.places.PlacesServiceStatus.OK ? results ?? [] : []),
      );
    });
    return predictions.slice(0, limit).map((prediction) => ({
      id: prediction.place_id,
      label: prediction.description,
      name: prediction.structured_formatting?.main_text ?? prediction.description,
      lat: null,
      lng: null,
    }));
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
  }

  const url = `${PHOTON}/?q=${encodeURIComponent(q)}&limit=${limit}&lang=en&lat=${CITY_CENTER.lat}&lon=${CITY_CENTER.lng}`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.features || []).map(toPlace);
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return [];
  }
}

/**
 * Photon search results already include coordinates. Keeping this resolver makes the
 * provider-neutral place-search component work with both the current provider and
 * providers whose predictions need a second lookup.
 */
export async function resolvePlace(selected) {
  if (!selected || (selected.lat != null && selected.lng != null)) return selected;
  const maps = await loadGoogleMaps();
  const { results } = await new maps.Geocoder().geocode({ placeId: selected.id });
  const hit = results?.[0];
  if (!hit) return selected;
  const loc = hit.geometry.location;
  return {
    ...selected,
    label: hit.formatted_address ?? selected.label,
    lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
    lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
  };
}

/** Coordinates → an address label, for "use my current location" and map taps. */
export async function reverseGeocode({ lat, lng }) {
  const fallback = { id: `pin${lat}${lng}`, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, name: 'Dropped pin', lat, lng };
  try {
    const maps = await loadGoogleMaps();
    const { results } = await new maps.Geocoder().geocode({ location: { lat, lng } });
    const hit = results?.[0];
    if (hit) {
      return {
        id: hit.place_id ?? fallback.id,
        label: hit.formatted_address,
        name: hit.address_components?.[0]?.long_name ?? hit.formatted_address,
        lat,
        lng,
      };
    }
  } catch {
    // Use the keyless provider below when Maps is not configured or unavailable.
  }
  try {
    const response = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`);
    if (!response.ok) return fallback;
    const data = await response.json();
    return data.features?.[0] ? toPlace(data.features[0]) : fallback;
  } catch {
    return fallback;
  }
}

/** The browser's own geolocation, promisified. */
export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser cannot share your location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location permission denied. Search for an address instead.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Driving route between two points, calculated by the Flask backend so distance
 * and duration stay tied to the server-side price.
 * → { distanceKm, durationSeconds, coordinates: [[lat, lng], ...], estimated }
 */
export async function routeBetween(from, to) {
  return api('/maps/route', {
    method: 'POST',
    body: {
      pickup: { lat: from.lat, lng: from.lng },
      destination: { lat: to.lat, lng: to.lng },
    },
  });
}
