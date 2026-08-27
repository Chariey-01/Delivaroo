from app.extensions import db
from app.models.status_history import StatusHistory


VALID_STATUSES = {
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
}

# Maps each status to the set of statuses it may transition into.
# DELIVERED and CANCELLED are terminal — no outgoing transitions.
VALID_TRANSITIONS = {
    "PENDING": {"PICKED_UP", "CANCELLED"},
    "PICKED_UP": {"IN_TRANSIT", "CANCELLED"},
    "IN_TRANSIT": {"OUT_FOR_DELIVERY", "CANCELLED"},
    "OUT_FOR_DELIVERY": {"DELIVERED", "CANCELLED"},
    "DELIVERED": set(),
    "CANCELLED": set(),
}


class InvalidStatusError(ValueError):
    """Raised when a status is not a recognised value."""


class InvalidStatusTransitionError(ValueError):
    """Raised when a status change does not follow the allowed flow."""


def record_status_change(parcel, new_status, changed_by_id, latitude=None, longitude=None, notes=None):
    """
    Validates and applies a status transition on a parcel, then appends
    an audit row to status_history. Commits the transaction.

    Raises InvalidStatusError if new_status is not a recognised status.
    Raises InvalidStatusTransitionError if the transition is not allowed
    from the parcel's current status.
    """
    if new_status not in VALID_STATUSES:
        raise InvalidStatusError(f"'{new_status}' is not a valid parcel status")

    current_status = parcel.status
    allowed_next = VALID_TRANSITIONS.get(current_status, set())

    if new_status not in allowed_next:
        raise InvalidStatusTransitionError(
            f"Cannot transition parcel from '{current_status}' to '{new_status}'"
        )

    parcel.status = new_status

    entry = StatusHistory(
        parcel_id=parcel.id,
        changed_by=changed_by_id,
        status=new_status,
        latitude=latitude,
        longitude=longitude,
        notes=notes,
    )
    db.session.add(entry)
    db.session.commit()
    return entry


def record_location_change(parcel, latitude, longitude, changed_by_id, notes=None):
    """
    Records a location-only update for a parcel: updates present_latitude/
    present_longitude and appends an audit row to status_history using the
    parcel's current status (status itself is unchanged). Commits the
    transaction.
    """
    parcel.present_latitude = latitude
    parcel.present_longitude = longitude

    entry = StatusHistory(
        parcel_id=parcel.id,
        changed_by=changed_by_id,
        status=parcel.status,
        latitude=latitude,
        longitude=longitude,
        notes=notes,
    )
    db.session.add(entry)
    db.session.commit()
    return entry

def record_destination_change(parcel, old_address, new_address, changed_by_id):
    """
    Records a destination update for a parcel as a StatusHistory audit row.
    Does not alter parcel.status. Commits the transaction.
    """
    entry = StatusHistory(
        parcel_id=parcel.id,
        changed_by=changed_by_id,
        status=parcel.status,
        notes=f"Destination updated from '{old_address}' to '{new_address}'",
    )
    db.session.add(entry)
    db.session.commit()
    return entry
