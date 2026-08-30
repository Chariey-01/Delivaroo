// Geocoding, address autocomplete and routing, behind one interface.
//
// Backed by Google Maps (Places + Geocoding + Directions), per the README's stack and
// the GOOGLE_MAPS_API_KEY the backend already expects. Callers depend on the shapes
// returned here, not on Google — swapping providers means rewriting this file only.
//
// Every function degrades instead of throwing: an empty dropdown or an estimated
// distance is a better failure than a blank screen under a search box.

import { loadGoogleMaps } from '../lib/loadGoogleMaps';
import { MAP_DEFAULT_CENTER } from './viteEnv';

/** Nairobi by default. Autocomplete results are biased toward it so local queries rank first. */
export const CITY_CENTER = MAP_DEFAULT_CENTER;

/** A place, in the flat shape the store and the map both read. */
const place = ({ id, label, name, lat, lng }) => ({ id, label, name, lat, lng });

/** Straight-line km — used only by the offline fallback in routeBetween. */
export function haversineKm(a, b) {
  const R = 6371;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(rad(a.lat)) * Math.cos(rad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(h));
}

const coordLabel = (lat, lng) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

/**
 * Address autocomplete. Callers debounce; `signal` aborts a superseded keystroke so
 * results from an earlier query can never overwrite a later one.
 *
 * Returns [] rather than throwing when Maps is unavailable or unconfigured.
 */
export async function searchPlaces(query, { signal, limit = 6 } = {}) {
  const q = (query || '').trim();
  if (q.length < 3) return [];

  let maps;
  try {
    maps = await loadGoogleMaps();
  } catch {
    return [];
  }
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const service = new maps.places.AutocompleteService();
  const predictions = await new Promise((resolve) => {
    service.getPlacePredictions(
      {
        input: q,
        // A radius-biased search, not a hard restriction: a customer shipping out of
        // town must still be able to find the destination.
        locationBias: { center: CITY_CENTER, radius: 50000 },
      },
      (results, status) => resolve(status === maps.places.PlacesServiceStatus.OK ? results ?? [] : []),
    );
  });

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  return predictions.slice(0, limit).map((p) =>
    place({
      id: p.place_id,
      label: p.description,
      name: p.structured_formatting?.main_text ?? p.description,
      // Predictions carry no coordinates; resolvePlace fills them in on selection,
      // which also keeps this off the per-keystroke billing tier.
      lat: null,
      lng: null,
    }),
  );
}

/**
 * A prediction has no coordinates, so the chosen one is resolved to a point before it
 * is stored. Anything already carrying a lat/lng passes straight through.
 */
export async function resolvePlace(selected) {
  if (!selected || (selected.lat != null && selected.lng != null)) return selected;

  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  const { results } = await geocoder.geocode({ placeId: selected.id });
  const hit = results?.[0];
  if (!hit) return selected;

  const loc = hit.geometry.location;
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
  return place({ ...selected, label: hit.formatted_address ?? selected.label, lat, lng });
}

/** Coordinates → an address label, for "use my location" and for map taps. */
export async function reverseGeocode({ lat, lng }) {
  const fallback = place({
    id: `pin:${lat},${lng}`,
    label: coordLabel(lat, lng),
    name: 'Dropped pin',
    lat,
    lng,
  });

  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    const hit = results?.[0];
    if (!hit) return fallback;
    return place({
      id: hit.place_id ?? fallback.id,
      label: hit.formatted_address,
      name: hit.address_components?.[0]?.long_name ?? hit.formatted_address,
      lat,
      lng,
    });
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
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

/**
 * Driving route between two points.
 * → { distanceKm, durationSeconds, coordinates: [{lat,lng}, ...], estimated }
 *
 * `estimated: true` means Directions was unreachable and the figures come from a
 * straight line scaled by a typical urban detour factor. The UI labels those as
 * estimates rather than presenting a guess as a measured route — and the backend
 * stores its own authoritative distance/duration on the parcel regardless (§8).
 */
export async function routeBetween(from, to) {
  try {
    const maps = await loadGoogleMaps();
    const service = new maps.DirectionsService();
    const result = await service.route({
      origin: from,
      destination: to,
      travelMode: maps.TravelMode.DRIVING,
    });

    const leg = result.routes?.[0]?.legs?.[0];
    if (!leg) throw new Error('No route');

    const path = result.routes[0].overview_path ?? [];
    return {
      distanceKm: leg.distance.value / 1000,
      durationSeconds: leg.duration.value,
      coordinates: path.map((p) => ({
        lat: typeof p.lat === 'function' ? p.lat() : p.lat,
        lng: typeof p.lng === 'function' ? p.lng() : p.lng,
      })),
      estimated: false,
    };
  } catch {
    // Offline, over quota, or no key: 1.35 is a common urban straight-line-to-road
    // ratio and 24 km/h approximates Nairobi traffic.
    const distanceKm = haversineKm(from, to) * 1.35;
    return {
      distanceKm,
      durationSeconds: (distanceKm / 24) * 3600,
      coordinates: [from, to],
      estimated: true,
    };
  }
}
