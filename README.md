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

```

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

* User signup
* User login
* JWT authentication
* Role-based authorization
* Protected routes

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

## Testing

Each developer is responsible for testing the features they implement.

The project will also include integration and smoke testing to verify that the application works correctly as a complete system.

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

Use `.env` files locally and provide `.env.example` files containing only the required variable names.

Example:

```text
DATABASE_URL=
JWT_SECRET_KEY=
GOOGLE_MAPS_API_KEY=
```

Never commit:

```text
.env
```

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
