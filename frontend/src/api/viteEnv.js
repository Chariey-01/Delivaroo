// The ONLY module that touches import.meta.
//
// Babel transpiles ESM to CJS for Jest, where a bare `import.meta` is a syntax error,
// so jest.config.cjs maps this file to src/__mocks__/viteEnvMock.cjs. Keep every
// import.meta reference here and nowhere else, or the test run stops compiling.

const env = import.meta.env ?? {};

/**
 * Flask API origin. Blank in development, which makes every request relative
 * (`/api/...`) so the Vite proxy forwards it to the Flask dev server.
 */
export const API_BASE_URL = env.VITE_API_URL ?? '';

/** Google Maps JavaScript API key. Blank means the map renders its unconfigured state. */
export const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** Where the map opens before it has anything to show. Nairobi by default. */
export const MAP_DEFAULT_CENTER = {
  lat: Number(env.VITE_MAP_DEFAULT_LAT ?? -1.2921),
  lng: Number(env.VITE_MAP_DEFAULT_LNG ?? 36.8219),
};
