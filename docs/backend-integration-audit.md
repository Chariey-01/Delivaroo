# Backend Integration Audit

Audit date: 2026-09-01

Branch: `feature/backend-integration-audit`

Overall status: **PARTIAL**. The integrated code and all local CI-equivalent checks pass. Deployment cannot be declared complete until GitHub Actions is allowed to start jobs, the production origins and secrets are verified, a clean PostgreSQL migration runs, and one explicitly approved SMTP smoke message is accepted.

## Traceability Matrix

| Requirement | Expected behavior | Implementation and evidence | Status | Remaining work |
| --- | --- | --- | --- | --- |
| Application factory | App starts and registers routes once | `create_app` starts successfully; 50 URL rules were inspected | PASS | None |
| Configuration | Required secrets and database URL fail fast; optional services are environment driven | `Config.validate`, `.env.example`, config tests and app-factory smoke | PASS | Set production values outside Git |
| PostgreSQL and SQLAlchemy | Runtime uses PostgreSQL with ORM-managed models | PostgreSQL URL support and CI service are configured; ORM suite passes | PARTIAL | Run CI after account unlock and verify production database |
| Models and relationships | User, parcel, profile, address, token, history, audit and notification relationships are coherent | ORM model inspection and 201 backend tests | PASS | None |
| Alembic migrations | One head; empty database upgrades without duplicate tables | Single head `72b6f1a9c4d2`; empty SQLite upgrade passes | PARTIAL | Confirm the same upgrade on PostgreSQL when CI can run |
| Registration and login | Secure password hash, normalized identity, valid tokens and welcome event | `/api/auth/register`, `/api/auth/login`; auth and notification tests | PASS | None |
| Current user | Valid access token returns active user | `/api/auth/me`; auth tests | PASS | None |
| Refresh sessions | Opaque persisted token is hashed, expires, revokes and issues a new access token | `/api/auth/refresh`; backend and frontend lifecycle tests | PASS | Verify deployed secrets remain stable across releases |
| Logout | Revokes the supplied refresh token | `/api/auth/logout`; revoked-token tests | PASS | None |
| Role authorization | Admin-only routes reject regular users | Admin authorization suites and refresh-role tests | PASS | None |
| Password recovery | Single-use expiring token, reset email, password hash, refresh revocation and signed-in change | Forgot/reset/change endpoints and invalid, expired, reused and valid-token tests | PASS | Complete one approved live email smoke test |
| Profiles and addresses | Owner can manage profile and isolated address records | Profile/address route and authorization suites | PASS | None |
| Weight categories | Categories list and drive server pricing | `/api/weight-categories`; category, parcel and pricing tests | PASS | None |
| Parcel creation | Owner, tracking number, route values and price are server controlled | `POST /api/parcels`; parcel/maps compatibility tests | PASS | None |
| Parcel listing/details | Owner can list and inspect own parcels | `GET /api/parcels`, `GET /api/parcels/{id}` | PASS | None |
| Parcel ownership | Cross-user read/write is rejected | Parcel/address/admin authorization suites | PASS | None |
| Distance and price | Coordinates are routed server-side and category formula controls price | Maps service and parcel tests; provider calls mocked | PASS | Configure restricted production Maps key |
| Parcel update/cancel | Allowed destination updates and cancellation obey state rules | Parcel update and cancellation suites | PASS | None |
| Admin parcel operations | Admin listing, search, filters, pagination, status, location and assignment work | `/api/admin/parcels` family; admin suites | PASS | None |
| Status history | Lifecycle changes append ordered history | Parcel history endpoint and history tests | PASS | None |
| Audit logs | Material parcel mutations write actor/entity/value records transactionally | Audit service wired to create, status, location, destination and cancel; audit tests | PASS | Add an admin read endpoint only if a product requirement requests one |
| In-app notifications | Recipient/actor/entity/event, pagination, unread count, read state and ownership work | Notification endpoints and notification suites | PASS | None |
| Email notifications | Recipient resolved from User, delivery persisted, timeout/failure handled, retries bounded | SMTP service, delivery records, retry command and mocked tests | PARTIAL | Configure provider and run one approved smoke email |
| SMS notifications | Provider delivery to verified phone numbers | Explicitly skipped; no provider or verified-phone contract exists | BLOCKED | Product/team must select provider and phone verification design |
| CORS | Exact environment origins; auth/content headers and used methods pass preflight | Environment-driven Flask-CORS config and CORS tests | PARTIAL | Verify the actual Vercel origin against deployed Render API |
| Seed data | Repeat execution is safe and demo records remain usable | Seed tests pass | PASS | Keep credentials in deployment secrets |
| API documentation | Current auth, parcel and deployment contracts are documented | `docs/api-contract.md` and `docs/deployment.md` | PASS | Keep synchronized with future routes |
| CI/CD | Frontend and backend checks run with PostgreSQL and clean migrations | Workflow parses; migration step added; local equivalent checks pass | BLOCKED | GitHub account billing lock prevents jobs from starting |
| Deployment integration | Render/Vercel settings, health check, migration and origins documented | Deployment guide is complete | PARTIAL | Verify actual deployed environment and smoke flow |

