# API Contract

## Auth

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

Authentication: not required. A valid persisted refresh token is required in the JSON body.

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
  "access_token": "jwt"
}
```

Errors: `400` when the body or refresh token is missing. `401` when the refresh token is invalid, expired, revoked, or belongs to an inactive user. `404` when the token references a missing user.

### POST /auth/logout

Authentication: not required. A valid persisted refresh token is required in the JSON body.

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

Server-controlled fields: `user_id`, `tracking_number`, `status`, and `price`. The API ignores any client-supplied `price`. Price is calculated as `base_price + (price_per_km * distance)` using the selected `WeightCategory`. If `distance` is not supplied, the API does not fabricate one and uses the category base price.

Success: `201`

```json
{
  "message": "Parcel created successfully",
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
  "parcel": {
    "id": "uuid",
    "tracking_number": "DLV-ABC1234567",
    "status": "PENDING",
    "price": "225.00"
  }
}
```

Errors: `401` when the JWT is missing or invalid. `404` when the parcel does not exist, the ID is invalid, or the requesting regular user does not own it.
