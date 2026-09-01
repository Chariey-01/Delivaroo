from tests.conftest import auth_headers_for


def test_authenticated_user_can_create_address(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.post(
        "/addresses",
        json={"address_line": "123 Main St", "city": "Nairobi"},
        headers=headers,
    )

    assert response.status_code == 201


def test_unauthenticated_request_is_rejected(client, db_session):
    response = client.get("/addresses")
    assert response.status_code == 401


def test_user_can_list_own_addresses(client, app, sample_user, db_session):
    headers = auth_headers_for(app, sample_user)

    client.post(
        "/addresses",
        json={"address_line": "123 Main St", "city": "Nairobi"},
        headers=headers,
    )

    response = client.get("/addresses", headers=headers)
    assert response.status_code == 200
    assert len(response.get_json()["addresses"]) == 1


def test_non_owner_gets_403_on_update(client, app, sample_user, db_session):
    from app.models import User
    import uuid

    other = User(
        email=f"other_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="user",
        is_active=True,
    )
    db_session.add(other)
    db_session.commit()

    owner_headers = auth_headers_for(app, sample_user)
    create_resp = client.post(
        "/addresses",
        json={"address_line": "Mine", "city": "Nairobi"},
        headers=owner_headers,
    )
    address_id = create_resp.get_json()["address"]["id"]

    other_headers = auth_headers_for(app, other)
    response = client.patch(
        f"/addresses/{address_id}",
        json={"address_line": "Hijacked"},
        headers=other_headers,
    )

    assert response.status_code == 403
