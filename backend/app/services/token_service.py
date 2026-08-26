from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from app.extensions import db
from app.models.refresh_token import RefreshToken


REFRESH_TOKEN_EXPIRES_DAYS = 7


def _hash_token(token: str) -> str:
    """Return a SHA-256 hash of a refresh token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


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


def revoke_refresh_token(raw_token: str) -> None:
    """Revoke a refresh token."""

    token_hash = _hash_token(raw_token)

    refresh_token = (
        db.session.query(RefreshToken)
        .filter_by(token_hash=token_hash)
        .first()
    )

    if refresh_token and refresh_token.revoked_at is None:
        refresh_token.revoked_at = datetime.now(timezone.utc)
        db.session.commit()
