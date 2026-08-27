import uuid
import pytest

from app.models.status_history import StatusHistory
from app.services.parcel_cancel_service import (
    cancel_parcel,
    NotParcelOwnerError,
    ParcelNotCancellableError,
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


# --- Success case ---

def test_owner_can_cancel_parcel(db_session, sample_parcel, sample_user):
    cancelled = cancel_parcel(parcel=sample_parcel, requester_id=sample_user.id)

    assert cancelled.status == "CANCELLED"


def test_cancel_accepts_string_requester_id(db_session, sample_parcel, sample_user):
    cancelled = cancel_parcel(parcel=sample_parcel, requester_id=str(sample_user.id))
    assert cancelled.status == "CANCELLED"


def test_cancel_creates_status_history_audit_row(db_session, sample_parcel, sample_user):
    cancel_parcel(parcel=sample_parcel, requester_id=sample_user.id)

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 1
    assert entries[0].status == "CANCELLED"
    assert entries[0].changed_by == sample_user.id


# --- Ownership rejection ---

def test_non_owner_cannot_cancel_parcel(db_session, sample_parcel, other_user):
    with pytest.raises(NotParcelOwnerError):
        cancel_parcel(parcel=sample_parcel, requester_id=other_user.id)

    assert sample_parcel.status == "PENDING"


def test_failed_cancel_does_not_create_audit_row(db_session, sample_parcel, other_user):
    with pytest.raises(NotParcelOwnerError):
        cancel_parcel(parcel=sample_parcel, requester_id=other_user.id)

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 0


# --- Terminal-state rejection ---

def test_delivered_parcel_cannot_be_cancelled(db_session, sample_parcel, sample_user):
    sample_parcel.status = "DELIVERED"
    db_session.commit()

    with pytest.raises(ParcelNotCancellableError):
        cancel_parcel(parcel=sample_parcel, requester_id=sample_user.id)

    assert sample_parcel.status == "DELIVERED"


def test_already_cancelled_parcel_cannot_be_cancelled_again(db_session, sample_parcel, sample_user):
    sample_parcel.status = "CANCELLED"
    db_session.commit()

    with pytest.raises(ParcelNotCancellableError):
        cancel_parcel(parcel=sample_parcel, requester_id=sample_user.id)


def test_delivered_rejection_does_not_create_audit_row(db_session, sample_parcel, sample_user):
    sample_parcel.status = "DELIVERED"
    db_session.commit()

    with pytest.raises(ParcelNotCancellableError):
        cancel_parcel(parcel=sample_parcel, requester_id=sample_user.id)

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 0
