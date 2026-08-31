import uuid

from app.extensions import db
from app.models import Parcel, StatusHistory, User


def parcel_payload(category, **overrides):
    payload = {
        "weight_category_id": str(category.id),
        "pickup_address": "123 Pickup St",
        "pickup_latitude": "-1.2921000",
        "pickup_longitude": "36.8219000",
        "destination_address": "456 Destination Ave",
        "destination_latitude": "-1.3000000",
        "destination_longitude": "36.9000000",
        "distance": "12.5",
        "duration": 35,
    }
    payload.update(overrides)
    return payload


def test_parcel_create_success(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=auth_headers(),
    )

    assert response.status_code == 201
    body = response.get_json()["parcel"]
    assert body["tracking_number"].startswith("DLV-")
    assert body["status"] == "PENDING"
    assert body["transport_mode"] == "MOTORBIKE"
    assert body["transport_label"] == "Motorbike"


def test_parcel_create_accepts_valid_transport_mode(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, transport_mode="TRUCK"),
        headers=auth_headers(),
    )

    assert response.status_code == 201
    assert response.get_json()["parcel"]["transport_mode"] == "TRUCK"


def test_parcel_create_rejects_invalid_transport_mode(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, transport_mode="BICYCLE"),
        headers=auth_headers(),
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Invalid transport mode"


def test_parcel_create_records_initial_status_history(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=auth_headers(),
    )

    parcel_id = uuid.UUID(response.get_json()["parcel"]["id"])
    entries = StatusHistory.query.filter_by(parcel_id=parcel_id).all()

    assert response.status_code == 201
    assert len(entries) == 1
    assert entries[0].status == "PENDING"
    assert entries[0].notes == "Parcel created"


def test_create_requires_authentication(client, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
    )

    assert response.status_code == 401


def test_missing_pickup_rejected(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, pickup_address=""),
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_missing_destination_rejected(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, destination_address=""),
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_invalid_weight_category_rejected(client, auth_headers):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(type("Category", (), {"id": uuid.uuid4()})()),
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_client_cannot_control_price(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, price="0.01"),
        headers=auth_headers(),
    )

    assert response.status_code == 201
    assert response.get_json()["parcel"]["price"] == "225.00"


def test_price_calculated_server_side(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, distance="3"),
        headers=auth_headers(),
    )

    assert response.status_code == 201
    assert response.get_json()["parcel"]["price"] == "130.00"


def test_distance_and_duration_persisted(client, auth_headers, sample_weight_category):
    response = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, distance="7.25", duration=44),
        headers=auth_headers(),
    )

    body = response.get_json()["parcel"]

    assert response.status_code == 201
    assert body["distance"] == "7.25"
    assert body["duration"] == 44


def test_list_returns_current_users_parcels_only(client, auth_headers, sample_weight_category):
    user_headers = auth_headers(email="parcel-owner@example.com")
    other_headers = auth_headers(email="parcel-other@example.com")

    own = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, pickup_address="Mine"),
        headers=user_headers,
    ).get_json()["parcel"]
    client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, pickup_address="Theirs"),
        headers=other_headers,
    )

    response = client.get("/api/parcels", headers=user_headers)

    assert response.status_code == 200
    parcels = response.get_json()["parcels"]
    assert [parcel["id"] for parcel in parcels] == [own["id"]]


def test_list_newest_first(client, auth_headers, sample_weight_category):
    headers = auth_headers()
    first = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, pickup_address="First"),
        headers=headers,
    ).get_json()["parcel"]
    second = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category, pickup_address="Second"),
        headers=headers,
    ).get_json()["parcel"]

    response = client.get("/api/parcels", headers=headers)

    assert response.status_code == 200
    assert [parcel["id"] for parcel in response.get_json()["parcels"]] == [
        second["id"],
        first["id"],
    ]


def test_user_a_cannot_see_user_b_parcels_in_list(client, auth_headers, sample_weight_category):
    user_a_headers = auth_headers(email="a@example.com")
    user_b_headers = auth_headers(email="b@example.com")

    client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=user_b_headers,
    )

    response = client.get("/api/parcels", headers=user_a_headers)

    assert response.status_code == 200
    assert response.get_json()["parcels"] == []


def test_parcel_owner_can_view_detail(client, auth_headers, sample_weight_category):
    headers = auth_headers()
    parcel = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=headers,
    ).get_json()["parcel"]

    response = client.get(f"/api/parcels/{parcel['id']}", headers=headers)

    assert response.status_code == 200
    assert response.get_json()["parcel"]["id"] == parcel["id"]


def test_admin_can_view_detail(client, auth_headers, sample_weight_category):
    owner_headers = auth_headers(email="admin-view-owner@example.com")
    admin_headers = auth_headers(email="admin-view-admin@example.com", role="admin")
    parcel = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=owner_headers,
    ).get_json()["parcel"]

    response = client.get(f"/api/parcels/{parcel['id']}", headers=admin_headers)

    assert response.status_code == 200
    assert response.get_json()["parcel"]["id"] == parcel["id"]


def test_unrelated_user_receives_404(client, auth_headers, sample_weight_category):
    owner_headers = auth_headers(email="owner@example.com")
    other_headers = auth_headers(email="unrelated@example.com")
    parcel = client.post(
        "/api/parcels",
        json=parcel_payload(sample_weight_category),
        headers=owner_headers,
    ).get_json()["parcel"]

    response = client.get(f"/api/parcels/{parcel['id']}", headers=other_headers)

    assert response.status_code == 404


def test_nonexistent_parcel_receives_404(client, auth_headers):
    response = client.get(f"/api/parcels/{uuid.uuid4()}", headers=auth_headers())

    assert response.status_code == 404
