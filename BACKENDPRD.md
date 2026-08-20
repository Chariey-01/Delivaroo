# DELIVEROO —> Backend PRD

**Version:** 1.0
**Project:** DELIVEROO 
**Backend:** Python + Flask
**Database:** PostgreSQL
**API:** RESTful API
**ORM:** SQLAlchemy
**Authentication:** JWT
**Migration:** Flask-Migrate / Alembic
**Testing:** Pytest
**API Resources:** Flask-RESTful Resources
**Architecture:** Modular Flask application using the Application Factory pattern

---

## 1. Backend Objective

The backend will provide a secure REST API that manages:

* User registration and authentication
* User profiles
* Saved addresses
* Parcel creation and management
* Parcel pricing
* Parcel tracking
* Parcel status history
* Parcel cancellation
* Destination updates
* Administrative parcel management
* Notifications
* Notification preferences
* Authentication token lifecycle
* Password recovery
* Audit logging

The backend must expose clearly defined APIs that the React frontend can consume.

---

## 2. User Roles

### Regular User

A regular user can:

* Register
* Login
* View/update profile
* Manage addresses
* Create parcels
* View their parcels
* View parcel details
* Track parcel status
* Update destination before delivery
* Cancel eligible parcels
* Receive notifications
* Manage notification preferences
* Logout

### Administrator

An administrator can:

* Login
* View all users where required
* View all parcels
* View individual parcel details
* Update parcel status
* Update parcel present location
* View status history
* Trigger/produce notifications
* View relevant audit information

> **Security requirement:** Authorization must be enforced on the backend. Administrators must not bypass authorization through frontend manipulation.

---

## 3. Core Database Models

The initial backend data model will contain:

* `User`
* `Profile`
* `Address`
* `Parcel`
* `WeightCategory`
* `StatusHistory`
* `Notification`
* `NotificationPreference`
* `AuditLog`
* `RefreshToken`
* `PasswordResetToken`

Each model must have:

* Primary key
* Appropriate foreign keys
* Appropriate constraints
* Timestamps where relevant
* Relationships
* Validation
* Appropriate indexes where useful

---

## 4. User Model

### Purpose

Stores authentication and account-level information.

### Fields

* `id`
* `email`
* `password_hash`
* `role`
* `is_active`
* `created_at`
* `updated_at`

### Requirements

* Email must be unique.
* Password must never be stored in plaintext.
* Passwords must be securely hashed.
* Role must be validated.
* Inactive users must not authenticate.
* Email should be normalized before storage.

### Relationships

```text
User 1 ─── 1 Profile
User 1 ─── * Address
User 1 ─── * Parcel
User 1 ─── * Notification
User 1 ─── * RefreshToken
User 1 ─── * PasswordResetToken
User 1 ─── * AuditLog
```

---

## 5. Profile

### Purpose

Stores user-facing profile information separately from authentication credentials.

### Fields

* `id`
* `user_id`
* `full_name`
* `phone`
* `profile_image`
* `created_at`
* `updated_at`

### Relationship

```text
User 1 ─── 1 Profile
```

---

## 6. Address

### Purpose

Allows users to save commonly used addresses.

### Fields

* `id`
* `user_id`
* `label`
* `address_line`
* `city`
* `latitude`
* `longitude`
* `is_default`
* `created_at`
* `updated_at`

### Requirements

Users can:

* Create an address
* View their addresses
* Update an address
* Delete an address
* Set an address as default

A user must not be able to access another user's addresses.

---

## 7. WeightCategory

### Purpose

Defines parcel weight categories and their pricing configuration.

### Examples

* Light
* Medium
* Heavy

### Fields

* `id`
* `name`
* `min_weight`
* `max_weight`
* `base_price`
* `price_per_km`
* `created_at`
* `updated_at`

### Relationship

```text
WeightCategory 1 ─── * Parcel
```

---

## 8. Parcel

The parcel is the core business entity.

### Fields

* `id`
* `tracking_number`
* `user_id`
* `weight_category_id`
* `pickup_address`
* `pickup_latitude`
* `pickup_longitude`
* `destination_address`
* `destination_latitude`
* `destination_longitude`
* `present_latitude`
* `present_longitude`
* `status`
* `price`
* `distance`
* `duration`
* `created_at`
* `updated_at`

### Requirements

When a parcel is created:

1. Validate the authenticated user.
2. Validate pickup information.
3. Validate destination.
4. Validate weight category.
5. Calculate price.
6. Generate a unique tracking number.
7. Set the initial status.
8. Create the parcel.
9. Create an initial status-history record.
10. Trigger the appropriate notification.

---

## 9. Parcel Status

The backend should maintain a controlled set of statuses.

### Statuses

* `PENDING`
* `PICKED_UP`
* `IN_TRANSIT`
* `OUT_FOR_DELIVERY`
* `DELIVERED`
* `CANCELLED`

