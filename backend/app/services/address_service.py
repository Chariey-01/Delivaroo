import uuid

from app.extensions import db
from app.models.address import Address


class AddressNotFoundError(Exception):
    """Raised when the address does not exist."""


class NotAddressOwnerError(Exception):
    """Raised when the requester does not own the address."""


class InvalidAddressError(ValueError):
    """Raised when address input fails validation."""


def _to_uuid(value):
    if isinstance(value, str):
        return uuid.UUID(value)
    return value


def create_address(user_id, address_line, city, label=None, latitude=None, longitude=None, is_default=False):
    """Creates a new address for the given user."""
    user_id = _to_uuid(user_id)

    if not address_line or not address_line.strip():
        raise InvalidAddressError("address_line is required")

    if not city or not city.strip():
        raise InvalidAddressError("city is required")

    if latitude is not None or longitude is not None:
        try:
            lat = float(latitude) if latitude is not None else None
            lon = float(longitude) if longitude is not None else None
        except (TypeError, ValueError):
            raise InvalidAddressError("latitude and longitude must be valid numbers")

        if lat is not None and not (-90 <= lat <= 90):
            raise InvalidAddressError("latitude must be between -90 and 90")
        if lon is not None and not (-180 <= lon <= 180):
            raise InvalidAddressError("longitude must be between -180 and 180")
    else:
        lat = lon = None

    if is_default:
        _unset_existing_default(user_id)

    address = Address(
        user_id=user_id,
        label=label,
        address_line=address_line,
        city=city,
        latitude=lat,
        longitude=lon,
        is_default=is_default,
    )
    db.session.add(address)
    db.session.commit()
    return address


def list_addresses(user_id):
    """Returns all addresses belonging to the given user."""
    user_id = _to_uuid(user_id)
    return Address.query.filter_by(user_id=user_id).order_by(Address.created_at.desc()).all()


def get_address_for_user(address_id, user_id):
    """
    Fetches an address by id and verifies ownership.
    Raises AddressNotFoundError if it doesn't exist, NotAddressOwnerError
    if it exists but belongs to someone else.
    """
    user_id = _to_uuid(user_id)
    address = db.session.get(Address, address_id)

    if not address:
        raise AddressNotFoundError("Address not found")

    if address.user_id != user_id:
        raise NotAddressOwnerError("You do not own this address")

    return address


def update_address(address_id, user_id, **fields):
    """Updates an existing address's fields. Ownership is verified first."""
    address = get_address_for_user(address_id, user_id)

    if "address_line" in fields and fields["address_line"] is not None:
        if not fields["address_line"].strip():
            raise InvalidAddressError("address_line cannot be empty")
        address.address_line = fields["address_line"]

    if "city" in fields and fields["city"] is not None:
        if not fields["city"].strip():
            raise InvalidAddressError("city cannot be empty")
        address.city = fields["city"]

    if "label" in fields:
        address.label = fields["label"]

    if "latitude" in fields and fields["latitude"] is not None:
        try:
            lat = float(fields["latitude"])
        except (TypeError, ValueError):
            raise InvalidAddressError("latitude must be a valid number")
        if not (-90 <= lat <= 90):
            raise InvalidAddressError("latitude must be between -90 and 90")
        address.latitude = lat

    if "longitude" in fields and fields["longitude"] is not None:
        try:
            lon = float(fields["longitude"])
        except (TypeError, ValueError):
            raise InvalidAddressError("longitude must be a valid number")
        if not (-180 <= lon <= 180):
            raise InvalidAddressError("longitude must be between -180 and 180")
        address.longitude = lon

    db.session.commit()
    return address


def delete_address(address_id, user_id):
    """Deletes an address. Ownership is verified first."""
    address = get_address_for_user(address_id, user_id)
    db.session.delete(address)
    db.session.commit()


def set_default_address(address_id, user_id):
    """
    Sets the given address as the user's default, unsetting any
    previous default. Ownership is verified first.
    """
    address = get_address_for_user(address_id, user_id)
    _unset_existing_default(address.user_id)
    address.is_default = True
    db.session.commit()
    return address


def _unset_existing_default(user_id):
    Address.query.filter_by(user_id=user_id, is_default=True).update({"is_default": False})
