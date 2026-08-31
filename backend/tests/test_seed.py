from decimal import Decimal

import pytest

from app.models import Address, AuditLog, Parcel, StatusHistory, User, WeightCategory
from app.services.admin_parcel_service import list_all_parcels
from app.services.parcel_service import calculate_parcel_price
from app.services.status_history_service import VALID_STATUSES
from app.utils.security import verify_password
from seed import (
    DEMO_ADMIN_EMAIL,
    DEMO_TRACKING_PREFIX,
    STATUS_DISTRIBUTION,
    demo_counts,
    seed_demo_data,
)


def test_seed_creates_a_complete_idempotent_demo_dataset(app, db_session, monkeypatch):
    monkeypatch.setenv("DEMO_ADMIN_PASSWORD", "AdminDemoPass123!")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "UserDemoPass123!")

    with app.app_context():
        first_counts = seed_demo_data()
        second_counts = seed_demo_data()

        assert first_counts == second_counts == {
            "users": 13,
            "weight_categories": 4,
            "parcels": 84,
            "addresses": 24,
            "status_history": 277,
            "audit_logs": 277,
        }
        assert User.query.filter_by(email=DEMO_ADMIN_EMAIL, role="admin").count() == 1
        admin = User.query.filter_by(email=DEMO_ADMIN_EMAIL).one()
        assert verify_password("AdminDemoPass123!", admin.password_hash)
        assert Parcel.query.filter(Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%")).count() == 84
        assert len({parcel.tracking_number for parcel in Parcel.query.all()}) == 84
        assert {status for status, _ in STATUS_DISTRIBUTION} == VALID_STATUSES
        assert {
            status
            for (status,) in db_session.query(Parcel.status).filter(
                Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%")
            )
        } == VALID_STATUSES
        assert Address.query.count() == 24
        assert StatusHistory.query.count() == 277
        assert AuditLog.query.filter_by(entity_type="parcel").count() == 277


def test_seeded_demo_data_supports_admin_pagination_and_pricing(app, db_session):
    with app.app_context():
        seed_demo_data()
        page = list_all_parcels(page=1, per_page=20)
        assert page["pagination"]["total_items"] == 84
        assert page["pagination"]["total_pages"] == 5
        assert page["pagination"]["has_next"] is True

        parcel = Parcel.query.filter(Parcel.tracking_number.like(f"{DEMO_TRACKING_PREFIX}%")).first()
        category = db_session.get(WeightCategory, parcel.weight_category_id)
        assert parcel.price == calculate_parcel_price(category, parcel.distance).quantize(Decimal("0.01"))
        assert db_session.get(User, parcel.user_id).role == "user"


def test_seeded_status_history_and_audit_entries_are_chronological(app, db_session):
    with app.app_context():
        seed_demo_data()
        parcel = Parcel.query.filter_by(tracking_number=f"{DEMO_TRACKING_PREFIX}0064").one()
        history = StatusHistory.query.filter_by(parcel_id=parcel.id).order_by(StatusHistory.created_at).all()
        assert [entry.status for entry in history[:5]] == [
            "PENDING",
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
        ]
        assert [entry.created_at for entry in history] == sorted(entry.created_at for entry in history)
        assert AuditLog.query.filter_by(entity_type="parcel", entity_id=parcel.id).count() == 5


def test_demo_reset_is_blocked_in_production(app, db_session, monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    with app.app_context(), pytest.raises(RuntimeError, match="Refusing to reset demo data"):
        seed_demo_data(reset=True)


def test_demo_reset_only_replaces_demo_records(app, db_session, monkeypatch):
    with app.app_context():
        seed_demo_data()
        non_demo_user = User(email="team@example.com", password_hash="hash", role="user", is_active=True)
        db_session.add(non_demo_user)
        db_session.commit()

        monkeypatch.setenv("FLASK_ENV", "development")
        seed_demo_data(reset=True)

        assert db_session.get(User, non_demo_user.id) is not None
        assert demo_counts()["parcels"] == 84
