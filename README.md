# DELIVEROO

A full-stack parcel delivery management system that allows users to create, track, update, and manage parcel deliveries while providing administrators with tools to manage orders, update delivery status, and monitor parcel locations.

## Project Overview

DELIVEROO  is a team-based full-stack software engineering project focused on building a reliable parcel delivery platform.

The application provides:

* User registration and authentication
* JWT-based authorization
* Parcel creation and management
* Automatic parcel pricing
* Unique parcel tracking numbers
* Parcel status tracking
* Destination updates
* Parcel cancellation
* Administrative parcel management
* Delivery location tracking
* Google Maps integration
* Distance and duration information
* Automated testing
* Continuous Integration
* Production deployment

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* React Router
* Redux Toolkit
* Fetch API
* Google Maps JavaScript API

### Backend

* Python
* Flask
* Flask-RESTful
* SQLAlchemy
* Flask-Migrate
* PostgreSQL
* JWT Authentication
* Werkzeug/Bcrypt password hashing

### Testing

* Jest
* React Testing Library
* pytest

### DevOps

* GitHub
* GitHub Actions
* Vercel/Netlify
* Render/Railway
* PostgreSQL

## Repository Structure

```text
Delivaroo/
├── backend/                  Flask API
│   ├── app/
│   │   ├── models/           SQLAlchemy models (user, parcel, tokens, ...)
│   │   ├── resources/        Flask-RESTful endpoints (auth, parcel, admin, ...)
│   │   ├── services/         Business logic (auth, pricing, email, notifications)
│   │   └── utils/            Hashing and shared helpers
│   ├── migrations/           Alembic migrations
│   ├── tests/                pytest suite
│   ├── run.py                Dev entry point
│   └── seed.py               Idempotent demo-data seeder
│
├── frontend/                 React + Vite client
│   └── src/
│       ├── api/              HTTP client, endpoint modules, mock backend
│       ├── components/       auth, booking, admin, maps, orders, tracking, ui
│       ├── hooks/            Reusable behaviour (forms, viewport, booking gate)
│       ├── lib/              Pure helpers (validators, pricing, token storage)
│       ├── routes/           One file per route, plus the shared AppLayout
│       ├── store/            Redux Toolkit slices
│       ├── styles/           global.css — the one stylesheet
│       └── __tests__/        Jest + React Testing Library
│
└── docs/                     API contract, deployment, project brief, QA notes
```

## Getting Started

### Prerequisites

* Node.js 18+ and npm
* Python 3.10+
* PostgreSQL

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then fill in the values
flask --app run:app db upgrade                      # apply migrations
python run.py                                       # serves on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local                          # then fill in the values
npm run dev                                         # serves on http://localhost:5173
```

`vite.config.js` proxies `/api` to the Flask dev server, so leave `VITE_API_URL`
blank locally and the two run side by side with no CORS setup.

To work on the frontend without a running backend, start it against the bundled
fixtures instead:

```bash
VITE_USE_MOCK_BACKEND=true npm run dev
```

### Frontend scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over `src/` |
| `npm test` | Jest + React Testing Library |
| `npm run test:watch` | Jest in watch mode |

## Git Workflow

We use a three-level Git workflow:

```text
main
  │
  └── develop
        │
        ├── feature/auth
        ├── feature/parcel-crud
        ├── feature/parcel-update
        ├── feature/parcel-cancel
        ├── feature/maps
        └── feature/admin-dashboard
