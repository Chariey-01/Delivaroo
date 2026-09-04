# Delivaroo (DELIVEROO) — Complete Project Brief

> Source document for presentation generation. Everything below is drawn from the
> actual codebase, not from aspiration.

---

## 1. One-line description

Delivaroo is a full-stack, multi-modal parcel delivery and logistics platform: customers
book a pickup, the system prices and routes it across five transport modes, and a
nine-section admin portal dispatches, tracks and audits every delivery end to end.

## 2. The problem

Parcel delivery in Kenyan cities is fragmented and opaque. A sender does not know what a
delivery will cost until a rider quotes it, cannot see where the parcel is once it leaves,
and has no record of who handled it. Operators, meanwhile, run dispatch on WhatsApp and
spreadsheets — with no audit trail, no capacity view, and no single source of truth for
pricing.

## 3. The solution

One system with two faces:

- **Customer side** — say where a parcel is going and what it is; the platform computes the
  real driving route, prices every eligible transport mode against that route, assigns an
  agent, and streams live tracking with a moving map marker and a counting-down ETA.
- **Operations side** — a gated admin portal with nine sections: dispatch board, courier
  roster, transport capacity, accounts and roles, reports, notification outbox, audit trail,
  and platform settings.

## 4. Core user journey

```
WHERE? → WHAT? → HOW? → PRICE → REQUEST PICKUP → AGENT ASSIGNED
      → PICKED UP → IN TRANSIT → TRACK LIVE → DELIVERED
```

