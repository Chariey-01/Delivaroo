"""Create one logical notification and deliver it through enabled channels."""

import os
import threading
from datetime import datetime, timezone
from uuid import UUID

from app.extensions import db
from app.models import Notification, NotificationDelivery, NotificationPreference, User
from app.services.email_service import _send_email


CHANNEL_IN_APP = "IN_APP"
CHANNEL_EMAIL = "EMAIL"
CHANNEL_SMS = "SMS"
DELIVERY_PENDING = "PENDING"
DELIVERY_DELIVERED = "DELIVERED"
DELIVERY_FAILED = "FAILED"
DELIVERY_SKIPPED = "SKIPPED"
MAX_DELIVERY_ATTEMPTS = 3


def _as_uuid(value):
    return UUID(str(value)) if value is not None else None


def _preferences_for(user_id):
    preference = NotificationPreference.query.filter_by(user_id=_as_uuid(user_id)).first()
    if preference is None:
        preference = NotificationPreference(user_id=_as_uuid(user_id))
        db.session.add(preference)
        db.session.flush()
    return preference


def _event_content(event_type, parcel=None, metadata=None):
    tracking_number = parcel.tracking_number if parcel else None
    if event_type == "WELCOME":
        return "Welcome to Delivaroo", "Your account is ready. You can now send and track parcels."
    if event_type == "PARCEL_CREATED":
        return "Parcel created", f"Your parcel {tracking_number} is ready for pickup."
    if event_type == "PARCEL_STATUS_CHANGED":
        status = (metadata or {}).get("status", "updated")
        return "Parcel status updated", f"Your parcel {tracking_number} is now {status}."
    if event_type == "PARCEL_LOCATION_UPDATED":
        return "Parcel location updated", f"Your parcel {tracking_number} has a new tracked location."
    if event_type == "PARCEL_CANCELLED":
        return "Parcel cancelled", f"Your parcel {tracking_number} has been cancelled."
    if event_type == "PARCEL_DESTINATION_UPDATED":
        return "Destination updated", f"The destination for parcel {tracking_number} has been updated."
    return "Delivaroo update", "There is an update on your Delivaroo account."


def _delivery_status_for(channel, preference, event_type):
    if channel == CHANNEL_IN_APP:
        return DELIVERY_DELIVERED, None
    if channel == CHANNEL_EMAIL:
        allowed = preference.email_enabled and not (
            event_type == "PARCEL_STATUS_CHANGED" and not preference.status_updates
        ) and not (
            event_type == "PARCEL_LOCATION_UPDATED" and not preference.location_updates
        )
        return (DELIVERY_PENDING, None) if allowed else (DELIVERY_SKIPPED, "email disabled by preference")
    if not preference.sms_enabled:
        return DELIVERY_SKIPPED, "sms disabled by preference"
    if os.getenv("SMS_ENABLED", "false").lower() != "true":
        return DELIVERY_SKIPPED, "sms delivery is not enabled"
    return DELIVERY_SKIPPED, "no sms provider is configured"


def create_notification(*, recipient_user_id, actor_user_id=None, event_type, parcel=None, metadata=None, idempotency_key):
    """Persist one event safely. Metadata is presentation-only and never contains contacts."""
    existing = Notification.query.filter_by(idempotency_key=idempotency_key).first()
    if existing:
        return existing, False

    recipient = db.session.get(User, _as_uuid(recipient_user_id))
    if not recipient:
        raise ValueError("Notification recipient does not exist")

    preference = _preferences_for(recipient.id)
    title, message = _event_content(event_type, parcel, metadata)
    notification = Notification(
        recipient_user_id=recipient.id,
        actor_user_id=_as_uuid(actor_user_id),
        parcel_id=parcel.id if parcel else None,
        event_type=event_type,
        title=title,
        message=message,
        entity_type="parcel" if parcel else "user",
        entity_id=parcel.id if parcel else recipient.id,
        metadata_json=metadata or {},
        idempotency_key=idempotency_key,
    )
    db.session.add(notification)
    db.session.flush()

    for channel in (CHANNEL_IN_APP, CHANNEL_EMAIL, CHANNEL_SMS):
        status, reason = _delivery_status_for(channel, preference, event_type)
        delivery = NotificationDelivery(
            notification_id=notification.id,
            channel=channel,
            status=status,
            delivered_at=datetime.now(timezone.utc) if status == DELIVERY_DELIVERED else None,
            last_error=reason,
        )
        db.session.add(delivery)

    db.session.commit()
    return notification, True


def _send_email_delivery(app, delivery_id):
    with app.app_context():
        delivery = db.session.get(NotificationDelivery, _as_uuid(delivery_id))
        if not delivery or delivery.status != DELIVERY_PENDING:
            return
        notification = delivery.notification
        recipient = db.session.get(User, notification.recipient_user_id)
        delivery.attempt_count += 1
        try:
            _send_email(recipient.email, notification.title, notification.message)
            delivery.status = DELIVERY_DELIVERED
            delivery.sent_at = datetime.now(timezone.utc)
            delivery.delivered_at = delivery.sent_at
            delivery.last_error = None
        except Exception:
            delivery.status = DELIVERY_FAILED if delivery.attempt_count >= MAX_DELIVERY_ATTEMPTS else DELIVERY_PENDING
            delivery.last_error = "email delivery failed"
        db.session.commit()


def dispatch_notification_deliveries(app, notification):
    """Queue outbound channels after the domain transaction has committed."""
    if app.config.get("TESTING"):
        return

    for delivery in notification.deliveries:
        if delivery.channel == CHANNEL_EMAIL and delivery.status == DELIVERY_PENDING:
            threading.Thread(target=_send_email_delivery, args=(app, delivery.id), daemon=True).start()


def notify_event(app, *, recipient_user_id, actor_user_id=None, event_type, parcel=None, metadata=None, idempotency_key):
    notification, created = create_notification(
        recipient_user_id=recipient_user_id,
        actor_user_id=actor_user_id,
        event_type=event_type,
        parcel=parcel,
        metadata=metadata,
        idempotency_key=idempotency_key,
    )
    if created:
        dispatch_notification_deliveries(app, notification)
    return notification


def list_notifications(user_id, page=1, per_page=20, unread_only=False):
    query = Notification.query.filter_by(recipient_user_id=_as_uuid(user_id))
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))
    pagination = query.order_by(Notification.created_at.desc(), Notification.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return pagination


def mark_notification_read(notification_id, user_id):
    notification = Notification.query.filter_by(
        id=_as_uuid(notification_id), recipient_user_id=_as_uuid(user_id)
    ).first()
    if not notification:
        return None
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.session.commit()
    return notification


def mark_all_notifications_read(user_id):
    Notification.query.filter_by(recipient_user_id=_as_uuid(user_id)).filter(
        Notification.read_at.is_(None)
    ).update({Notification.read_at: datetime.now(timezone.utc)}, synchronize_session=False)
    db.session.commit()


def unread_count(user_id):
    return Notification.query.filter_by(recipient_user_id=_as_uuid(user_id)).filter(Notification.read_at.is_(None)).count()


def update_preferences(user_id, values):
    preference = _preferences_for(user_id)
    for field in ("email_enabled", "sms_enabled", "status_updates", "location_updates"):
        if field in values and isinstance(values[field], bool):
            setattr(preference, field, values[field])
    db.session.commit()
    return preference