## Endpoint Inventory

- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- Passwords: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/change-password`
- Parcels: `GET|POST /api/parcels`, `GET|PATCH /api/parcels/{id}`, `GET /api/parcels/track/{tracking}`, `GET /api/parcels/{id}/history`, `PATCH /api/parcels/{id}/cancel`
- Admin: `GET /api/admin/parcels`, `PATCH /api/admin/parcels/{id}/status`, `PATCH /api/admin/parcels/{id}/location`, `PATCH /api/admin/parcels/{id}/delivery-agent`
- Account: `/api/profile`, `/api/addresses`, `/api/addresses/{id}`, `/api/addresses/{id}/default`
- Notifications: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/{id}/read`, `GET|PATCH /api/notification-preferences`
- Supporting: `GET /api/weight-categories`, maps geocode, reverse-geocode and route endpoints

## Session Diagnosis

The current backend uses seven-day, opaque refresh tokens stored only as hashes. The frontend persists the refresh token, performs one shared refresh for concurrent 401 responses, stores the replacement access token, and retries each original request once. It logs out only when refresh is missing or fails. Expired, revoked, missing, admin and regular-user cases pass.

The reported next-day expiry was not reproducible from the integrated source, so there is no evidence supporting a token-lifetime increase. The remaining deployment-level candidates are an older frontend/backend release, a refresh token absent from browser storage, a revoked/missing database token, or a changed `JWT_SECRET_KEY`/database between deployments. Production logs and environment history are required to select among them.

## Notification and Email Operations

In-app events are persisted independently of provider success. Email addresses are resolved from the recipient User at delivery time and are not stored in arbitrary notification metadata. SMTP supports configurable TLS and timeout, records accepted/failed/skipped delivery state, and a bounded retry pass is available with `python process_notification_deliveries.py`.

Required SMTP variables are `SMTP_HOST`, `SMTP_PORT`, `SMTP_USE_TLS`, `SMTP_TIMEOUT_SECONDS`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER_NAME`, and `SMTP_SENDER_EMAIL`. Password reset links use `PASSWORD_RESET_URL`. Secrets must remain in deployment configuration.

The guarded live check is `python notification_smoke.py --confirm` with `ALLOW_REAL_NOTIFICATION_TESTS=true` and `TEST_NOTIFICATION_EMAIL` configured outside Git. No message was sent during this audit because no approved recipient/provider credentials were available.

## Verification Evidence

- `.venv/bin/pytest`: 201 passed
- `npm test -- --ci --runInBand`: 27 suites, 299 tests passed
- `npm run lint`: passed
- `npm run build`: passed; Vite reported a non-failing 632.20 kB chunk-size warning
- `.venv/bin/python -m compileall app notification_smoke.py process_notification_deliveries.py`: passed
- Empty SQLite `flask db upgrade`: passed from base to `72b6f1a9c4d2`
- Workflow YAML parsing and `git diff --check`: passed

Frontend Jest output contains non-failing React Router v7 future notices and existing React test/style warnings. They do not indicate a backend integration failure, but should be cleaned up in a focused frontend test-maintenance task.

## CI Blocker

GitHub check-run annotations for the failing main-branch workflow state: `The job was not started because your account is locked due to a billing issue.` The failures occur before checkout or any project command, so application changes cannot make those hosted checks green. Once the account is unlocked, the workflow will install dependencies, upgrade an empty PostgreSQL database, run backend tests and compilation, and run frontend lint, tests and build.

## Deployment Decision

The branch is ready for code review and integration. The backend is not yet genuinely production-verified: unlock GitHub Actions, obtain a green PostgreSQL CI run, verify deployed CORS and stable secrets, and complete one approved transactional email smoke test before declaring deployment ready.
