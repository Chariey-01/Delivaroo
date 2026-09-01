// The ONLY module that touches import.meta. Babel transpiles ESM to CJS for Jest,
// where import.meta is a syntax error, so jest.config.cjs maps this file to a stub
// (src/__mocks__/viteEnvMock.cjs). Keep the import.meta reference here and nowhere else.
export const API_BASE_URL = import.meta.env?.VITE_API_URL ?? '';
export const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** Mocks are test/demo-only. A blank origin uses Vite's `/api` proxy in development. */
export const USE_MOCK_BACKEND = import.meta.env?.VITE_USE_MOCK_BACKEND === 'true';
