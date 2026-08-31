# API Contract

## Auth

The auth endpoints are available both at `/auth/...` and `/api/auth/...`.

### POST /auth/register

Authentication: not required.

Request JSON:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Success: `201`

```json
{
  "message": "User registered successfully",
  "data": {
    "access_token": "jwt",
    "refresh_token": "opaque-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "is_active": true
    }
  },
  "access_token": "jwt",
  "refresh_token": "opaque-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "is_active": true
  }
}
```

Errors: `400` when the body, email, or password is missing. `409` when the normalized email is already registered.

### POST /auth/login

Authentication: not required.

Request JSON:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Success: `200`

```json
{
  "message": "Login successful",
  "data": {
    "access_token": "jwt",
    "refresh_token": "opaque-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "is_active": true
    }
  },
  "access_token": "jwt",
  "refresh_token": "opaque-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "is_active": true
  }
}
```

Errors: `400` when the body, email, or password is missing. `401` for invalid credentials or inactive accounts.

### POST /auth/refresh

Authentication: not required. A valid persisted refresh token is required in the JSON body or as a bearer token.

Request JSON:

```json
{
  "refresh_token": "opaque-token"
}
```

Success: `200`

```json
{
  "message": "Access token refreshed successfully",
  "data": {
    "access_token": "jwt"
  },
  "access_token": "jwt"
}
```

Errors: `400` when the body or refresh token is missing. `401` when the refresh token is invalid, expired, revoked, or belongs to an inactive user. `404` when the token references a missing user.

### POST /auth/logout

Authentication: not required. A valid persisted refresh token is required in the JSON body or as a bearer token.

Request JSON:

```json
{
  "refresh_token": "opaque-token"
}
```

Success: `200`

```json
{
  "message": "Logout successful"
}
```

Errors: `400` when the body or refresh token is missing. `401` when the refresh token is invalid, expired, or already revoked.

### GET /auth/me

Authentication: JWT access token required.

Success: `200`

```json
{
  "message": "Authenticated user retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "is_active": true
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "is_active": true
  }
}
```

Errors: `401` when the JWT is missing or invalid. `404` when the authenticated user no longer exists or is inactive.

### POST /auth/forgot-password

Authentication: not required.

Request JSON:

```json
{
  "email": "user@example.com"
}
```

Success: `200`

```json
{
  "message": "If the email exists, a password reset link will be sent"
}
```

Errors: `400` when the body or email is missing. The response does not reveal whether an email exists.

### POST /auth/reset-password

Authentication: not required.

Request JSON:

```json
{
  "token": "opaque-token",
  "new_password": "NewPassword123!"
}
```

Success: `200`

```json
{
  "message": "Password reset successfully"
}
```

Errors: `400` when the body, token, or new password is missing, the password is too short, or the reset token is invalid, expired, or already used.

## Parcels

### POST /api/parcels

Authentication: JWT access token required.

Request JSON:

```json
{
  "weight_category_id": "uuid",
  "pickup_address": "123 Pickup St",
  "pickup_latitude": "-1.2921000",
  "pickup_longitude": "36.8219000",
  "destination_address": "456 Destination Ave",
  "destination_latitude": "-1.3000000",
  "destination_longitude": "36.9000000",
  "distance": "12.5",
  "duration": 35
}
```

Server-controlled fields: `user_id`, `tracking_number`, `status`, and `price`. The API ignores any client-supplied `price`. Price is calculated as `base_price + (price_per_km * distance)` using the selected `WeightCategory`. If `distance` is not supplied, the API does not fabricate one and uses the category base price. `transport_mode` accepts `MOTORBIKE`, `TRUCK`, `SHIP`, or `AIR` and defaults to `MOTORBIKE`.

The same endpoint also accepts frontend-friendly aliases: `weightCategoryId`, `pickup: { address, lat, lng }`, `destination: { address, lat, lng }`, `distanceKm`, and `durationSeconds`.

Success: `201`

```json
{
  "message": "Parcel created successfully",
  "data": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING",
    "price": "225.00"
  },
  "parcel": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "user_id": "uuid",
    "weight_category_id": "uuid",
    "pickup_address": "123 Pickup St",
    "pickup_latitude": "-1.2921000",
    "pickup_longitude": "36.8219000",
    "destination_address": "456 Destination Ave",
    "destination_latitude": "-1.3000000",
    "destination_longitude": "36.9000000",
    "present_latitude": null,
    "present_longitude": null,
    "status": "PENDING",
    "price": "225.00",
    "distance": "12.50",
    "duration": 35,
    "created_at": "iso-8601",
    "updated_at": "iso-8601"
  }
}
```

Errors: `400` for missing pickup, missing destination, invalid weight category, invalid coordinates, negative distance, negative duration, or an invalid authenticated user. `401` when the JWT is missing or invalid.

### GET /api/parcels

Authentication: JWT access token required.

Authorization: regular users see only their own parcels. Results are newest first.

Success: `200`

```json
{
  "data": [],
  "parcels": []
}
```

