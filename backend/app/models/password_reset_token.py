from uuid import uuid4

from app.extensions import db


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    token_hash = db.Column(
        db.String(255),
        nullable=False,
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    used_at = db.Column(
        db.DateTime,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )