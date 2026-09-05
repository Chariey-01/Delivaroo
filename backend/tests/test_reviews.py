from uuid import UUID

from app.extensions import db
from app.models import AuditLog, Notification, Review
from tests.conftest import auth_headers_for


def deliver(parcel, db_session):
    parcel.status = "DELIVERED"
    db_session.commit()


def post_review(client, app, user, parcel, **overrides):
    payload = {"parcel_id": str(parcel.id), "rating": 5, "comment": "Fast, careful delivery."}
    payload.update(overrides)
    return client.post("/api/reviews", headers=auth_headers_for(app, user), json=payload)


def test_review_requires_owner_and_delivered_parcel(client, app, sample_user, sample_admin, sample_parcel, db_session):
    assert post_review(client, app, sample_user, sample_parcel).status_code == 409
    deliver(sample_parcel, db_session)
    assert post_review(client, app, sample_admin, sample_parcel).status_code == 404


def test_review_validation_pending_and_one_per_parcel(client, app, sample_user, sample_parcel, db_session):
    deliver(sample_parcel, db_session)
    assert post_review(client, app, sample_user, sample_parcel, rating=0).status_code == 400
    assert post_review(client, app, sample_user, sample_parcel, rating=4.5).status_code == 400
    assert post_review(client, app, sample_user, sample_parcel, comment="short").status_code == 400
    created = post_review(client, app, sample_user, sample_parcel)
    assert created.status_code == 201
    assert created.get_json()["data"]["status"] == "pending"
    assert post_review(client, app, sample_user, sample_parcel).status_code == 409


def test_only_admin_moderates_and_public_only_shows_approved(
    client, app, sample_user, sample_admin, sample_parcel, db_session
):
    deliver(sample_parcel, db_session)
    review_id = post_review(client, app, sample_user, sample_parcel).get_json()["data"]["id"]
    user_headers = auth_headers_for(app, sample_user)
    admin_headers = auth_headers_for(app, sample_admin)
    assert client.patch(f"/api/admin/reviews/{review_id}/approve", headers=user_headers).status_code == 403
    assert client.get("/api/reviews/public").get_json()["data"]["items"] == []
    approved = client.patch(f"/api/admin/reviews/{review_id}/approve", headers=admin_headers)
    assert approved.status_code == 200
    public = client.get("/api/reviews/public?page=1&per_page=1").get_json()["data"]
    assert public["pagination"]["total"] == 1
    assert public["items"][0]["verified_delivery"] is True
    assert "user_id" not in public["items"][0]
    assert AuditLog.query.filter_by(entity_type="review").count() == 1
    assert Notification.query.filter_by(event_type="REVIEW_APPROVED").count() == 1


def test_rejected_review_stays_private_and_lists_are_paginated(
    client, app, sample_user, sample_admin, sample_parcel, db_session
):
    deliver(sample_parcel, db_session)
    review_id = post_review(client, app, sample_user, sample_parcel, comment="It arrived, but later than expected.").get_json()["data"]["id"]
    admin_headers = auth_headers_for(app, sample_admin)
    assert client.get("/api/admin/reviews?status=pending", headers=admin_headers).get_json()["data"]["pagination"]["total"] == 1
    assert client.patch(f"/api/admin/reviews/{review_id}/reject", headers=admin_headers).status_code == 200
    assert client.get("/api/reviews/public").get_json()["data"]["items"] == []
    assert db.session.get(Review, UUID(review_id)).status == "rejected"


def test_admin_dashboard_uses_database_aggregates(client, app, sample_admin, sample_parcel):
    response = client.get("/api/admin/dashboard", headers=auth_headers_for(app, sample_admin))
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["total"] == 1
    assert data["status_totals"]["PENDING"] == 1
    assert data["transport_mode_totals"]["MOTORBIKE"] == 1
    assert data["review_counts"]["pending"] == 0