### Valid Status Flow

```text
PENDING
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Status transitions must be validated.

For example, a delivered parcel cannot simply be changed back to `PENDING`.

---

## 10. Parcel Update

A user can update the destination only when the parcel is eligible.

### Requirements

* User must be authenticated.
* User must own the parcel.
* Parcel must not be delivered.
* Parcel must not be cancelled.
* New destination must be validated.
* Relevant price/distance information must be recalculated where applicable.
* The action must be recorded in the audit system.

---

## 11. Parcel Cancellation

A user can cancel their own parcel if it is eligible.

### Validation Flow

```text
Authenticated?
       ↓
Owns parcel?
       ↓
Parcel cancellable?
       ↓
Cancel
```

A delivered parcel cannot be cancelled.

### Cancellation Actions

The cancellation should:

1. Update the parcel status.
2. Create a `StatusHistory` record.
3. Create a `Notification`.
4. Create an `AuditLog`.

---

## 12. StatusHistory

### Purpose

Maintains the history of parcel movement and status changes.

### Fields

* `id`
* `parcel_id`
* `changed_by`
* `status`
* `latitude`
* `longitude`
* `notes`
* `created_at`

### Relationships

```text
Parcel 1 ─── * StatusHistory
User   1 ─── * StatusHistory
```

The system must never overwrite historical events.

For example:

```text
PENDING
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
```

must remain recorded as separate history records.

---

## 13. Admin Status Management

Only administrators can update parcel status.

### Endpoint Responsibilities

* Authorization
* Status validation
* Valid transition validation
* `StatusHistory` creation
* `Notification` creation
* `AuditLog` creation

---

## 14. Admin Location Management

Administrators can update the parcel's current location.

The API must validate:

* Latitude
* Longitude

Every location change should be recorded.

---

## 15. Admin Parcel Management

Administrators can:

* List all parcels
* View individual parcels
* Filter parcels
* Paginate results
* Update status
* Update present location
* View status history

Regular users must only see their own parcels.

---

## 16. Notifications

### Purpose

Provide users with updates about their parcels.

### Notification Types

* `PARCEL_CREATED`
* `STATUS_CHANGED`
* `LOCATION_CHANGED`
* `PARCEL_CANCELLED`
* `PARCEL_DELIVERED`

### Channels

* `IN_APP`
* `EMAIL`

### Fields

* `id`
* `user_id`
* `parcel_id`
* `type`
* `title`
* `message`
* `channel`
* `is_read`
* `sent_at`
* `created_at`

---

## 17. Notification Preferences

Users should be able to control their notification preferences.

### Fields

* `id`
* `user_id`
* `email_enabled`
* `status_updates`
* `location_updates`
* `parcel_updates`
* `created_at`
* `updated_at`

### Relationship

```text
User 1 ─── 1 NotificationPreference
```

---

## 18. AuditLog

### Purpose

Tracks important system actions for accountability and security.

### Example

```text
Admin updated parcel status
```

### Fields

* `id`
* `user_id`
* `action`
* `entity_type`
* `entity_id`
* `old_value`
* `new_value`
* `ip_address`
* `created_at`

### Operations to Record

The system should record important operations such as:

* Status changes
* Location updates
* Parcel cancellation
* Destination updates
* Administrative actions

---

## 19. JWT Authentication

The backend will use JWT authentication.

### Required Operations

| Method | Endpoint         | Purpose                 |
| ------ | ---------------- | ----------------------- |
| POST   | `/auth/register` | Register a user         |
| POST   | `/auth/login`    | Authenticate a user     |
| POST   | `/auth/refresh`  | Refresh an access token |
| POST   | `/auth/logout`   | Logout/revoke token     |
| GET    | `/auth/me`       | Get authenticated user  |

### Authentication Requirements

Authentication must include:

* Password hashing
* Access tokens
* Refresh tokens
* Token expiration
* Token revocation where applicable
* Protected endpoints
* Role-based authorization

---

## 20. Password Recovery

### Flow

```text
Forgot Password
       ↓
Request reset
       ↓
Generate secure token
       ↓
Send email
       ↓
User submits new password
       ↓
