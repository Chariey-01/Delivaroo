from unittest.mock import patch

from app.models import Notification, NotificationDelivery
from app.services.notification_service import (
    CHANNEL_EMAIL,
    CHANNEL_IN_APP,
    CHANNEL_SMS,
    DELIVERY_DELIVERED,
    DELIVERY_SKIPPED,
    _send_email_delivery,
    create_notification,
)
from tests.conftest import auth_headers_for


def test_notification_persists_logical_event_channels_and_idempotency(
    db_session, sample_user, sample_admin, sample_parcel
):
    notification, created = create_notification(
        recipient_user_id=sample_user.id,
        actor_user_id=sample_admin.id,
        event_type="PARCEL_CREATED",
        parcel=sample_parcel,
        metadata={"tracking_number": sample_parcel.tracking_number},
        idempotency_key="parcel-created:test",
    )
    duplicate, duplicate_created = create_notification(
        recipient_user_id=sample_user.id,
        actor_user_id=sample_admin.id,
        event_type="PARCEL_CREATED",
        parcel=sample_parcel,
        metadata={"tracking_number": sample_parcel.tracking_number},
        idempotency_key="parcel-created:test",
    )

    assert created is True
    assert duplicate_created is False
    assert duplicate.id == notification.id
    assert notification.recipient_user_id == sample_user.id
    assert notification.actor_user_id == sample_admin.id
    assert notification.parcel_id == sample_parcel.id
    assert "email" not in notification.metadata_json
    channels = {delivery.channel: delivery for delivery in notification.deliveries}
    assert channels[CHANNEL_IN_APP].status == DELIVERY_DELIVERED
    assert channels[CHANNEL_SMS].status == DELIVERY_SKIPPED


def test_notification_email_delivery_is_mocked_and_recorded(app, db_session, sample_user):
    notification, _ = create_notification(
        recipient_user_id=sample_user.id,
        event_type="WELCOME",
        idempotency_key="welcome:delivery-test",
    )
    delivery = next(item for item in notification.deliveries if item.channel == CHANNEL_EMAIL)

    with patch("app.services.notification_service._send_email") as send_email:
        _send_email_delivery(app, delivery.id)

    db_session.expire_all()
    saved = db_session.get(NotificationDelivery, delivery.id)
    send_email.assert_called_once_with(sample_user.email, notification.title, notification.message)
    assert saved.status == DELIVERY_DELIVERED
    assert saved.attempt_count == 1


def test_inbox_is_paginated_owned_and_marked_read(client, app, db_session, sample_user, sample_admin):
    for number in range(3):
        create_notification(
            recipient_user_id=sample_user.id,
            event_type="WELCOME",
            idempotency_key=f"welcome:inbox:{number}",
        )
    other, _ = create_notification(
        recipient_user_id=sample_admin.id,
        event_type="WELCOME",
        idempotency_key="welcome:other-user",
    )
    headers = auth_headers_for(app, sample_user)

    response = client.get("/api/notifications?page=1&per_page=2", headers=headers)
    body = response.get_json()
    assert response.status_code == 200
    assert len(body["data"]) == 2
    assert body["pagination"]["total_items"] == 3
    assert client.get("/api/notifications/unread-count", headers=headers).get_json()["data"]["count"] == 3

    forbidden = client.patch(f"/api/notifications/{other.id}/read", headers=headers)
    assert forbidden.status_code == 404

    notification_id = body["data"][0]["id"]
    assert client.patch(f"/api/notifications/{notification_id}/read", headers=headers).status_code == 200
    assert client.get("/api/notifications/unread-count", headers=headers).get_json()["data"]["count"] == 2
    assert client.patch("/api/notifications/read-all", headers=headers).status_code == 200
    assert client.get("/api/notifications/unread-count", headers=headers).get_json()["data"]["count"] == 0


def test_preferences_disable_email_and_ignore_invalid_values(client, app, db_session, sample_user):
    headers = auth_headers_for(app, sample_user)

    response = client.patch(
        "/api/notification-preferences",
        json={"email_enabled": False, "sms_enabled": "yes"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["email_enabled"] is False
    assert response.get_json()["data"]["sms_enabled"] is False

    notification, _ = create_notification(
        recipient_user_id=sample_user.id,
        event_type="WELCOME",
        idempotency_key="welcome:email-disabled",
    )
    email_delivery = next(item for item in notification.deliveries if item.channel == CHANNEL_EMAIL)
    assert email_delivery.status == DELIVERY_SKIPPED


def test_registration_and_parcel_lifecycle_create_notifications(
    client, app, db_session, sample_user, sample_weight_category
):
    registration = client.post(
        "/api/auth/register",
        json={"email": "notification-welcome@example.com", "password": "Password123!"},
    )
    assert registration.status_code == 201
    assert Notification.query.filter_by(event_type="WELCOME").count() == 1

    headers = auth_headers_for(app, sample_user)
    creation = client.post(
        "/api/parcels",
        json={
            "weight_category_id": str(sample_weight_category.id),
            "pickup_address": "Pickup point",
            "pickup_latitude": -1.2921,
            "pickup_longitude": 36.8219,
            "destination_address": "Initial destination",
            "destination_latitude": -1.3,
            "destination_longitude": 36.83,
        },
        headers=headers,
    )
    assert creation.status_code == 201
    parcel_id = creation.get_json()["data"]["id"]
    assert Notification.query.filter_by(event_type="PARCEL_CREATED").count() == 1

    destination = client.patch(
        f"/api/parcels/{parcel_id}",
        json={"destination_address": "Updated destination", "latitude": -1.31, "longitude": 36.84},
        headers=headers,
    )
    assert destination.status_code == 200
    assert Notification.query.filter_by(event_type="PARCEL_DESTINATION_UPDATED").count() == 1

    cancellation = client.delete(f"/api/parcels/{parcel_id}/cancel", headers=headers)
    assert cancellation.status_code == 200
    assert Notification.query.filter_by(event_type="PARCEL_CANCELLED").count() == 1
