import uuid
import pytest

from app.services.admin_parcel_service import list_all_parcels, InvalidFilterError


@pytest.fixture
def second_user(db_session):
    from app.models import User

    user = User(
        email=f"second_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def multiple_parcels(db_session, sample_user, second_user, sample_weight_category):
    from app.models import Parcel

    parcels = []
    statuses = ["PENDING", "IN_TRANSIT", "DELIVERED"]
    owners = [sample_user, sample_user, second_user]

    for i, (status, owner) in enumerate(zip(statuses, owners)):
        parcel = Parcel(
            tracking_number=f"TRK{i:04d}{uuid.uuid4().hex[:6].upper()}",
            user_id=owner.id,
            weight_category_id=sample_weight_category.id,
            pickup_address=f"Pickup {i}",
            destination_address=f"Destination {i}",
            status=status,
            price=100 * (i + 1),
        )
        db_session.add(parcel)
        parcels.append(parcel)

    db_session.commit()
    return parcels


# --- Basic listing ---

def test_list_all_parcels_returns_all_parcels(db_session, multiple_parcels):
    result = list_all_parcels()

    assert len(result["parcels"]) == 3
    assert result["pagination"]["total_items"] == 3


def test_each_parcel_includes_owner_email(db_session, multiple_parcels, sample_user):
    result = list_all_parcels()

    owner_emails = [p["owner"]["email"] for p in result["parcels"]]
    assert sample_user.email in owner_emails


# --- Status filtering ---

def test_filter_by_status(db_session, multiple_parcels):
    result = list_all_parcels(status="DELIVERED")

    assert len(result["parcels"]) == 1
    assert result["parcels"][0]["status"] == "DELIVERED"


def test_filter_by_invalid_status_raises_error(db_session, multiple_parcels):
    with pytest.raises(InvalidFilterError):
        list_all_parcels(status="NOT_A_REAL_STATUS")


# --- Tracking number search ---

def test_search_by_tracking_number_substring(db_session, multiple_parcels):
    target = multiple_parcels[0].tracking_number
    partial = target[3:8]

    result = list_all_parcels(tracking_number=partial)

    assert any(p["tracking_number"] == target for p in result["parcels"])


def test_search_with_no_matches_returns_empty(db_session, multiple_parcels):
    result = list_all_parcels(tracking_number="NOMATCHXYZ999")

    assert len(result["parcels"]) == 0
    assert result["pagination"]["total_items"] == 0


# --- Pagination ---

def test_pagination_limits_results_per_page(db_session, multiple_parcels):
    result = list_all_parcels(page=1, per_page=2)

    assert len(result["parcels"]) == 2
    assert result["pagination"]["total_items"] == 3
    assert result["pagination"]["total_pages"] == 2
    assert result["pagination"]["has_next"] is True


def test_pagination_second_page(db_session, multiple_parcels):
    result = list_all_parcels(page=2, per_page=2)

    assert len(result["parcels"]) == 1
    assert result["pagination"]["has_next"] is False
    assert result["pagination"]["has_prev"] is True


def test_pagination_rejects_invalid_page(db_session, multiple_parcels):
    with pytest.raises(InvalidFilterError):
        list_all_parcels(page=0)


def test_pagination_rejects_per_page_over_limit(db_session, multiple_parcels):
    with pytest.raises(InvalidFilterError):
        list_all_parcels(per_page=101)
