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

    def to_dict(self):
        return {
            "id": str(self.id),
            "tracking_number": self.tracking_number,
            "user_id": str(self.user_id),
            "weight_category_id": str(self.weight_category_id),
            "pickup_address": self.pickup_address,
            "pickup_latitude": float(self.pickup_latitude) if self.pickup_latitude is not None else None,
            "pickup_longitude": float(self.pickup_longitude) if self.pickup_longitude is not None else None,
            "destination_address": self.destination_address,
            "destination_latitude": float(self.destination_latitude) if self.destination_latitude is not None else None,
            "destination_longitude": float(self.destination_longitude) if self.destination_longitude is not None else None,
            "present_latitude": float(self.present_latitude) if self.present_latitude is not None else None,
            "present_longitude": float(self.present_longitude) if self.present_longitude is not None else None,
            "status": self.status,
            "price": float(self.price),
            "distance": float(self.distance) if self.distance is not None else None,
            "duration": self.duration,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
