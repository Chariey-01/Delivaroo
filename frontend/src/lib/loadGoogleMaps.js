// Loads the Google Maps JavaScript API on demand.
//
// Deliberately no npm package. The official loader is a thin wrapper over the same
// script tag, and adding a dependency for one <script> is not worth the peer-range
// churn on React 19. The key never appears in source — it arrives through
// VITE_GOOGLE_MAPS_API_KEY at build time.

import { GOOGLE_MAPS_API_KEY } from '../api/viteEnv';

const SCRIPT_ID = 'google-maps-js-api';
// `places` powers address autocomplete, `routes` the directions service.
const LIBRARIES = 'places,geometry,routes';

/** One shared promise: several components mounting at once must not inject two tags. */
let loading = null;

export class MapsConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MapsConfigError';
  }
}

export const isMapsConfigured = () => Boolean(GOOGLE_MAPS_API_KEY);

/**
 * Resolves with `window.google.maps`. Rejects with a MapsConfigError when no key is
 * configured, which the map component renders as a setup notice rather than a crash —
 * a teammate running the app without a key should still get a working build.
 */
export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new MapsConfigError(
        'Google Maps is not configured. Set VITE_GOOGLE_MAPS_API_KEY in frontend/.env.local',
      ),
    );
  }

  loading ??= new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => resolve(window.google.maps));
    script.addEventListener('error', () => {
      loading = null;
      script.remove();
      reject(new Error('Could not load Google Maps. Check the API key and your connection.'));
    });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
        `&libraries=${LIBRARIES}&loading=async&v=weekly`;
      document.head.appendChild(script);
    }
  });

  return loading;
}

/** Test seam: lets a suite drop a stub `window.google` and re-run the loader. */
export function resetGoogleMapsLoader() {
  loading = null;
}
