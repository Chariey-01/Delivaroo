from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models import PasswordResetToken, RefreshToken, User
from app.services.password_reset_service import create_password_reset_token
from app.services.token_service import get_valid_refresh_token
from app.utils.security import verify_password


def test_registration_succeeds(client):
    response = client.post(
        "/auth/register",
        json={"email": "NewUser@Example.com", "password": "Password123!"},
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["user"]["email"] == "newuser@example.com"
    assert "password_hash" not in body["user"]


def test_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "password": "Password123!"}

    assert client.post("/auth/register", json=payload).status_code == 201
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409


def test_password_stored_hashed(client):
    client.post(
        "/auth/register",
        json={"email": "hash@example.com", "password": "Password123!"},
    )

    user = User.query.filter_by(email="hash@example.com").first()

    assert user.password_hash != "Password123!"
    assert verify_password("Password123!", user.password_hash)


def test_login_succeeds(client):
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "Password123!"},
    )

    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["access_token"]
    assert body["refresh_token"]


def test_wrong_password_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "wrong@example.com", "password": "Password123!"},
    )

    response = client.post(
        "/auth/login",
        json={"email": "wrong@example.com", "password": "nope"},
    )

    assert response.status_code == 401


def test_inactive_user_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "inactive@example.com", "password": "Password123!"},
    )
    user = User.query.filter_by(email="inactive@example.com").first()
    user.is_active = False
    db.session.commit()

    response = client.post(
        "/auth/login",
        json={"email": "inactive@example.com", "password": "Password123!"},
    )

    assert response.status_code == 401


def test_access_token_works(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers())

    assert response.status_code == 200


