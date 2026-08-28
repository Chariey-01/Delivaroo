// Single entry point for data access. Components import from here — never from
// client.js directly — so the transport can change without touching a screen.

export { ApiError, api, get, post, patch, del } from './client';

export * as authApi from './auth';
export * as parcelsApi from './parcels';
export * from './geo';
