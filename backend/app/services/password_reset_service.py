from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from app.extensions import db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.services.token_service import revoke_user_refresh_tokens
from app.utils.security import hash_password


PASSWORD_RESET_EXPIRES_MINUTES = 30


def _hash_token(token: str) -> str:
    """Return a SHA-256 hash of a password-reset token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def create_password_reset_token(user: User) -> str:
    """Create a single usable password-reset token for a user."""

    raw_token = secrets.token_urlsafe(64)
    now = datetime.now(timezone.utc)

    # A newer request supersedes earlier links. This makes a leaked old email link
    # harmless once the account holder asks for another reset.
    outstanding_tokens = (
        db.session.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .all()
    )
    for token in outstanding_tokens:
        token.used_at = now

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=(
            now
            + timedelta(minutes=PASSWORD_RESET_EXPIRES_MINUTES)
        ),
    )

    db.session.add(reset_token)
    db.session.commit()

    return raw_token


def get_valid_password_reset_token(raw_token: str) -> PasswordResetToken:
    """Return a valid, unused, non-expired password-reset token."""

    token_hash = _hash_token(raw_token)

    reset_token = (
        db.session.query(PasswordResetToken)
        .filter_by(token_hash=token_hash)
        .first()
    )

    if not reset_token:
        raise ValueError("Invalid password reset token")

    if reset_token.used_at is not None:
        raise ValueError("Password reset token has already been used")

    if _as_aware_utc(reset_token.expires_at) <= datetime.now(timezone.utc):
        raise ValueError("Password reset token has expired")

    return reset_token


def reset_password(raw_token: str, new_password: str) -> User:
    """Reset a user's password using a valid reset token."""

    reset_token = get_valid_password_reset_token(raw_token)

    user = db.session.get(User, reset_token.user_id)

    if not user:
        raise ValueError("User not found")

    user.password_hash = hash_password(new_password)
    reset_token.used_at = datetime.now(timezone.utc)
    revoke_user_refresh_tokens(user.id)

    db.session.commit()

    return user
