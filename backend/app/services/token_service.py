from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from app.extensions import db
from app.models.refresh_token import RefreshToken


REFRESH_TOKEN_EXPIRES_DAYS = 7


def _hash_token(token: str) -> str:
    """Return a SHA-256 hash of a refresh token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def create_refresh_token(user_id):
    """Create and persist a refresh token for a user."""

    raw_token = secrets.token_urlsafe(64)

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS),
    )

    db.session.add(refresh_token)
    db.session.commit()

    return raw_token


def get_valid_refresh_token(raw_token: str):
    """Return a valid, non-expired, non-revoked refresh token."""

    token_hash = _hash_token(raw_token)

    refresh_token = (
        db.session.query(RefreshToken)
        .filter_by(token_hash=token_hash)
        .first()
    )

    if not refresh_token:
        raise ValueError("Invalid refresh token")

    if refresh_token.revoked_at is not None:
        raise ValueError("Refresh token has been revoked")

    if _as_aware_utc(refresh_token.expires_at) <= datetime.now(timezone.utc):
        raise ValueError("Refresh token has expired")

    return refresh_token


def revoke_refresh_token(raw_token: str) -> None:
    """Revoke a refresh token."""

    refresh_token = get_valid_refresh_token(raw_token)

    refresh_token.revoked_at = datetime.now(timezone.utc)
    db.session.commit()
