import uuid
import pytest

from app.models.status_history import StatusHistory
from app.services.parcel_update_service import (
    update_parcel_destination,
    NotParcelOwnerError,
    ParcelNotUpdatableError,
    InvalidDestinationError,
)


@pytest.fixture
def other_user(db_session):
    from app.models import User

    user = User(
        email=f"other_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="hashed_password_placeholder",
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def sample_parcel_with_pickup(db_session, sample_user, sample_weight_category):
    from app.models import Parcel

    parcel = Parcel(
        tracking_number=f"TRK{uuid.uuid4().hex[:10].upper()}",
        user_id=sample_user.id,
        weight_category_id=sample_weight_category.id,
        pickup_address="123 Pickup St",
        pickup_latitude=-1.2921,
        pickup_longitude=36.8219,
        destination_address="456 Old Destination Ave",
        destination_latitude=-1.30,
        destination_longitude=36.83,
        status="PENDING",
        price=500,
    )
    db_session.add(parcel)
    db_session.commit()
    return parcel


# --- Success case ---

def test_owner_can_update_destination(db_session, sample_parcel_with_pickup, sample_user):
    updated = update_parcel_destination(
        parcel=sample_parcel_with_pickup,
        requester_id=sample_user.id,
        new_address="789 New Destination Rd",
        new_latitude=-1.35,
        new_longitude=36.90,
    )

    assert updated.destination_address == "789 New Destination Rd"
    assert float(updated.destination_latitude) == -1.35
    assert float(updated.destination_longitude) == 36.90


def test_update_accepts_string_requester_id(db_session, sample_parcel_with_pickup, sample_user):
    # get_jwt_identity() returns a string in the real request flow
    updated = update_parcel_destination(
        parcel=sample_parcel_with_pickup,
        requester_id=str(sample_user.id),
        new_address="789 New Destination Rd",
        new_latitude=-1.35,
        new_longitude=36.90,
    )
    assert updated.destination_address == "789 New Destination Rd"


# --- Ownership rejection ---

def test_non_owner_cannot_update_destination(db_session, sample_parcel_with_pickup, other_user):
    with pytest.raises(NotParcelOwnerError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=other_user.id,
            new_address="Hijacked Destination",
            new_latitude=-1.4,
            new_longitude=36.95,
        )

    # Original destination must be untouched
    assert sample_parcel_with_pickup.destination_address == "456 Old Destination Ave"


# --- Delivered-status rejection ---

def test_delivered_parcel_cannot_be_updated(db_session, sample_parcel_with_pickup, sample_user):
    sample_parcel_with_pickup.status = "DELIVERED"
    db_session.commit()

    with pytest.raises(ParcelNotUpdatableError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="Too Late Destination",
            new_latitude=-1.4,
            new_longitude=36.95,
        )

    assert sample_parcel_with_pickup.destination_address == "456 Old Destination Ave"


def test_cancelled_parcel_cannot_be_updated(db_session, sample_parcel_with_pickup, sample_user):
    sample_parcel_with_pickup.status = "CANCELLED"
    db_session.commit()

    with pytest.raises(ParcelNotUpdatableError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="Too Late Destination",
            new_latitude=-1.4,
            new_longitude=36.95,
        )


# --- Destination validation ---

def test_update_rejects_missing_address(db_session, sample_parcel_with_pickup, sample_user):
    with pytest.raises(InvalidDestinationError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="",
            new_latitude=-1.4,
            new_longitude=36.95,
        )


def test_update_rejects_missing_coordinates(db_session, sample_parcel_with_pickup, sample_user):
    with pytest.raises(InvalidDestinationError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="Somewhere",
            new_latitude=None,
            new_longitude=36.95,
        )


def test_update_rejects_out_of_range_latitude(db_session, sample_parcel_with_pickup, sample_user):
    with pytest.raises(InvalidDestinationError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="Somewhere",
            new_latitude=95,  # invalid, max is 90
            new_longitude=36.95,
        )


def test_update_rejects_non_numeric_coordinates(db_session, sample_parcel_with_pickup, sample_user):
    with pytest.raises(InvalidDestinationError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=sample_user.id,
            new_address="Somewhere",
            new_latitude="not-a-number",
            new_longitude=36.95,
        )


# --- Distance / price recalculation ---

def test_update_recalculates_distance_and_duration(db_session, sample_parcel_with_pickup, sample_user):
    original_distance = sample_parcel_with_pickup.distance

    update_parcel_destination(
        parcel=sample_parcel_with_pickup,
        requester_id=sample_user.id,
        new_address="Far Away Destination",
        new_latitude=-1.5,
        new_longitude=37.0,
    )

    assert sample_parcel_with_pickup.distance is not None
    assert sample_parcel_with_pickup.distance != original_distance
    assert sample_parcel_with_pickup.duration is not None
    assert sample_parcel_with_pickup.duration > 0


def test_update_recalculates_price_using_weight_category_rates(
    db_session, sample_parcel_with_pickup, sample_user, sample_weight_category
):
    update_parcel_destination(
        parcel=sample_parcel_with_pickup,
        requester_id=sample_user.id,
        new_address="Far Away Destination",
        new_latitude=-1.5,
        new_longitude=37.0,
    )

    expected_price = round(
        float(sample_weight_category.base_price)
        + float(sample_weight_category.price_per_km) * float(sample_parcel_with_pickup.distance),
        2,
    )
    assert float(sample_parcel_with_pickup.price) == expected_price


# --- Audit trail ---

def test_update_creates_status_history_audit_row(db_session, sample_parcel_with_pickup, sample_user):
    update_parcel_destination(
        parcel=sample_parcel_with_pickup,
        requester_id=sample_user.id,
        new_address="Audited Destination",
        new_latitude=-1.4,
        new_longitude=36.95,
    )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel_with_pickup.id).all()
    assert len(entries) == 1
    assert "Audited Destination" in entries[0].notes
    assert entries[0].changed_by == sample_user.id


def test_failed_update_does_not_create_audit_row(db_session, sample_parcel_with_pickup, other_user):
    with pytest.raises(NotParcelOwnerError):
        update_parcel_destination(
            parcel=sample_parcel_with_pickup,
            requester_id=other_user.id,
            new_address="Should Not Be Recorded",
            new_latitude=-1.4,
            new_longitude=36.95,
        )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel_with_pickup.id).all()
    assert len(entries) == 0