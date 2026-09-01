import uuid

from app.extensions import db


class Address(db.Model):
    __tablename__ = "addresses"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    label = db.Column(
        db.String(100),
    )

    address_line = db.Column(
        db.String(255),
        nullable=False,
    )

    city = db.Column(
        db.String(100),
        nullable=False,
    )

    latitude = db.Column(
        db.Numeric(10, 7),
    )

    longitude = db.Column(
        db.Numeric(10, 7),
    )

    is_default = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
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

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "label": self.label,
            "address_line": self.address_line,
            "city": self.city,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
