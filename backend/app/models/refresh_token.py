from uuid import uuid4

from app.extensions import db


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"

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
        db.String(500),
        nullable=False,
        unique=True,
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    revoked_at = db.Column(
        db.DateTime,
        db.Boolean,
        nullable=False,
        default=False,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )