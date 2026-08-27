from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from app.extensions import db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.utils.security import hash_password


PASSWORD_RESET_EXPIRES_MINUTES = 30


def _hash_token(token: str) -> str:
    """Return a SHA-256 hash of a password-reset token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_password_reset_token(user: User) -> str:
    """Create and persist a password-reset token for a user."""

    raw_token = secrets.token_urlsafe(64)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=(
            datetime.now(timezone.utc)
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

    if reset_token.expires_at <= datetime.now(timezone.utc):
        raise ValueError("Password reset token has expired")

    return reset_token


def reset_password(raw_token: str, new_password: str) -> User:
    """Reset a user's password using a valid reset token."""

    reset_token = get_valid_password_reset_token(raw_token)

    user = User.query.get(reset_token.user_id)

    if not user:
        raise ValueError("User not found")

    user.password_hash = hash_password(new_password)
    reset_token.used_at = datetime.now(timezone.utc)

    db.session.commit()

    return user