```

### Branches

**main**

The stable production branch.

**develop**

The integration branch where completed features are merged and tested before production.

**feature/***

Individual branches used for specific features.

Examples:

```text
feature/auth
feature/parcel-crud
feature/parcel-update
feature/parcel-cancel
feature/status-history
feature/admin-status
feature/admin-location
feature/maps
feature/admin-dashboard
feature/testing-infrastructure
```

## Pull Request Workflow

1. Create or switch to the appropriate feature branch.
2. Implement the feature.
3. Test the feature locally.
4. Commit using meaningful Conventional Commit messages.
5. Push the feature branch.
6. Open a Pull Request into `develop`.
7. Request a review.
8. Address review feedback.
9. Ensure CI checks pass.
10. Merge into `develop`.

Direct pushes to `main` are not allowed.

## Commit Convention

We use Conventional Commit-style messages.

Examples:

```text
feat: add parcel creation endpoint
fix: prevent cancellation of delivered parcels
test: add parcel creation tests
docs: update API documentation
refactor: extract parcel pricing service
chore: configure environment variables
ci: add backend test workflow
```

Commits should represent meaningful changes. Do not create meaningless commits simply to increase the commit count.

## Core Features

### Authentication

* User signup and login
* JWT access/refresh tokens, with transparent refresh on expiry
* Role-based authorization
* Protected routes, returning the user to where they were headed after signing in
* Password reset by emailed single-use token (expires after 30 minutes)
* Password change for a signed-in user

The sign-in, registration, password-recovery and password-reset screens share one
split-screen layout (`components/auth/AuthCard`) and one form hook
(`hooks/useAuthForm`), so they validate, fail and recover identically. Notable
behaviour:

* Fields report errors on blur, then re-check on every keystroke — so a mistake is
  named once it is finished, and clears the moment it is fixed.
* The password strength meter marks only the rules the server actually enforces as
  required. `lib/passwordStrength.js` mirrors `PASSWORD_MIN_LENGTH` in
  `backend/app/resources/auth.py`; the rest are shown as advice.
* "Remember me" chooses the store: ticked keeps the session in `localStorage`,
  cleared confines it to `sessionStorage` so it dies with the tab.
* Sign-in failures and the forgot-password confirmation are worded so they never
  reveal whether an email address has an account.

### Parcel Management

* Create parcel
* View parcels
* View parcel details
* Update destination
* Cancel parcel
* Generate tracking number
* Calculate parcel price

### Administration

* View all parcels
* Update parcel status
* Update present parcel location
* Track status/location history

### Maps

* Pickup marker
* Destination marker
* Present location
* Route visualization
* Distance
* Estimated duration

## Frontend Conventions

A few rules the frontend holds to, worth knowing before adding to it:

* **`src/theme.js` is the single source of design tokens** — colour, type, radius,
  shadow, control and hover styles. Components spread these rather than restating a
  hex or a radius that would drift the moment one of them changed.
* **Styling is inline, with `src/styles/global.css` as the escape hatch.** Inline
  styles cannot express a media query, a `:focus-within`, a `::before` or a
  `@keyframes`, so exactly those live in the stylesheet — everything else stays with
  the component that owns it.
* **980px is the one breakpoint the layout asks about** (`hooks/useNarrowViewport`).
  Below it the top nav collapses into the hamburger, the fixed bottom bar appears,
  and the hero switches from a full-bleed photograph to a banded one.
* **Anything fixed over the fold has to be paid for.** The bottom bar overlays the
  last `BOTTOM_NAV_HEIGHT` pixels of the viewport, so full-height sections reserve
  that strip — otherwise controls sitting on their bottom edge become untappable.
* **The API is reached only through `src/api/`.** Nothing imports `mockBackend` or
  `client` directly, which is what makes `VITE_USE_MOCK_BACKEND` a one-line switch.

## Testing

Each developer is responsible for testing the features they implement.

The project also includes integration and smoke testing to verify that the
application works correctly as a complete system.

```bash
cd frontend && npm test            # Jest + React Testing Library
cd backend  && python -m pytest    # pytest
```

The frontend suite mounts the real store, the real route table and the real route
guards, stubbing only `fetch` — so a broken reducer, selector or guard fails here
rather than in the browser. `src/__tests__/testUtils.jsx` is the single place the
backend contract is described.

Suites are grouped by what they answer:

| Path | Question it answers |
|---|---|
| `__tests__/smoke/` | Does the app stand up and does every public route render? |
| `__tests__/integration/` | Do signup, login, guards and password recovery work end to end? |
| `__tests__/*.test.js(x)` | Does this unit — slice, helper, component — behave? |

Example end-to-end flow:

```text
Signup
   ↓
Login
   ↓
Create Parcel
   ↓
View Parcel
   ↓
Update / Cancel Parcel
   ↓
Admin Updates Status
   ↓
User Sees Updated Status
```

## Environment Variables

Sensitive values must never be committed to GitHub.

Each side of the project has its own `.env.example` listing the names — and only the
names — that it needs. Copy them and fill in the values locally.

**Backend** (`backend/.env`, from `.env.example`):

```text
FLASK_ENV=development
SECRET_KEY=
JWT_SECRET_KEY=
DATABASE_URL=postgresql://user:password@localhost:5432/delivaroo_db
CORS_ORIGINS=http://localhost:5173
SMTP_HOST=                      # password-reset email delivery
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_SENDER_EMAIL=
PASSWORD_RESET_URL=http://localhost:5173/reset-password
```

**Frontend** (`frontend/.env.local`, from `.env.example`):

```text
VITE_API_URL=                   # blank locally: the Vite proxy forwards /api
VITE_API_PROXY=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=       # browser key, restricted by HTTP referrer
VITE_USE_MOCK_BACKEND=          # "true" runs the UI against bundled fixtures
```

Restrict the browser Maps key by HTTP referrer, and use a separate server-restricted
key for backend geocoding requests.

Never commit:

```text
.env
.env.local
```

## Demo Data

From `backend`, seed the local admin-dashboard dataset after migrations have run:

```bash
python seed.py
```

The command is idempotent and creates 94 fictional parcels, a demo administrator,
and regular demo users at the reserved `demo.delivaroo.test` domain. The demo admin
email defaults to `admin@demo.delivaroo.test`. Set `DEMO_ADMIN_EMAIL`,
`DEMO_ADMIN_PASSWORD`, and `DEMO_USER_PASSWORD` in the local backend `.env` file
to choose credentials; the seed command never prints either password.

To replace only records created by the demo seed, use:

```bash
python seed.py --reset-demo-data
```

The reset command refuses to run when `FLASK_ENV=production`.

## Documentation

| Document | Contents |
|---|---|
| [docs/api-contract.md](docs/api-contract.md) | Endpoint shapes the frontend and backend agree on |
| [docs/deployment.md](docs/deployment.md) | Render + Vercel build, env, migration and verification steps |
| [docs/PROJECT-BRIEF.md](docs/PROJECT-BRIEF.md) | Scope, decisions and project narrative |
| [BACKENDPRD.md](BACKENDPRD.md) | Backend product requirements, referenced by section (§) throughout the code |

## Deployment

Deploy the Flask API to Render and the Vite frontend to Vercel. The exact build
commands, environment variables, migration step, CORS setup, and verification
checks are documented in [docs/deployment.md](docs/deployment.md).

## Development Timeline

### Week 1 — Foundation

* UI design
* Database design
* Repository setup
* Git workflow
* Project/task allocation
* CI/CD setup
* Initial deployment

### Week 2 — Development

* Automated testing
* React features
* Flask features
* Frontend/backend integration
* Pull Requests
* Code reviews

### Week 3 — Completion & Presentation

* Complete feature development
* Integration testing
* Bug fixing
* Deployment verification
* Documentation
* Slide preparation
* Mock presentation
* Final presentation

## Team

| Member | Role | GitHub Profile |
|---|---|---|
| Charity Jepkoech | Backend Lead | [GitHub](https://github.com/Chariey-01) |
| Darren Amore | Backend Developer | [GitHub](https://github.com/Dazed31) |
| Bruce Mwendwa | Frontend Lead | [GitHub](GITHUB_PROFILE_URL) |
| Bhoke Mwita | Frontend Developer | [GitHub](GITHUB_PROFILE_URL) |
| Clyde Bichanga | QA / UI / DevOps | [GitHub](GITHUB_PROFILE_URL) |

## Project Management

Project tasks and sprint progress are managed through ClickUp.

The team follows Scrum practices including:

* Daily stand-ups
* Evening progress check-ins
* Sprint planning
* Task ownership
* Blocker reporting
* Code reviews
* Continuous testing

## Security

The project must follow basic security practices:

* Passwords must be hashed.
* JWT secrets must be stored in environment variables.
* API keys must not be committed.
* Authentication and authorization must be enforced on protected endpoints.
* User-owned resources must be protected from unauthorized access.
* Input must be validated on both frontend and backend.

## License

This project is developed as Capstone project For Group 8.
