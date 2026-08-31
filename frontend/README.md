# Delivaroo — Frontend

React + Vite single-page app for the Delivaroo parcel delivery platform.
It talks to the Flask API described in [`../BACKENDPRD.md`](../BACKENDPRD.md).

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build | Vite 8 |
| Routing | React Router 7 |
| State | Redux Toolkit + React Redux |
| HTTP | `fetch`, wrapped in `src/api/client.js` |
| Maps | Google Maps JavaScript API (Places, Geocoding, Directions) |
| Tests | Jest + React Testing Library |
| Lint | ESLint 10 (flat config) |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:5173
```

The dev server proxies `/api/*` to the Flask backend (default
`http://localhost:5000`), so there is no CORS to configure locally and no backend
host baked into the frontend.

## Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local`.**

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | production only | Flask API origin. Leave blank in development so requests go to `/api` and hit the Vite proxy. |
| `VITE_API_PROXY` | no | Where the dev proxy forwards `/api`. Defaults to `http://localhost:5000`. |
| `VITE_GOOGLE_MAPS_API_KEY` | for maps | Google Maps JavaScript API key. Without it the app still builds and runs — the map renders a "not configured" notice instead. |
| `VITE_MAP_DEFAULT_LAT` / `VITE_MAP_DEFAULT_LNG` | no | Where the map opens before it has anything to show. Defaults to Nairobi. |

The Google key needs **Maps JavaScript API**, **Places API** and **Directions API**
enabled, and should be restricted by HTTP referrer in the Google Cloud console.

## Scripts

```bash
npm run dev               # dev server
npm run build             # production build
npm run preview           # serve the production build
npm run lint              # eslint
npm test                  # every test
npm run test:integration  # integration tests only
npm run test:smoke        # smoke tests only
npm run test:coverage     # tests with a coverage report
```

## Layout

```text
src/
├── api/            HTTP layer — the only place that knows the backend exists
│   ├── client.js       fetch wrapper: bearer token, refresh-on-401, error shapes
│   ├── auth.js         /auth/register, /login, /logout, /refresh, /me
│   ├── parcels.js      parcel + admin parcel endpoints
│   ├── geo.js          Places / Geocoding / Directions, behind a provider-neutral API
│   └── viteEnv.js      the only module that reads import.meta
├── components/
│   ├── auth/       the shared frame and error banner for the auth screens
│   ├── maps/       DeliveryMap, PlaceSearch
│   ├── routing/    ProtectedRoute, AdminRoute, PublicOnlyRoute
│   └── ui/         Field, Button, Spinner
├── lib/            roles, token storage, validators, the Maps script loader
├── routes/         one file per screen
├── store/          Redux Toolkit slices
└── __tests__/      unit, integration/ and smoke/ suites
```

## Authentication

Email + password against Flask-JWT-Extended, per BACKENDPRD §19.

* `POST /api/auth/register` and `/login` return an access/refresh pair plus the user.
* Tokens live in `localStorage`, behind `src/lib/tokenStorage.js` — the only module
  that names the storage keys, so moving to httpOnly cookies later is a one-file change.
* `src/api/client.js` attaches `Authorization: Bearer <token>` and, on a 401,
  refreshes once and replays the request before giving up.
* `AppLayout` restores the session from a stored token on mount; guards wait for that
  question to be *answered* before redirecting, so a refresh on a protected URL does
  not bounce a signed-in user to `/login`.

### Route protection

| Guard | Behaviour |
| --- | --- |
| `ProtectedRoute` | Not signed in → `/login`, remembering where you were going. |
| `ProtectedRoute roles={[...]}` | Signed in, wrong role → `/unauthorized` (a 403, not another login prompt). |
| `AdminRoute` | `ProtectedRoute` narrowed to `ADMIN`. |
| `PublicOnlyRoute` | Already signed in → sent onward, away from `/login` and `/signup`. |

These guards are for coherence and clarity, **not** security. Authorization is
enforced by the backend on every endpoint (BACKENDPRD §2); a guard that lives only in
the browser guards nothing.

## Testing

```bash
npm test
```

* `src/__tests__/*.test.js[x]` — units: validators, roles, token storage, the API
  client, the auth slice, the map components.
* `src/__tests__/integration/` — the real store, the real route table and the real
  guards, with only `fetch` stubbed.
* `src/__tests__/smoke/` — shallow "is the app standing up?" checks. Run these first
  after a merge.

`src/__tests__/testUtils.jsx` holds the shared harness, and
`src/__mocks__/googleMaps.js` stands in for the Maps JavaScript API.
