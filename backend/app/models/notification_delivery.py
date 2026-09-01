from uuid import uuid4

from app.extensions import db


class NotificationDelivery(db.Model):
    __tablename__ = "notification_deliveries"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid4)
    notification_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("notifications.id"), nullable=False, index=True)
    channel = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="PENDING")
    attempt_count = db.Column(db.Integer, nullable=False, default=0)
    provider_reference = db.Column(db.String(255), nullable=True)
    last_error = db.Column(db.String(255), nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    notification = db.relationship("Notification", back_populates="deliveries")
