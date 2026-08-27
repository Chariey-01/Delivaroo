from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.user import User
from app.utils.security import hash_password, verify_password
from app.services.token_service import create_refresh_token


def register_user(email: str, password: str) -> User:
    """Create and persist a new user."""

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
    )

    db.session.add(user)
    db.session.commit()

    return user


def authenticate_user(email: str, password: str) -> dict:
    """Authenticate a user and return authentication tokens."""

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password")

    if not user.is_active:
        raise ValueError("User account is inactive")

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
        },
    )

    refresh_token = create_refresh_token(user.id)

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }