# API Contract — Parcel & Admin Endpoints

Documents endpoints owned by the backend parcel-management work
(status history, parcel update, cancellation, admin listing).

## Authentication

All endpoints below require a valid JWT unless noted otherwise, sent as:

Authorization: Bearer <access_token>


Admin-only endpoints additionally require the token's `role` claim to be `"admin"`.

---

## PATCH /parcels/:id

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

List all parcels across all users. Admin only.

**Auth:** required (role: admin)

**Query parameters:**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | string | none | Filter by exact status (`PENDING`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) |
| `tracking_number` | string | none | Case-insensitive substring search |
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
