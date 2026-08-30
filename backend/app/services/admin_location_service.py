import uuid

from app.services.status_history_service import record_location_change


class ParcelLocationLockedError(Exception):
    """Raised when a terminal parcel cannot have its location updated."""
    """Raised when the parcel is delivered or cancelled and cannot have its location updated."""


class InvalidLocationError(ValueError):
    """Raised when the address or coordinates fail validation."""


def admin_update_location(parcel, latitude, longitude, address=None, admin_id=None):
    """Update a parcel's present location and record the location change."""

    if isinstance(admin_id, str):
        admin_id = uuid.UUID(admin_id)

    """
    Updates a parcel's present location as an admin action. Validates
    coordinates, rejects the update if the parcel is delivered or
    cancelled, and records the change in StatusHistory via
    record_location_change().
    """
    if parcel.status in ("DELIVERED", "CANCELLED"):
        raise ParcelLocationLockedError(
            f"Cannot update location for a parcel with status '{parcel.status}'"
        )

    if latitude is None or longitude is None:
        raise InvalidLocationError("Latitude and longitude are required")

    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        raise InvalidLocationError("Latitude and longitude must be valid numbers")

    if not -90 <= lat <= 90:
        raise InvalidLocationError("Latitude must be between -90 and 90")

    if not -180 <= lon <= 180:
        raise InvalidLocationError("Longitude must be between -180 and 180")

    notes = (
        f"Location updated to {address}"
        if address
        else "Present location updated by admin"
    )

    return record_location_change(
        parcel=parcel,
        latitude=lat,
        longitude=lon,
        changed_by_id=admin_id,
        notes=notes,
    )
