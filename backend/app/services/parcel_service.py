import secrets
import string
from decimal import Decimal, InvalidOperation
from uuid import UUID

from app.extensions import db
from app.models.parcel import Parcel
from app.models.user import User
from app.models.weight_category import WeightCategory
from app.models.transport import TRANSPORT_MODES


class ParcelNotFoundError(ValueError):
    """Raised when a parcel is not visible to the requesting user."""


def _parse_uuid(value, field_name):
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        raise ValueError(f"Invalid {field_name}") from None


def _parse_decimal(value, field_name):
    if value is None or value == "":
        return None

    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"Invalid {field_name}") from None

    return parsed


def _parse_int(value, field_name):
    if value is None or value == "":
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid {field_name}") from None

    return parsed


def _validate_coordinate(value, field_name, minimum, maximum):
    parsed = _parse_decimal(value, field_name)

    if parsed is not None and not minimum <= parsed <= maximum:
        raise ValueError(f"Invalid {field_name}")

    return parsed


def generate_tracking_number() -> str:
    """Generate a unique parcel tracking number."""

    alphabet = string.ascii_uppercase + string.digits

    while True:
        tracking_number = "DLV-" + "".join(
            secrets.choice(alphabet) for _ in range(10)
        )

        if not Parcel.query.filter_by(
            tracking_number=tracking_number
        ).first():
            return tracking_number


def calculate_parcel_price(
    weight_category: WeightCategory,
    distance=None,
):
    """Calculate parcel price on the server."""

    price = Decimal(weight_category.base_price)

    if distance is not None:
        price += Decimal(weight_category.price_per_km) * distance

    return price


def serialize_parcel(parcel: Parcel) -> dict:
    return {
        "id": str(parcel.id),
        "tracking_number": parcel.tracking_number,
        "user_id": str(parcel.user_id),
        "weight_category_id": str(parcel.weight_category_id),
        "transport_mode": parcel.transport_mode,
        "transport_label": TRANSPORT_MODES[parcel.transport_mode],
        "pickup_address": parcel.pickup_address,
        "pickup_latitude": (
            str(parcel.pickup_latitude)
            if parcel.pickup_latitude is not None
            else None
        ),
        "pickup_longitude": (
            str(parcel.pickup_longitude)
            if parcel.pickup_longitude is not None
            else None
        ),
        "destination_address": parcel.destination_address,
        "destination_latitude": (
            str(parcel.destination_latitude)
            if parcel.destination_latitude is not None
            else None
        ),
        "destination_longitude": (
            str(parcel.destination_longitude)
            if parcel.destination_longitude is not None
            else None
        ),
        "present_latitude": (
            str(parcel.present_latitude)
            if parcel.present_latitude is not None
            else None
        ),
        "present_longitude": (
            str(parcel.present_longitude)
            if parcel.present_longitude is not None
            else None
        ),
        "status": parcel.status,
        "price": str(parcel.price),
        "distance": str(parcel.distance) if parcel.distance is not None else None,
        "duration": parcel.duration,
        "created_at": parcel.created_at.isoformat() if parcel.created_at else None,
        "updated_at": parcel.updated_at.isoformat() if parcel.updated_at else None,
    }


def create_parcel(
    *,
    user_id,
    weight_category_id,
    pickup_address,
    pickup_latitude=None,
    pickup_longitude=None,
    destination_address,
    destination_latitude=None,
    destination_longitude=None,
    distance=None,
    duration=None,
    transport_mode="MOTORBIKE",
) -> Parcel:
    """Create and persist a parcel for an authenticated user."""

    user_uuid = _parse_uuid(user_id, "user")
    category_uuid = _parse_uuid(weight_category_id, "weight category")

    user = db.session.get(User, user_uuid)

    if not user or not user.is_active:
        raise ValueError("Authenticated user is invalid")

    if not pickup_address or not str(pickup_address).strip():
        raise ValueError("Pickup address is required")

    if not destination_address or not str(destination_address).strip():
        raise ValueError("Destination address is required")

    weight_category = db.session.get(
        WeightCategory,
        category_uuid,
    )

    if not weight_category:
        raise ValueError("Invalid weight category")

    pickup_latitude = _validate_coordinate(
        pickup_latitude,
        "pickup latitude",
        Decimal("-90"),
        Decimal("90"),
    )
    pickup_longitude = _validate_coordinate(
        pickup_longitude,
        "pickup longitude",
        Decimal("-180"),
        Decimal("180"),
    )
    destination_latitude = _validate_coordinate(
        destination_latitude,
        "destination latitude",
        Decimal("-90"),
        Decimal("90"),
    )
    destination_longitude = _validate_coordinate(
        destination_longitude,
        "destination longitude",
        Decimal("-180"),
        Decimal("180"),
    )
    distance = _parse_decimal(distance, "distance")
    duration = _parse_int(duration, "duration")

    if transport_mode not in TRANSPORT_MODES:
        raise ValueError("Invalid transport mode")

    if distance is not None and distance < 0:
        raise ValueError("Distance cannot be negative")

    if duration is not None and duration < 0:
        raise ValueError("Duration cannot be negative")

    price = calculate_parcel_price(
        weight_category,
        distance,
    )

    parcel = Parcel(
        tracking_number=generate_tracking_number(),
        user_id=user_uuid,
        weight_category_id=category_uuid,
        pickup_address=pickup_address.strip(),
        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,
        destination_address=destination_address.strip(),
        destination_latitude=destination_latitude,
        destination_longitude=destination_longitude,
        distance=distance,
        duration=duration,
        price=price,
        transport_mode=transport_mode,
    )

    db.session.add(parcel)
    # Integrate initial status history/notifications once those features expose
    # a stable creation function for PENDING events.
    db.session.commit()

    return parcel


def list_user_parcels(user_id):
    """Return parcels belonging to the authenticated user, newest first."""

    user_uuid = _parse_uuid(user_id, "user")

    return (
        Parcel.query.filter_by(user_id=user_uuid)
        .order_by(Parcel.created_at.desc(), Parcel.id.desc())
        .all()
    )


def get_visible_parcel(parcel_id, user_id, role):
    """Return a parcel visible to a user, or raise a 404-style error."""

    parcel_uuid = _parse_uuid(parcel_id, "parcel")
    user_uuid = _parse_uuid(user_id, "user")

    parcel = db.session.get(Parcel, parcel_uuid)

    if not parcel:
        raise ParcelNotFoundError("Parcel not found")

    if role == "admin" or parcel.user_id == user_uuid:
        return parcel

    raise ParcelNotFoundError("Parcel not found")
