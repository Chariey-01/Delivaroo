from tests.conftest import auth_headers_for


def test_authenticated_user_can_get_own_profile(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.get("/profile", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["profile"] is None


def test_unauthenticated_get_is_rejected(client, db_session):
    response = client.get("/profile")
    assert response.status_code == 401


def test_authenticated_user_can_update_profile(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.patch(
        "/profile",
        json={"full_name": "Jane Doe", "phone": "+254712345678"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.get_json()["profile"]["full_name"] == "Jane Doe"


def test_profile_persists_between_get_and_patch(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    client.patch("/profile", json={"full_name": "Jane Doe"}, headers=headers)
    response = client.get("/profile", headers=headers)

    assert response.get_json()["profile"]["full_name"] == "Jane Doe"


def test_invalid_phone_returns_400(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.patch(
        "/profile",
        json={"phone": "not-valid!!"},
        headers=headers,
    )
    assert response.status_code == 400
