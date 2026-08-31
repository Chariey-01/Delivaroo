from tests.conftest import auth_headers_for


def test_api_prefixed_auth_routes_work(client):
    register = client.post(
        "/api/auth/register",
        json={"email": "compat@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "compat@example.com", "password": "Password123!"},
    )

    assert register.status_code == 201
    assert register.get_json()["data"]["user"]["email"] == "compat@example.com"
    assert login.status_code == 200
    assert login.get_json()["data"]["access_token"]


def test_api_refresh_accepts_bearer_refresh_token(client):
    client.post(
        "/auth/register",
        json={"email": "bearer-refresh@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "bearer-refresh@example.com", "password": "Password123!"},
    )
    refresh_token = login.get_json()["refresh_token"]

    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["access_token"]


def test_parcel_collection_includes_data_for_frontend(
    client,
    auth_headers,
    sample_weight_category,
):
    headers = auth_headers()
    client.post(
        "/api/parcels",
        json={
            "weight_category_id": str(sample_weight_category.id),
            "pickup_address": "Pickup",
            "destination_address": "Destination",
        },
        headers=headers,
    )

    response = client.get("/api/parcels", headers=headers)

    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 1


def test_create_parcel_accepts_frontend_nested_payload(
    client,
    auth_headers,
    sample_weight_category,
):
    response = client.post(
        "/api/parcels",
        json={
            "weightCategoryId": str(sample_weight_category.id),
            "pickup": {
                "address": "Frontend Pickup",
                "lat": -1.2921,
                "lng": 36.8219,
            },
            "destination": {
                "address": "Frontend Destination",
                "lat": -1.3000,
                "lng": 36.9000,
            },
            "distanceKm": 12.5,
            "durationSeconds": 2100,
            "price": 1,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["pickup_address"] == "Frontend Pickup"
    assert data["destination_address"] == "Frontend Destination"
    assert data["distance"] == "12.50"
    assert data["duration"] == 35
    assert data["price"] == "225.00"


def test_destination_update_alias_works_for_frontend(
    client,
    app,
    sample_parcel,
    sample_user,
):
    response = client.patch(
        f"/api/parcels/{sample_parcel.id}/destination",
        json={
            "destination_address": "Frontend Destination",
            "destination_latitude": -1.35,
            "destination_longitude": 36.9,
        },
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["destination_address"] == "Frontend Destination"


def test_destination_update_accepts_frontend_place_payload(
    client,
    app,
    sample_parcel,
    sample_user,
):
    response = client.patch(
        f"/api/parcels/{sample_parcel.id}/destination",
        json={
            "address": "Frontend Place",
            "lat": -1.35,
            "lng": 36.9,
        },
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["destination_address"] == "Frontend Place"


def test_cancel_alias_works_for_frontend(client, app, sample_parcel, sample_user):
    response = client.patch(
        f"/api/parcels/{sample_parcel.id}/cancel",
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "CANCELLED"


def test_api_prefixed_admin_routes_work(client, app, sample_admin, sample_parcel):
    headers = auth_headers_for(app, sample_admin)

    listing = client.get("/api/admin/parcels", headers=headers)
    status = client.patch(
        f"/api/admin/parcels/{sample_parcel.id}/status",
        json={"status": "PICKED_UP"},
        headers=headers,
    )

    assert listing.status_code == 200
    assert listing.get_json()["data"]
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "PICKED_UP"
