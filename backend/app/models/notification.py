from uuid import uuid4

from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid4)
    recipient_user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    actor_user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    parcel_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("parcels.id"), nullable=True, index=True)
    event_type = db.Column(db.String(80), nullable=False, index=True)
    title = db.Column(db.String(180), nullable=False)
    message = db.Column(db.Text, nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)
    entity_id = db.Column(db.UUID(as_uuid=True), nullable=True)
    metadata_json = db.Column(db.JSON, nullable=True)
    idempotency_key = db.Column(db.String(255), nullable=False, unique=True)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    deliveries = db.relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "event_type": self.event_type,
            "title": self.title,
            "message": self.message,
            "parcel_id": str(self.parcel_id) if self.parcel_id else None,
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id) if self.entity_id else None,
            "metadata": self.metadata_json or {},
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