Errors: `401` when the JWT is missing or invalid.

### GET /api/parcels/{id}

Authentication: JWT access token required.

Authorization: parcel owners and admins can view a parcel. Unrelated regular users receive `404`, matching nonexistent parcel behavior so ownership is not leaked.

Success: `200`

```json
{
  "data": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING",
    "price": "225.00"
  },
  "parcel": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING",
    "price": "225.00"
  }
}
```

Errors: `401` when the JWT is missing or invalid. `404` when the parcel does not exist, the ID is invalid, or the requesting regular user does not own it.

### GET /api/parcels/track/{tracking_number}

Authentication: JWT access token required.

Authorization: parcel owners and admins can track a parcel by tracking number. Unrelated regular users receive `404`.

Success: `200`

```json
{
  "data": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING",
    "present_latitude": null,
    "present_longitude": null
  },
  "parcel": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING"
  }
}
```

Errors: `401` when the JWT is missing or invalid. `404` when the parcel does not exist or the requesting regular user does not own it.

### GET /api/parcels/{id}/history

Authentication: JWT access token required.

Authorization: parcel owners and admins can view parcel status history. Unrelated regular users receive `404`.

Success: `200`

```json
{
  "data": [
    {
      "id": "uuid",
      "parcel_id": "uuid",
      "changed_by": "uuid",
      "status": "PICKED_UP",
      "latitude": null,
      "longitude": null,
      "notes": null,
      "created_at": "iso-8601"
    }
  ],
  "history": []
}
```

Errors: `401` when the JWT is missing or invalid. `404` when the parcel does not exist or the requesting regular user does not own it.
# API Contract — Parcel & Admin Endpoints

Documents endpoints owned by the backend parcel-management work
(status history, parcel update, cancellation, admin listing).

## Authentication

All endpoints below require a valid JWT unless noted otherwise, sent as:

Authorization: Bearer <access_token>


Admin-only endpoints additionally require the token's `role` claim to be `"admin"`.

---

## PATCH /api/parcels/:id

Alias: `PATCH /api/parcels/:id/destination`

Update a parcel's destination. Owner only.

**Auth:** required (owner)

**Body:**
```json
{
  "destination_address": "string",
  "destination_latitude": number,
  "destination_longitude": number
}
```

The alias route also accepts `{ "address": "string", "lat": number, "lng": number }` or a nested `destination` object with those fields.

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Updated successfully, returns updated parcel |
| 400 | Invalid destination (missing address, bad coordinates) |
| 403 | Requester does not own the parcel |
| 404 | Parcel not found |
| 409 | Parcel is delivered or cancelled, cannot be updated |

---

## DELETE /parcels/:id

Alias: `PATCH /api/parcels/:id/cancel`

Soft-cancel a parcel (sets status to `CANCELLED`, does not delete the row). Owner only. Idempotent — cancelling an already-cancelled parcel returns 200 with no error.

**Auth:** required (owner)

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Cancelled successfully (or already cancelled — idempotent) |
| 403 | Requester does not own the parcel |
| 404 | Parcel not found |
| 409 | Parcel is already delivered, cannot be cancelled |

---

## GET /admin/parcels

Alias: `GET /api/admin/parcels`

List all parcels across all users. Admin only.

**Auth:** required (role: admin)

**Query parameters:**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | string | none | Filter by exact status (`PENDING`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) |
| `tracking_number` | string | none | Case-insensitive substring search |
| `transport_mode` | string | none | Exact transport filter (`MOTORBIKE`, `TRUCK`, `SHIP`, `AIR`) |
| `page` | integer | 1 | Must be >= 1 |
| `per_page` | integer | 20 | Must be between 1 and 100 |

**Response body:**
```json
{
  "parcels": [
    {
      "id": "uuid",
      "tracking_number": "string",
      "status": "string",
      "price": number,
      "...": "...other Parcel fields",
      "owner": {
        "email": "string"
      }
    }
  ],
  "pagination": {
    "page": number,
    "per_page": number,
    "total_items": number,
    "total_pages": number,
    "has_next": boolean,
    "has_prev": boolean
  }
}
```

## PATCH /admin/parcels/:id/location

Alias: `PATCH /api/admin/parcels/:id/location`

Update a parcel's present location. Admin only.

**Auth:** required (role: admin)

**Body:**
```json
{
  "latitude": number,
  "longitude": number,
  "address": "optional string"
}
```

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Updated successfully, returns updated parcel |
| 400 | Invalid or missing coordinates |
| 403 | Requester is not an admin |
| 404 | Parcel not found |
| 409 | Parcel is delivered or cancelled |

**Known limitation:** `owner` currently only includes `email`. The owner's
name is not yet available because the `profiles` model (per the ERD) has
not been built yet. This will be added once `profiles` exists.

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Invalid filter/pagination parameter |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not an admin |

---

## Parcel Status Values

PENDING -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED


`CANCELLED` is reachable from any non-terminal status. `DELIVERED` and
`CANCELLED` are terminal — no further transitions are allowed from either.
