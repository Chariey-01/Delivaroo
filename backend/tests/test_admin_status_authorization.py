from tests.conftest import auth_headers_for


def test_admin_can_change_status_via_endpoint(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/status",
        json={"status": "PICKED_UP"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.get_json()["parcel"]["status"] == "PICKED_UP"


def test_invalid_status_returns_400(client, app, sample_admin, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_admin)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/status",
        json={"status": "NOT_A_REAL_STATUS"},
        headers=headers,
    )

    assert response.status_code == 400


def test_non_admin_gets_403(client, app, sample_user, sample_parcel, db_session):
    headers = auth_headers_for(app, sample_user)

    response = client.patch(
        f"/admin/parcels/{sample_parcel.id}/status",
        json={"status": "PICKED_UP"},
        headers=headers,
    )

    assert response.status_code == 403


def test_status_change_via_endpoint_writes_history_row(client, app, sample_admin, sample_parcel, db_session):
    from app.models.status_history import StatusHistory

    headers = auth_headers_for(app, sample_admin)

    client.patch(
        f"/admin/parcels/{sample_parcel.id}/status",
        json={"status": "PICKED_UP"},
        headers=headers,
    )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 1
