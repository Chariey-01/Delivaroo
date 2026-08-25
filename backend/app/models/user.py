from uuid import uuid4

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False,
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="user",
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )