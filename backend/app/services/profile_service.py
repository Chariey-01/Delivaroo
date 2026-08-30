import uuid

from app.extensions import db
from app.models.profile import Profile


class InvalidProfileError(ValueError):
    """Raised when profile input fails validation."""


def _to_uuid(value):
    if isinstance(value, str):
        return uuid.UUID(value)
    return value


def get_profile(user_id):
    """
    Returns the profile for the given user, or None if they haven't
    created one yet.
    """
    user_id = _to_uuid(user_id)
    return Profile.query.filter_by(user_id=user_id).first()


def upsert_profile(user_id, full_name=None, phone=None, profile_image=None):
    """
    Creates the user's profile if it doesn't exist yet, or updates it
    if it does. Only provided fields are changed on update.
    """
    user_id = _to_uuid(user_id)

    if phone is not None and phone.strip() and not _is_valid_phone(phone):
        raise InvalidProfileError("phone must be a valid phone number")

    profile = Profile.query.filter_by(user_id=user_id).first()

    if profile is None:
        profile = Profile(
            user_id=user_id,
            full_name=full_name,
            phone=phone,
            profile_image=profile_image,
        )
        db.session.add(profile)
    else:
        if full_name is not None:
            profile.full_name = full_name
        if phone is not None:
            profile.phone = phone
        if profile_image is not None:
            profile.profile_image = profile_image

    db.session.commit()
    return profile


def _is_valid_phone(phone):
    """Minimal sanity check: digits, spaces, +, -, ( ) only, reasonable length."""
    cleaned = phone.strip()
    if len(cleaned) < 7 or len(cleaned) > 30:
        return False
    allowed = set("0123456789+-() ")
    return all(char in allowed for char in cleaned)
