from tests.conftest import auth_headers_for


def test_admin_can_update_location_via_endpoint(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": -1.2921, "longitude": 36.8219, "address": "Nairobi CBD"},
        headers=headers,
    )

    assert response.status_code == 200


def test_invalid_coordinates_returns_400(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": 999, "longitude": 36.8219},
        headers=headers,
    )

    assert response.status_code == 400


def test_non_admin_gets_403(client, app, sample_user, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/location",
        json={"latitude": -1.2921, "longitude": 36.8219},
        headers=headers,
    )

    assert response.status_code == 403
