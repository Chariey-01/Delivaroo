import time
from unittest.mock import patch

from tests.conftest import auth_headers_for


def test_location_change_triggers_notification(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    with patch("app.resources.admin_location.notify_location_change_async") as mock_notify:
        response = client.patch(
            f"/admin/parcels/{sample_parcel.id}/location",
            json={"latitude": -1.2921, "longitude": 36.8219, "address": "Nairobi CBD"},
            headers=headers,
        )

        assert response.status_code == 200
        mock_notify.assert_called_once()

        call_args = mock_notify.call_args
        assert call_args[0][2] == sample_parcel.tracking_number
        assert call_args[0][3] == -1.2921
        assert call_args[0][4] == 36.8219


def test_location_change_succeeds_even_if_owner_not_found(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    from app.models.parcel import Parcel

    with patch("app.resources.admin_location.db.session.get") as mock_get:
        def side_effect(model, id_):
            if model is Parcel:
                return sample_parcel
            return None

        mock_get.side_effect = side_effect

        response = client.patch(
            f"/admin/parcels/{sample_parcel.id}/location",
            json={"latitude": -1.2921, "longitude": 36.8219},
            headers=headers,
        )

        assert response.status_code == 200


def test_email_send_failure_does_not_break_location_change_response(client, app, sample_admin, sample_parcel, db_session):
    """
    In the test environment SMTP env vars aren't set, so the real
    send call will raise inside the background thread. This confirms
    that never affects the synchronous API response.
    """
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": -1.2921, "longitude": 36.8219},
        headers=headers,
    )

    assert response.status_code == 200


def test_location_worker_catches_and_logs_send_failure(app, sample_user):
    from app.services.notification_service import _send_location_change_email_worker

    with app.app_context():
        with patch(
            "app.services.notification_service.send_location_change_email",
            side_effect=RuntimeError("SMTP not configured"),
        ):
            _send_location_change_email_worker(
                app, sample_user.email, "TRK123", -1.2921, 36.8219, "Nairobi CBD"
            )


def test_notify_location_change_async_returns_immediately(app, sample_user):
    from app.services.notification_service import notify_location_change_async

    with patch(
        "app.services.notification_service.send_location_change_email",
        side_effect=lambda *a, **kw: time.sleep(0.5),
    ):
        start = time.time()
        notify_location_change_async(app, sample_user.email, "TRK123", -1.2921, 36.8219)
        elapsed = time.time() - start

        assert elapsed < 0.1
