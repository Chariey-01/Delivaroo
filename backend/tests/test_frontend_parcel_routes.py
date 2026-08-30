from tests.conftest import auth_headers_for


def test_track_parcel_by_tracking_number(client, app, sample_user, sample_parcel):
    response = client.get(
        f"/api/parcels/track/{sample_parcel.tracking_number}",
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == str(sample_parcel.id)


def test_track_parcel_hides_other_users_parcel(
    client,
    auth_headers,
    sample_parcel,
):
    response = client.get(
        f"/api/parcels/track/{sample_parcel.tracking_number}",
        headers=auth_headers(email="tracking-other@example.com"),
    )

    assert response.status_code == 404


def test_parcel_history_route_returns_status_history(
    client,
    app,
    sample_user,
    sample_parcel,
    db_session,
):
    from app.services.status_history_service import record_status_change

    record_status_change(sample_parcel, "PICKED_UP", sample_user.id)

    response = client.get(
        f"/api/parcels/{sample_parcel.id}/history",
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 200
    assert response.get_json()["data"][0]["status"] == "PICKED_UP"


def test_api_admin_location_route_updates_present_location(
    client,
    app,
    sample_admin,
    sample_parcel,
):
    response = client.patch(
        f"/api/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": -1.2921, "longitude": 36.8219},
        headers=auth_headers_for(app, sample_admin),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["present_latitude"] == -1.2921


def test_api_admin_location_route_requires_admin(
    client,
    app,
    sample_user,
    sample_parcel,
):
    response = client.patch(
        f"/api/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": -1.2921, "longitude": 36.8219},
        headers=auth_headers_for(app, sample_user),
    )

    assert response.status_code == 403
