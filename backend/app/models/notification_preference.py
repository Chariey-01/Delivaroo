from uuid import uuid4

from app.extensions import db


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, unique=True)
    email_enabled = db.Column(db.Boolean, nullable=False, default=True)
    sms_enabled = db.Column(db.Boolean, nullable=False, default=False)
    status_updates = db.Column(db.Boolean, nullable=False, default=True)
    location_updates = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "email_enabled": self.email_enabled,
            "sms_enabled": self.sms_enabled,
            "status_updates": self.status_updates,
            "location_updates": self.location_updates,
        }