def test_auth_me_requires_jwt(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_auth_me_returns_current_user(client, auth_headers):
    headers = auth_headers(email="me@example.com")

    response = client.get("/auth/me", headers=headers)

    assert response.status_code == 200
    assert response.get_json()["user"]["email"] == "me@example.com"


def test_refresh_token_works(client):
    client.post(
        "/auth/register",
        json={"email": "refresh@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "refresh@example.com", "password": "Password123!"},
    )

    response = client.post(
        "/auth/refresh",
        json={"refresh_token": login.get_json()["refresh_token"]},
    )

    assert response.status_code == 200
    assert response.get_json()["access_token"]


def test_missing_refresh_token_is_rejected(client):
    response = client.post("/auth/refresh", json={})

    assert response.status_code == 400
    assert response.get_json()["message"] == "Refresh token is required"


def test_refreshed_access_token_preserves_current_user_role(client):
    client.post(
        "/auth/register",
        json={"email": "refresh-role@example.com", "password": "Password123!"},
    )
    user = User.query.filter_by(email="refresh-role@example.com").one()
    user.role = "admin"
    db.session.commit()
    login = client.post(
        "/auth/login",
        json={"email": "refresh-role@example.com", "password": "Password123!"},
    )

    refreshed = client.post(
        "/auth/refresh",
        json={"refresh_token": login.get_json()["refresh_token"]},
    )
    admin_response = client.get(
        "/api/admin/parcels",
        headers={"Authorization": f"Bearer {refreshed.get_json()['access_token']}"},
    )

    assert refreshed.status_code == 200
    assert admin_response.status_code == 200


def test_regular_user_refresh_does_not_gain_admin_access(client):
    registration = client.post(
        "/auth/register",
        json={"email": "refresh-user@example.com", "password": "Password123!"},
    )
    refreshed = client.post(
        "/auth/refresh",
        json={"refresh_token": registration.get_json()["refresh_token"]},
    )

    admin_response = client.get(
        "/api/admin/parcels",
        headers={"Authorization": f"Bearer {refreshed.get_json()['access_token']}"},
    )

    assert refreshed.status_code == 200
    assert admin_response.status_code == 403


def test_revoked_refresh_token_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "revoke@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "revoke@example.com", "password": "Password123!"},
    )
    refresh_token = login.get_json()["refresh_token"]

    assert client.post("/auth/logout", json={"refresh_token": refresh_token}).status_code == 200
    response = client.post("/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 401


def test_expired_and_invalid_refresh_token_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "expired-refresh@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "expired-refresh@example.com", "password": "Password123!"},
    )
    raw_token = login.get_json()["refresh_token"]
    stored_token = get_valid_refresh_token(raw_token)
    stored_token.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.session.commit()

    expired = client.post("/auth/refresh", json={"refresh_token": raw_token})
    invalid = client.post("/auth/refresh", json={"refresh_token": "not-real"})

    assert expired.status_code == 401
    assert invalid.status_code == 401


def test_logout_revokes_refresh_token(client):
    client.post(
        "/auth/register",
        json={"email": "logout@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "logout@example.com", "password": "Password123!"},
    )
    refresh_token = login.get_json()["refresh_token"]
    stored_token = get_valid_refresh_token(refresh_token)

    response = client.post("/auth/logout", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert stored_token.revoked_at is not None


def test_password_reset_token_expires(client):
    client.post(
        "/auth/register",
        json={"email": "reset-expire@example.com", "password": "Password123!"},
    )
    user = User.query.filter_by(email="reset-expire@example.com").first()
    raw_token = create_password_reset_token(user)
    stored_token = PasswordResetToken.query.first()
    stored_token.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.session.commit()

    response = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword123!"},
    )

    assert response.status_code == 400


def test_password_reset_token_cannot_be_reused(client):
    client.post(
        "/auth/register",
        json={"email": "reset-reuse@example.com", "password": "Password123!"},
    )
    forgot = client.post(
        "/auth/forgot-password",
        json={"email": "reset-reuse@example.com"},
    )
    raw_token = forgot.get_json()["reset_token"]

    first = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword123!"},
    )
    second = client.post(
        "/auth/reset-password",
        json={"token": raw_token, "new_password": "AnotherPassword123!"},
    )

    assert first.status_code == 200
    assert second.status_code == 400


def test_password_reset_rejects_an_invalid_token(client):
    response = client.post(
        "/auth/reset-password",
        json={"token": "not-a-real-token", "new_password": "NewPassword123!"},
    )

    assert response.status_code == 400
    assert response.get_json()["message"] == "Invalid password reset token"


def test_new_password_reset_request_invalidates_previous_token(client):
    client.post(
        "/auth/register",
        json={"email": "reset-latest@example.com", "password": "Password123!"},
    )

    first = client.post("/auth/forgot-password", json={"email": "reset-latest@example.com"})
    second = client.post("/auth/forgot-password", json={"email": "reset-latest@example.com"})

    response = client.post(
        "/auth/reset-password",
        json={"token": first.get_json()["reset_token"], "new_password": "NewPassword123!"},
    )

    assert response.status_code == 400
    assert second.get_json()["reset_token"] != first.get_json()["reset_token"]


def test_password_reset_updates_password_and_revokes_refresh_tokens(client):
    client.post(
        "/auth/register",
        json={"email": "reset-complete@example.com", "password": "Password123!"},
    )
    first_login = client.post(
        "/auth/login",
        json={"email": "reset-complete@example.com", "password": "Password123!"},
    )
    second_login = client.post(
        "/auth/login",
        json={"email": "reset-complete@example.com", "password": "Password123!"},
    )
    forgot = client.post(
        "/auth/forgot-password",
        json={"email": "reset-complete@example.com"},
    )

    response = client.post(
        "/auth/reset-password",
        json={"token": forgot.get_json()["reset_token"], "new_password": "NewPassword123!"},
    )

    assert response.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": "reset-complete@example.com", "password": "Password123!"},
    ).status_code == 401
    assert client.post(
        "/auth/login",
        json={"email": "reset-complete@example.com", "password": "NewPassword123!"},
    ).status_code == 200
    assert client.post(
        "/auth/refresh",
        json={"refresh_token": first_login.get_json()["refresh_token"]},
    ).status_code == 401
    assert client.post(
        "/auth/refresh",
        json={"refresh_token": second_login.get_json()["refresh_token"]},
    ).status_code == 401


def test_change_password_requires_current_password_and_saves_new_hash(client):
    client.post(
        "/auth/register",
        json={"email": "change-password@example.com", "password": "Password123!"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "change-password@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {login.get_json()['access_token']}"}

    wrong_current = client.post(
        "/auth/change-password",
        headers=headers,
        json={"current_password": "WrongPassword123!", "new_password": "NewPassword123!"},
    )
    changed = client.post(
        "/auth/change-password",
        headers=headers,
        json={"current_password": "Password123!", "new_password": "NewPassword123!"},
    )

    assert wrong_current.status_code == 400
    assert changed.status_code == 200
    assert client.post(
        "/auth/login",
        json={"email": "change-password@example.com", "password": "Password123!"},
    ).status_code == 401
    assert client.post(
        "/auth/login",
        json={"email": "change-password@example.com", "password": "NewPassword123!"},
    ).status_code == 200
