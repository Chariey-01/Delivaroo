from app.extensions import db
from app.models import AuditLog, DeliveryAgent, Notification, Parcel, User
from tests.conftest import auth_headers_for


def test_admin_user_directory_supports_frontend_shape(client, app, sample_admin, sample_user):
    response = client.get(
        "/api/admin/users",
        headers=auth_headers_for(app, sample_admin),
    )

    assert response.status_code == 200
    users = response.get_json()["data"]
    user = next(entry for entry in users if entry["id"] == str(sample_user.id))
    assert user["email"] == sample_user.email
    assert user["role"] == "CUSTOMER"
    assert user["suspended"] is False
    assert "createdAt" in user


def test_user_directory_is_admin_only(client, app, sample_user, db_session):
    sample_user.role = "dispatcher"
    db_session.commit()

    response = client.get(
        "/api/admin/users",
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 403


def test_admin_can_update_user_role_and_suspension(client, app, sample_admin, sample_user):
    headers = auth_headers_for(app, sample_admin)

    role_response = client.patch(
        f"/api/admin/users/{sample_user.id}/role",
        json={"role": "DISPATCHER"},
        headers=headers,
    )
    suspension_response = client.patch(
        f"/api/admin/users/{sample_user.id}/suspension",
        json={"suspended": True},
        headers=headers,
    )

    assert role_response.status_code == 200
    assert role_response.get_json()["data"]["role"] == "DISPATCHER"
    assert suspension_response.status_code == 200
    assert suspension_response.get_json()["data"]["suspended"] is True
    assert db.session.get(User, sample_user.id).role == "dispatcher"
    assert db.session.get(User, sample_user.id).is_active is False


def test_admin_courier_roster_and_shift_endpoint(client, app, sample_admin, db_session):
    agent = DeliveryAgent(
        name="Demo Rider",
        email="rider@example.test",
        transport_mode="MOTORBIKE",
        is_active=True,
    )
    db_session.add(agent)
    db_session.commit()

    headers = auth_headers_for(app, sample_admin)
    list_response = client.get("/api/admin/couriers", headers=headers)
    shift_response = client.patch(
        f"/api/admin/couriers/{agent.id}/shift",
        json={"onShift": False},
        headers=headers,
    )

    assert list_response.status_code == 200
    assert list_response.get_json()["data"][0]["vehicleMode"] == "MOTORBIKE"
    assert shift_response.status_code == 200
    assert shift_response.get_json()["data"][0]["onShift"] is False


def test_settings_are_public_to_read_and_admin_only_to_update(client, app, sample_admin, sample_user):
    public = client.get("/api/settings")
    denied = client.patch(
        "/api/admin/settings",
        json={"acceptingOrders": False},
        headers=auth_headers_for(app, sample_user),
    )
    updated = client.patch(
        "/api/admin/settings",
        json={"acceptingOrders": False, "noticeToStaff": "Weather delay"},
        headers=auth_headers_for(app, sample_admin),
    )

    assert public.status_code == 200
    assert public.get_json()["data"]["acceptingOrders"] is True
    assert denied.status_code == 403
    assert updated.status_code == 200
    assert updated.get_json()["data"]["acceptingOrders"] is False
    assert client.get("/api/settings").get_json()["data"]["noticeToStaff"] == "Weather delay"


def test_fleet_availability_can_be_read_and_updated_by_staff(client, app, sample_admin):
    read_response = client.get("/api/transport/availability")
    update_response = client.patch(
        "/api/admin/transport/availability",
        json={"mode": "DRONE", "status": "OFFLINE"},
        headers=auth_headers_for(app, sample_admin),
    )

    assert read_response.status_code == 200
    assert read_response.get_json()["data"]["ROAD"] == "AVAILABLE"
    assert update_response.status_code == 200
    assert update_response.get_json()["data"]["DRONE"] == "OFFLINE"


def test_admin_audit_and_notification_lists_are_available(client, app, sample_admin, sample_user, db_session):
    audit = AuditLog(
        user_id=sample_admin.id,
        action="parcel.status_changed",
        entity_type="parcel",
    )
    notification = Notification(
        recipient_user_id=sample_user.id,
        actor_user_id=sample_admin.id,
        event_type="PARCEL_STATUS_CHANGED",
        title="Status changed",
        message="Your parcel moved",
        idempotency_key="test-notification",
    )
    db_session.add_all([audit, notification])
    db_session.commit()

    headers = auth_headers_for(app, sample_admin)
    audit_response = client.get("/api/admin/audit", headers=headers)
    notification_response = client.get("/api/admin/notifications", headers=headers)

    assert audit_response.status_code == 200
    assert audit_response.get_json()["data"][0]["action"] == "parcel.status_changed"
    assert notification_response.status_code == 200
    assert notification_response.get_json()["data"][0]["recipientEmail"] == sample_user.email


def test_customer_can_request_automatic_delivery_agent_assignment(
    client,
    app,
    sample_user,
    sample_parcel,
    db_session,
):
    agent = DeliveryAgent(
        name="Demo Rider",
        email="auto-rider@example.test",
        transport_mode=sample_parcel.transport_mode,
        is_active=True,
    )
    db_session.add(agent)
    db_session.commit()

    response = client.patch(
        f"/api/admin/parcels/{sample_parcel.id}/delivery-agent",
        json={},
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["delivery_agent"]["name"] == "Demo Rider"
    assert data["status"] == "ASSIGNED"


def test_staff_can_verify_parcel_weight(client, app, sample_admin, sample_parcel):
    response = client.patch(
        f"/api/admin/parcels/{sample_parcel.id}/weight",
        json={"weightKg": 7.2},
        headers=auth_headers_for(app, sample_admin),
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["verified_weight_kg"] == 7.2
    assert data["weighed_by"] == sample_admin.email
