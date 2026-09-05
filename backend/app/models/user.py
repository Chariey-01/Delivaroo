from uuid import uuid4

from sqlalchemy.orm import validates

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"
    VALID_ROLES = {"user", "dispatcher", "admin"}

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
        onupdate=db.func.now(),
    )

    profile = db.relationship("Profile", uselist=False)

    @validates("email")
    def validate_email(self, key, email):
        if not email:
            raise ValueError("Email is required")

        return email.strip().lower()

    @validates("role")
    def validate_role(self, key, role):
        if role not in self.VALID_ROLES:
            raise ValueError("Invalid user role")

        return role