Invalidate token
```

### PasswordResetToken Fields

* `id`
* `user_id`
* `token_hash`
* `expires_at`
* `used_at`
* `created_at`

Tokens must:

* Expire after a defined period.
* Be securely generated.
* Be stored as hashes.
* Not be reusable.

---

## 21. API Structure

The project will use Flask-RESTful Resources rather than putting everything into large controller files.

### Resources

```text
resources/
├── auth.py
├── users.py
├── profiles.py
├── addresses.py
├── parcels.py
├── notifications.py
└── admin.py
```

### Services

Business logic should be separated into services:

```text
services/
├── auth_service.py
├── parcel_service.py
├── pricing_service.py
├── notification_service.py
└── tracking_service.py
```

This prevents API resources from becoming large files containing database logic, validation, business rules, and email logic all mixed together.

---

## 22. Backend Structure

The target project structure is approximately:

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── extensions.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── address.py
│   │   ├── parcel.py
│   │   ├── weight_category.py
│   │   ├── status_history.py
│   │   ├── notification.py
│   │   ├── notification_preference.py
│   │   ├── audit_log.py
│   │   ├── refresh_token.py
│   │   └── password_reset_token.py
│   │
│   ├── resources/
│   │   ├── auth.py
│   │   ├── profiles.py
│   │   ├── addresses.py
│   │   ├── parcels.py
│   │   ├── notifications.py
│   │   └── admin.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── parcel_service.py
│   │   ├── pricing_service.py
│   │   ├── notification_service.py
│   │   └── tracking_service.py
│   │
│   └── utils/
│       ├── decorators.py
│       ├── validators.py
│       └── tracking.py
│
├── tests/
│
├── migrations/
├── seed.py
├── run.py
├── requirements.txt
└── .env.example
```

---

## 23. API Design Principles

All endpoints should:

* Return JSON.
* Use appropriate HTTP status codes.
* Validate input.
* Validate authorization.
* Return consistent response structures.
* Never expose passwords or password hashes.
* Never expose sensitive authentication information.
* Handle errors consistently.

### Success Response Example

```json
{
  "message": "Parcel created successfully",
  "data": {
    "tracking_number": "SD123456"
  }
}
```

### Error Response Example

```json
{
  "message": "You are not authorized to update this parcel"
}
```

---

## 24. Testing Requirements

Every backend feature must have tests.

Testing should verify both functionality and security.

We should not only test:

> "Does the endpoint work?"

We should also test:

> "Can someone misuse the endpoint?"

### Required Test Cases

* User can register.
* Duplicate email is rejected.
* User can login.
* Invalid password is rejected.
* User can create a parcel.
* User can view their own parcel.
* User cannot view another user's parcel.
* User can cancel an eligible parcel.
* User cannot cancel a delivered parcel.
* User cannot update another user's parcel.
* Non-admin cannot change parcel status.
* Admin can change parcel status.
* Status history is created.
* Notification is generated.

Backend authorization and misuse testing are particularly important for the project.

---

## 25. Backend Git Strategy

This section corrects the previous Git workflow plan.

### Branch Structure

```text
main
```

**Production/stable code.**

Nobody develops directly on `main`.

```text
main
  ↑
develop
```

`develop` is the integration branch.

Feature branches are created from `develop`.

### Feature Branch Examples

```text
feature/backend-setup
feature/auth
feature/profile
feature/address
feature/parcel-crud
feature/status-history
feature/parcel-cancel
feature/parcel-update
feature/admin-status
feature/admin-location
feature/admin-parcels
feature/notifications
feature/audit-log
feature/token-management
```

### Workflow

```text
develop
   ↓
feature/your-feature
   ↓
commit
   ↓
push
   ↓
Pull Request
   ↓
develop
   ↓
integration testing
   ↓
main
```

### Branch Responsibilities

| Branch      | Purpose                        |
| ----------- | ------------------------------ |
| `main`      | Production/stable code         |
| `develop`   | Integration branch             |
| `feature/*` | Individual feature development |

Nobody should push feature development directly to `main`.

---

## 26. Conventional Commits

Commits should be meaningful and descriptive.

### Avoid

```text
update
final
changes
fixed stuff
done
```

### Use Conventional Commits

```text
feat: add user model
feat: implement user registration
feat: add jwt login
feat: add parcel creation endpoint
feat: add parcel status history
fix: prevent cancellation of delivered parcels
test: add parcel authorization tests
refactor: move parcel logic into service
chore: configure flask migrate
docs: document authentication endpoints
```

### Commit Type Guide

| Type       | Purpose                                    |
| ---------- | ------------------------------------------ |
| `feat`     | Add a new feature                          |
| `fix`      | Fix a bug                                  |
| `test`     | Add or modify tests                        |
| `refactor` | Restructure code without changing behavior |
| `chore`    | Maintenance/configuration                  |
| `docs`     | Documentation changes                      |

---

## Backend Development Principles

The backend implementation should prioritize:

1. **Security** — authentication, authorization, password protection, and secure token management.
2. **Data integrity** — relationships, constraints, validation, and immutable history.
3. **Separation of concerns** — resources handle HTTP concerns while services handle business logic.
4. **Testability** — every feature must include positive and negative authorization tests.
5. **Maintainability** — modular architecture and meaningful commits.
6. **API consistency** — predictable JSON responses, HTTP status codes, and error handling.
7. **Scalability** — pagination, indexing, service separation, and clean application architecture.
