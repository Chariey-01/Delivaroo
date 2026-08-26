import pytest

from app.models.status_history import StatusHistory
from app.services.status_history_service import (
    record_status_change,
    record_location_change,
    InvalidStatusError,
    InvalidStatusTransitionError,
)


# --- Status change tests ---

def test_record_status_change_creates_history_entry(db_session, sample_parcel, sample_user):
    record_status_change(
        parcel=sample_parcel,
        new_status="PICKED_UP",
        changed_by_id=sample_user.id,
    )

    assert sample_parcel.status == "PICKED_UP"
    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 1
    assert entries[0].status == "PICKED_UP"
    assert entries[0].changed_by == sample_user.id


def test_record_status_change_creates_history_row_for_every_status(db_session, sample_parcel, sample_user):
    flow = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"]

    for status in flow:
        record_status_change(sample_parcel, status, sample_user.id)

    entries = (
        StatusHistory.query.filter_by(parcel_id=sample_parcel.id)
        .order_by(StatusHistory.created_at)
        .all()
    )
    assert len(entries) == len(flow)
    assert [e.status for e in entries] == flow
    assert sample_parcel.status == "DELIVERED"


def test_record_status_change_rejects_invalid_status(db_session, sample_parcel, sample_user):
    with pytest.raises(InvalidStatusError):
        record_status_change(sample_parcel, "TELEPORTED", sample_user.id)

    # No history row should have been created
    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 0
    # Parcel status must remain unchanged
    assert sample_parcel.status == "PENDING"


def test_record_status_change_rejects_invalid_transition(db_session, sample_parcel, sample_user):
    # PENDING -> DELIVERED is not a valid direct transition
    with pytest.raises(InvalidStatusTransitionError):
        record_status_change(sample_parcel, "DELIVERED", sample_user.id)

    assert sample_parcel.status == "PENDING"
    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 0


def test_delivered_parcel_cannot_transition_back_to_pending(db_session, sample_parcel, sample_user):
    record_status_change(sample_parcel, "PICKED_UP", sample_user.id)
    record_status_change(sample_parcel, "IN_TRANSIT", sample_user.id)
    record_status_change(sample_parcel, "OUT_FOR_DELIVERY", sample_user.id)
    record_status_change(sample_parcel, "DELIVERED", sample_user.id)

    with pytest.raises(InvalidStatusTransitionError):
        record_status_change(sample_parcel, "PENDING", sample_user.id)

    assert sample_parcel.status == "DELIVERED"


def test_cancelled_parcel_has_no_further_transitions(db_session, sample_parcel, sample_user):
    record_status_change(sample_parcel, "CANCELLED", sample_user.id)

    with pytest.raises(InvalidStatusTransitionError):
        record_status_change(sample_parcel, "PICKED_UP", sample_user.id)

    assert sample_parcel.status == "CANCELLED"


# --- Location change tests ---

def test_record_location_change_creates_history_entry(db_session, sample_parcel, sample_user):
    record_location_change(
        parcel=sample_parcel,
        latitude=-1.2921,
        longitude=36.8219,
        changed_by_id=sample_user.id,
    )

    assert float(sample_parcel.present_latitude) == -1.2921
    assert float(sample_parcel.present_longitude) == 36.8219

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 1
    assert float(entries[0].latitude) == -1.2921
    assert float(entries[0].longitude) == 36.8219


def test_record_location_change_does_not_alter_status(db_session, sample_parcel, sample_user):
    record_status_change(sample_parcel, "PICKED_UP", sample_user.id)
    record_location_change(sample_parcel, -1.3, 36.8, sample_user.id)

    assert sample_parcel.status == "PICKED_UP"
    entries = (
        StatusHistory.query.filter_by(parcel_id=sample_parcel.id)
        .order_by(StatusHistory.created_at)
        .all()
    )
    assert len(entries) == 2
    # Second entry (location change) should log the status at the time, unchanged
    assert entries[1].status == "PICKED_UP"


def test_multiple_location_changes_each_create_a_history_row(db_session, sample_parcel, sample_user):
    record_location_change(sample_parcel, -1.1, 36.1, sample_user.id)
    record_location_change(sample_parcel, -1.2, 36.2, sample_user.id)
    record_location_change(sample_parcel, -1.3, 36.3, sample_user.id)

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 3


# --- Relationship / ordering ---

def test_status_history_is_append_only_and_ordered(db_session, sample_parcel, sample_user):
    record_status_change(sample_parcel, "PICKED_UP", sample_user.id)
    record_status_change(sample_parcel, "IN_TRANSIT", sample_user.id)

    # Access via the Parcel relationship, not a raw query
    history = sample_parcel.status_history
    assert len(history) == 2
    assert history[0].status == "PICKED_UP"
    assert history[1].status == "IN_TRANSIT"