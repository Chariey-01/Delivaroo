from tests.conftest import auth_headers_for


def test_admin_can_access_parcel_listing(client, app, sample_admin, db_session):
    headers = auth_headers_for(app, sample_admin)

    response = client.get("/admin/parcels", headers=headers)

    assert response.status_code == 200
    assert "parcels" in response.get_json()


def test_ordinary_user_gets_403(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.get("/admin/parcels", headers=headers)

    assert response.status_code == 403


def test_unauthenticated_request_is_rejected(client, db_session):
    response = client.get("/admin/parcels")

    assert response.status_code == 401
