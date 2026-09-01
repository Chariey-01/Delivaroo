from uuid import UUID

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource

from app.models.notification_preference import NotificationPreference
from app.services.notification_service import (
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    unread_count,
    update_preferences,
)


def _pagination_payload(page):
    return {
        "page": page.page,
        "per_page": page.per_page,
        "total_items": page.total,
        "total_pages": page.pages,
        "has_next": page.has_next,
        "has_previous": page.has_prev,
    }


class NotificationListResource(Resource):
    @jwt_required()
    def get(self):
        try:
            page = max(1, int(request.args.get("page", 1)))
            per_page = min(100, max(1, int(request.args.get("per_page", 20))))
        except ValueError:
            return {"message": "page and per_page must be integers"}, 400
        unread_only = request.args.get("unread", "false").lower() == "true"
        notifications = list_notifications(get_jwt_identity(), page, per_page, unread_only)
        data = [notification.to_dict() for notification in notifications.items]
        return {"data": data, "notifications": data, "pagination": _pagination_payload(notifications)}, 200


class NotificationUnreadCountResource(Resource):
    @jwt_required()
    def get(self):
        return {"data": {"count": unread_count(get_jwt_identity())}}, 200


class NotificationReadResource(Resource):
    @jwt_required()
    def patch(self, notification_id):
        notification = mark_notification_read(notification_id, get_jwt_identity())
        if not notification:
            return {"message": "Notification not found"}, 404
        data = notification.to_dict()
        return {"data": data, "notification": data}, 200


class NotificationReadAllResource(Resource):
    @jwt_required()
    def patch(self):
        mark_all_notifications_read(get_jwt_identity())
        return {"message": "Notifications marked as read"}, 200


class NotificationPreferenceResource(Resource):
    @jwt_required()
    def get(self):
        preference = NotificationPreference.query.filter_by(user_id=UUID(get_jwt_identity())).first()
        defaults = {
            "email_enabled": True,
            "sms_enabled": False,
            "status_updates": True,
            "location_updates": True,
        }
        return {"data": preference.to_dict() if preference else defaults}, 200

    @jwt_required()
    def patch(self):
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return {"message": "Request body is required"}, 400
        preference = update_preferences(get_jwt_identity(), data)
        return {"data": preference.to_dict()}, 200
