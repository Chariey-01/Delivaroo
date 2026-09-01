from uuid import uuid4

from sqlalchemy.orm import validates

from app.extensions import db
from app.models.transport import TRANSPORT_MODES


class DeliveryAgent(db.Model):
    __tablename__ = "delivery_agents"
    __table_args__ = (
        db.CheckConstraint(
            "transport_mode IN ('MOTORBIKE', 'TRUCK', 'SHIP', 'AIR')",
            name="ck_delivery_agents_transport_mode",
        ),
    )

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    phone = db.Column(db.String(30), nullable=True)
    transport_mode = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    parcels = db.relationship("Parcel", back_populates="delivery_agent")

    @validates("email")
    def validate_email(self, key, email):
        if not email:
            raise ValueError("Delivery agent email is required")
        return email.strip().lower()

    @validates("transport_mode")
    def validate_transport_mode(self, key, transport_mode):
        if transport_mode not in TRANSPORT_MODES:
            raise ValueError("Invalid transport mode")
        return transport_mode

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "transport_mode": self.transport_mode,
            "transport_label": TRANSPORT_MODES[self.transport_mode],
            "is_active": self.is_active,
        }
