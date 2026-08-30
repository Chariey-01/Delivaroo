from uuid import uuid4
from datetime import datetime, timezone

from app.extensions import db


class Parcel(db.Model):
    __tablename__ = "parcels"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    tracking_number = db.Column(
        db.String(50),
        nullable=False,
        unique=True,
    )

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    weight_category_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("weight_categories.id"),
        nullable=False,
    )

    pickup_address = db.Column(
        db.String(255),
        nullable=False,
    )

    pickup_latitude = db.Column(
        db.Numeric(10, 7),
    )

    pickup_longitude = db.Column(
        db.Numeric(10, 7),
    )

    destination_address = db.Column(
        db.String(255),
        nullable=False,
    )

    destination_latitude = db.Column(
        db.Numeric(10, 7),
    )

    destination_longitude = db.Column(
        db.Numeric(10, 7),
    )

    present_latitude = db.Column(
        db.Numeric(10, 7),
    )

    present_longitude = db.Column(
        db.Numeric(10, 7),
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="PENDING",
    )

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    distance = db.Column(
        db.Numeric(10, 2),
    )

    duration = db.Column(
        db.Integer,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    status_history = db.relationship(
        "StatusHistory",
        back_populates="parcel",
        cascade="all, delete-orphan",
        order_by="StatusHistory.created_at",
    )
