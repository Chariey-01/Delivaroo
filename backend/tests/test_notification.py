from unittest.mock import patch

from app.models import Notification
from tests.conftest import auth_headers_for


def test_status_change_creates_a_persisted_notification(
    client, app, sample_admin, sample_parcel, db_session
):
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/status",
        json={"status": "PICKED_UP"},
        headers=headers,
    )

    assert response.status_code == 200
    notification = Notification.query.filter_by(event_type="PARCEL_STATUS_CHANGED").one()
    assert notification.recipient_user_id == sample_parcel.user_id
    assert notification.actor_user_id == sample_admin.id
    assert notification.parcel_id == sample_parcel.id
    assert notification.metadata_json == {
        "tracking_number": sample_parcel.tracking_number,
        "status": "PICKED_UP",
    }


def test_status_change_succeeds_when_notification_creation_fails(
    client, app, sample_admin, sample_parcel
):
    headers = auth_headers_for(app, sample_admin)

    with patch("app.resources.admin_status.notify_event", side_effect=RuntimeError("database unavailable")):
        response = client.patch(
            f"/admin/parcels/{sample_parcel.id}/status",
            json={"status": "PICKED_UP"},
            headers=headers,
        )

    assert response.status_code == 200
