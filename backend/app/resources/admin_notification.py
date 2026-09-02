from flask_restful import Resource

from app.extensions import db
from app.models import Notification, User
from app.utils.auth_decorators import staff_required


def serialize_admin_notification(notification):
    recipient = db.session.get(User, notification.recipient_user_id)
    payload = notification.to_dict()
    payload.update(
        {
            "recipient": recipient.email if recipient else None,
            "recipientEmail": recipient.email if recipient else None,
            "body": notification.message,
            "createdAt": payload.get("created_at"),
        }
    )
    return payload


class AdminNotificationListResource(Resource):
    @staff_required
    def get(self):
        notifications = Notification.query.order_by(Notification.created_at.desc()).limit(300).all()
        return {"data": [serialize_admin_notification(row) for row in notifications]}, 200