1. Pick a pickup and destination (type-ahead search, "use my location", or tap the map).
2. The route, distance and duration draw themselves on the map.
3. Declare the parcel — weight, type, optional dimensions.
4. Choose how it travels. Four/five cards, priced live against *this* route and *this*
   parcel. Ineligible modes are disabled **with a stated reason** ("Sea freight starts at
   200 km") — never silently dropped.
5. Request pickup, sign in, confirm.
6. The confirmation screen finds an agent, then shows who is coming, in what vehicle, how
   far out, and the ETA.
7. Live tracking: a marker that moves along the measured polyline, a seven-stage timeline,
   and a countdown that advances with the clock.

## 5. Architecture

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  React 18 + Vite SPA         │  HTTPS │  Flask 3 REST API            │
│  Redux Toolkit (6 slices)    │ ─────► │  Flask-RESTful resources     │
│  React Router v6             │  JWT   │  Service layer (15 services) │
│  Leaflet / Google Maps       │ ◄───── │  SQLAlchemy 2 ORM            │
│  Vercel                      │  JSON  │  Render + Gunicorn           │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │
                                        ┌──────────────▼───────────────┐
                                        │  PostgreSQL 16               │
                                        │  13 models, Alembic migrations│
                                        └──────────────────────────────┘
                    External: Google Geocoding API · Google Routes API · SMTP
```

**Layering discipline on the backend:** `resources/` (HTTP + validation) → `services/`
(business logic) → `models/` (persistence). No business rule lives in a route handler.

**Layering discipline on the frontend:** pure, dependency-free logic modules
(`lib/pricing.js`, `lib/transport.js`, `lib/journey.js`, `lib/orderStatus.js`,
`lib/roles.js`) that React never touches — so they are unit-testable and mirror-able
server-side. `pricing.js` imports `transport.js`, never the reverse.

## 6. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3, Vite 5, JavaScript (ESM), React Router 6.30 |
| State | Redux Toolkit 2.2, React-Redux 9.1 — slices: `ui`, `auth`, `booking`, `orders`, `fleet`, `admin` |
| Maps | Leaflet 1.9 + React-Leaflet 4.2 (client), Google Geocoding + Routes API (server) |
| Backend | Python 3.12, Flask 3.1.3, Flask-RESTful 0.3.10 |
| ORM / DB | SQLAlchemy 2.0.52, Flask-SQLAlchemy 3.1.1, Flask-Migrate 4.1 (Alembic 1.19), PostgreSQL 16 |
| Auth | Flask-JWT-Extended 4.7, bcrypt 5.0, SHA-256-hashed opaque refresh tokens |
| CORS | flask-cors 6.0 with an explicit origin allow-list |
| Testing | pytest 9.1 + pytest-cov (backend), Jest 29 + React Testing Library 16 (frontend) |
| CI/CD | GitHub Actions — lint, test, build on every PR to `develop` and `main` |
| Hosting | Vercel (frontend), Render + Gunicorn 23 (API + PostgreSQL) |

## 7. Data model — 13 tables

| Model | Purpose |
|---|---|
| `User` | Identity + credentials. UUID PK, unique normalized email, bcrypt hash, role (`user` / `admin`), `is_active` |
| `Profile` | Name, phone, avatar — separated from auth concerns |
| `Address` | Saved pickup/destination book with lat/lng and a `is_default` flag |
| `WeightCategory` | Tariff bands: `min_weight`, `max_weight`, `base_price`, `price_per_km` |
| `Parcel` | The central entity — tracking number, pickup/destination/present coordinates, status, price, distance, duration, transport mode |
| `StatusHistory` | Append-only audit of every status change, with who, when, where, and notes |
| `DeliveryAgent` | Courier roster with transport mode and active flag |
| `RefreshToken` | SHA-256 hash of an opaque token, 7-day expiry, revocable |
| `PasswordResetToken` | Single-use, expiring reset tokens |
| `Notification` | One logical event with an idempotency key |
| `NotificationDelivery` | Per-channel delivery record (IN_APP / EMAIL / SMS) with attempt count and status |
| `NotificationPreference` | Per-user opt-in for email, SMS, status updates, location updates |
| `AuditLog` | Who did what to which entity, old value → new value, with IP address |

Every primary key is a UUID — IDs are not guessable and not enumerable.

## 8. The pricing engine

Price is **always computed server-side**. The API explicitly ignores any client-supplied
`price`, `distance`, or `duration` when coordinates are present.

```
price = base_price + (price_per_km × measured_route_distance)
```

Distance is the **driving route** from Google Routes API — not straight-line — with a
haversine fallback when the provider is unavailable.

**Multi-modal tariffs (frontend `lib/transport.js`):**

| Mode | Base | Per km | Per kg | Floor | Eligible when |
|---|---|---|---|---|---|
| 🚐 Road | — | 40 (first 50 km) then 6 | 50 | 200 | ≤ 1,500 km, ≤ 2,000 kg |
| 🏍️ Motorbike | 60 | 28 | 22 | 150 | ≤ 45 km, ≤ 20 kg, ≤ 70 cm side |
| ✈️ Air | 1,500 | 11 | 240 | 2,000 | ≥ 120 km, ≤ 250 kg |
| 🚢 Ship | 900 | 4.5 | 28 | 1,400 | ≥ 200 km **and** an end within 90 km of a port |
| 🚁 Drone | 350 | 60 | 110 | 700 | ≤ 30 km, ≤ 5 kg, ≤ 45 cm side |

Refinements that show design maturity:

- **Line-haul band** — 40/km is a cross-town courier rate and absurd over 400 km, so
  distance past the first 50 km is charged at 6/km instead.
- **Priority as a multiplier pair**, not a separate tariff — Express is ×1.45 price and
  ×0.72 time applied to whichever vehicle was chosen.
- **Volumetric weight** (L×W×H ÷ 5000) — a big light parcel is charged on the space it
  occupies; dimensions are also what disqualify a drone.
- **Declared vs. verified weight** — the weight a customer types buys only an *estimate*.
  The billable weight is what an admin put on the scale. Under-declaration beyond a
  tolerance (0.5 kg or 20%, whichever is larger) is flagged to operations.
- **Ineligible modes carry a reason.** A greyed-out card with no explanation is a dead end.

## 9. Security model

- **bcrypt** password hashing with per-password salt; plaintext never persisted.
- **Short-lived JWT access tokens** + **opaque refresh tokens stored only as SHA-256
  hashes** — a database leak does not yield usable refresh tokens. 7-day expiry, revocable.
- **A single in-flight refresh**, shared by every request that races into a 401 — no
  thundering herd on token expiry.
- **`@admin_required` decorator** verifying the JWT `role` claim server-side; the frontend
  guard is convenience, the backend guard is the control.
- **404-not-403 on cross-user access.** An unrelated user asking for someone else's parcel
  gets `404`, identical to a nonexistent parcel — ownership is never leaked.
- **Non-enumerating password reset.** `/auth/forgot-password` always answers "if the email
  exists, a link will be sent". A successful reset revokes every refresh token on the account.
- **Server-authoritative pricing** — the client cannot set its own fare.
- **Explicit CORS allow-list** with a dedicated regression test (`test_cors.py`).
- **Config validation at boot** — the app refuses to start without `SECRET_KEY`,
  `JWT_SECRET_KEY` and `DATABASE_URL`.
- **AuditLog with IP capture** on every privileged mutation.
- **Split Google Maps keys** — a server-restricted key for Geocoding/Routes, a
  browser-restricted key for the Maps JS/Places API.

## 10. The state machine

**Backend (canonical):**

```
PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
   └──────────┴────────────┴──────────────┴──────────► CANCELLED
```

`DELIVERED` and `CANCELLED` are terminal — zero outgoing transitions. Enforced by an
explicit `VALID_TRANSITIONS` map in `status_history_service.py`, not by scattered `if`
statements. Every transition writes a `StatusHistory` row.

**Frontend (human-facing):** `journeyStages()` *derives* seven readable stages —
requested, agent assigned, picked up, dispatched, in transit, arriving, delivered — from
the status plus how far through the journey the parcel is. One vocabulary for the API, one
for the human, derived rather than duplicated.

Cancellation is a **soft cancel** — the row is retained with status `CANCELLED`, and it is
**idempotent**: cancelling twice returns 200, not an error.

## 11. Notification system

One logical `Notification` fans out into per-channel `NotificationDelivery` rows
(IN_APP, EMAIL, SMS), each with its own status, attempt count (max 3) and provider
reference. Events: `WELCOME`, `PARCEL_CREATED`, `PARCEL_STATUS_CHANGED`,
`PARCEL_LOCATION_UPDATED`, `PARCEL_CANCELLED`, `PARCEL_DESTINATION_UPDATED`,
`PARCEL_AGENT_ASSIGNED`.

- **Idempotency key is a unique column** — the same event cannot notify twice.
- Users control channels through `NotificationPreference`.
- SMS is **safe-disabled by default** — it requires `SMS_ENABLED=true` *and* an explicitly
  configured provider. No real provider call ever runs in tests.

## 12. The admin portal — nine sections

| Section | What it does |
|---|---|
| **Overview** | The four figures a shift lead acts on, then exceptions, then the shape of the fortnight |
| **Deliveries** | The dispatch board — search, sort, filter, and every lever on the selected parcel |
| **Couriers** | The roster: who is on shift, what they carry, what they have moved |
| **Capacity** | Availability per transport mode, live load, and the printed tariff table |
| **Accounts** | Customers and colleagues; roles and suspension |
| **Reports** | Volume, revenue, punctuality, busiest routes, courier performance, CSV export |
| **Notifications** | Every message the platform has sent about a delivery |
| **Audit trail** | Who did what, to whose delivery, and when |
| **Settings** | Booking pause, the notice every colleague sees, demo data controls |

**Permission-driven, not screen-driven.** One `SECTIONS` table drives the sidebar, the page
heading *and* the route guard — so a section can never appear in navigation while being
closed to the person looking at it. Roles: `USER` / `CUSTOMER` (own deliveries only),
`DISPATCHER` (the board, roster, capacity — no accounts, no settings, **including by URL**),
`ADMIN` (everything).

Admin actions are live: change a status or drag the vehicle marker and **the customer's
tracking tab updates without a reload**, via a cross-tab subscription. Take drone capacity
offline and it disappears from customer quotes immediately.

## 13. API surface

Every endpoint is served at both `/…` and `/api/…` for frontend compatibility.

**Auth** — `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`,
`/reset-password`, `/change-password`; `GET /auth/me`

**Parcels** — `POST /api/parcels`, `GET /api/parcels`, `GET /api/parcels/:id`,
`PATCH /api/parcels/:id` (destination), `PATCH /api/parcels/:id/cancel`,
`GET /api/parcels/track/:tracking_number`, `GET /api/parcels/:id/history`

**Admin** — `GET /api/admin/parcels` (filter by status / tracking number / transport mode,
paginated), `PATCH /api/admin/parcels/:id/status`, `/location`, `/delivery-agent`

**Supporting** — `/api/weight-categories`, `/api/addresses` (+ `/default`), `/api/profile`,
`/api/notifications` (+ `/unread-count`, `/read`, `/read-all`), `/api/notification-preferences`,
`/api/maps/geocode`, `/reverse-geocode`, `/route`, `/api/health`

**Consistent response envelope** — every response carries `message` plus both a `data` key
and a named key (`parcel`, `user`, `parcels`), so the contract is stable while remaining
readable. Errors always answer `{ "message": "..." }`, written for the end user.

Tracking numbers are cryptographically random (`secrets`), format `DLV-XXXXXXXXXX`, with a
uniqueness re-roll loop.

## 14. Testing & quality

| Metric | Value |
|---|---|
| Backend test functions | **186** across 27 test files |
| Frontend test cases | **316** across 29 test files |
| Total | **502 automated tests** |
| Backend lines (app + tests) | ~6,750 |
| Frontend lines | ~21,970 |

Backend tests run against a **real PostgreSQL 16 service container** in CI — not an
in-memory stand-in — with `db.create_all()` per test, so schema behaviour is genuinely
exercised.

Notable test files that show intent: `test_admin_parcel_authorization.py`,
`test_address_authorization.py`, `test_profile_authorization.py`,
`test_admin_status_authorization.py` — authorization is tested as a first-class concern,
separately from functionality. `test_frontend_api_compat.py` and
`test_frontend_parcel_routes.py` pin the contract between the two halves so a backend change
cannot silently break the client. `test_cors.py` is a regression guard on deployment config.

Frontend testing includes unit tests for the pure logic modules, component tests, an
`integration/` suite (auth, password recovery, protected routes, API contract) and a
`smoke/` suite.

## 15. CI/CD pipeline

GitHub Actions, on every push and PR to `develop` and `main`:

- **Frontend job** — Node 22, `npm ci`, ESLint, Jest, Vite production build.
- **Backend job** — Python 3.12, PostgreSQL 16 service container, full pytest suite,
  plus `python -m compileall` as a syntax gate.

Deployment: Vercel builds `frontend/` to `dist/`; Render runs
`flask db upgrade && gunicorn run:app` from `backend/` with `/api/health` as the health
check path.

## 16. Engineering process

- **Three-tier Git flow** — `main` (production) ← `develop` (integration) ← `feature/*`.
  Direct pushes to `main` are prohibited.
- **48 branches**, one per feature — `feature/auth`, `feature/parcel-crud`,
  `feature/parcel-cancel`, `feature/status-history`, `feature/admin-status`,
  `feature/admin-location`, `feature/maps-route`, `feature/maps-markers`,
  `feature/notification-system`, `feature/audit-logs`, `feature/refresh-token`,
  `feature/password-reset-flow`, `feature/e2e-tests`, `feature/deployment-ci`, and more.
- **399 commits** over roughly two weeks (18 Aug – 3 Sep 2026), Conventional Commit style
  (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`).
- **PR-based review** into `develop` with required passing CI.
- **Documentation-first** — a 15,700-word backend PRD (`BACKENDPRD.md`) written before
  implementation, a full API contract (`docs/api-contract.md`), a deployment runbook
  (`docs/deployment.md`) and a QA checklist (`docs/qa/QA-CHECKLIST.md`).
- **A deterministic seed script** (`seed.py`) producing 12 demo customers, 8 delivery
  agents across 4 transport modes, and 4 weight categories — so a demo is reproducible.

## 17. Team

Five contributors, by commit count: **brucemwendwa (206)**, **Chariey-01 (111)**,
**Dazed31 (57)**, **clydeopendabichanga'a (14)**, **bhokenatasha810 (2)**.

## 18. Engineering decisions worth defending

1. **Server-authoritative pricing.** The client renders a quote; it never sets one. The API
   discards any client-supplied price.
2. **Service layer between routes and models.** Business logic is testable without an HTTP
   request and reusable across the two route aliases.
3. **Pure logic modules on the frontend.** Pricing, transport eligibility, journey geometry
   and permissions are React-free and Leaflet-free, so they are unit-testable and can be
   mirrored server-side without a rewrite.
4. **UUID primary keys everywhere.** Non-enumerable resources by construction.
5. **Refresh tokens stored as hashes.** Same reasoning as password hashing, applied
   consistently.
6. **404 instead of 403 for cross-user reads.** Prevents ownership enumeration.
7. **Idempotency keys on notifications** and idempotent cancellation. Retries are safe.
8. **Explicit transition map** for the status machine. The illegal move is impossible, not
   merely unhandled.
9. **Soft cancellation.** Operational history is never destroyed.
10. **One SECTIONS table** driving navigation, headings and guards together — they cannot
    drift apart.
11. **Ineligible options explain themselves.** A UX rule enforced in the data model.
12. **Dual route aliases** (`/auth/*` and `/api/auth/*`) so frontend and backend could
    evolve on independent branches without a breaking merge.

## 19. Honest limitations & roadmap

- Live tracking uses cross-tab subscription and clock-derived interpolation rather than
  WebSockets or real GPS telemetry from a courier device.
- SMS delivery is scaffolded (model, preference, delivery record) but safe-disabled — no
  provider is wired.
- No payment integration yet; M-Pesa Daraja is the natural next step for the Kenyan market.
- Courier assignment is admin-driven; automated dispatch optimisation is future work.
- The `owner` object on admin parcel listings currently exposes only email.

**Next:** M-Pesa payments · WebSocket live tracking · a courier mobile app with real GPS ·
automated dispatch assignment · route optimisation for multi-stop runs · proof-of-delivery
capture (signature/photo).

## 20. Numbers for the closing slide

- **13** database models
- **15** backend service modules
- **31** REST resources across **49** routes
- **5** transport modes
- **9** admin portal sections
- **6** Redux slices
- **502** automated tests
- **399** commits · **48** branches · **5** contributors
- **~28,800** lines of application code
