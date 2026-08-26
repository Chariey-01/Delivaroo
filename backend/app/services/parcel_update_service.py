import uuid

from app.extensions import db
from app.models.weight_category import WeightCategory
from app.utils.geo import haversine_distance_km, estimate_duration_minutes
from app.services.status_history_service import record_destination_change


class ParcelNotFoundError(Exception):
    """Raised when the parcel does not exist."""


class NotParcelOwnerError(Exception):
    """Raised when the requester does not own the parcel."""


class ParcelNotUpdatableError(Exception):
    """Raised when the parcel is delivered or cancelled and cannot be updated."""


class InvalidDestinationError(ValueError):
    """Raised when the new destination fails validation."""


def update_parcel_destination(parcel, requester_id, new_address, new_latitude, new_longitude):
    """
    Updates a parcel's destination if the requester owns it and the parcel
    is in an updatable state (not delivered or cancelled).

    Recalculates distance/duration from pickup to the new destination, and
    recalculates price using the parcel's weight category rates.

    Records the change in StatusHistory. Commits the transaction.
    """
    if isinstance(requester_id, str):
        requester_id = uuid.UUID(requester_id)

    if parcel.user_id != requester_id:
        raise NotParcelOwnerError("You do not own this parcel")

    if parcel.status in ("DELIVERED", "CANCELLED"):
        raise ParcelNotUpdatableError(
            f"Cannot update a parcel with status '{parcel.status}'"
        )

    if not new_address or not new_address.strip():
        raise InvalidDestinationError("Destination address is required")

    if new_latitude is None or new_longitude is None:
        raise InvalidDestinationError("Destination latitude and longitude are required")

    try:
        lat = float(new_latitude)
        lon = float(new_longitude)
    except (TypeError, ValueError):
        raise InvalidDestinationError("Destination latitude and longitude must be valid numbers")

    if not (-90 <= lat <= 90):
        raise InvalidDestinationError("Destination latitude must be between -90 and 90")

    if not (-180 <= lon <= 180):
        raise InvalidDestinationError("Destination longitude must be between -180 and 180")

    old_address = parcel.destination_address

    parcel.destination_address = new_address
    parcel.destination_latitude = lat
    parcel.destination_longitude = lon

    if parcel.pickup_latitude is not None and parcel.pickup_longitude is not None:
        distance_km = haversine_distance_km(
            parcel.pickup_latitude, parcel.pickup_longitude, lat, lon
        )
        parcel.distance = distance_km
        parcel.duration = estimate_duration_minutes(distance_km)

        weight_category = WeightCategory.query.get(parcel.weight_category_id)
        if weight_category:
            base_price = float(weight_category.base_price)
            price_per_km = float(weight_category.price_per_km)
            parcel.price = round(base_price + (price_per_km * distance_km), 2)

    db.session.flush()

    record_destination_change(
        parcel=parcel,
        old_address=old_address,
        new_address=new_address,
        changed_by_id=requester_id,
    )

    return parcel
