import pytest

from app.models.status_history import StatusHistory
from app.services.admin_status_service import admin_update_status
from app.services.status_history_service import (
    InvalidStatusError,
    InvalidStatusTransitionError,
)


def test_admin_can_change_valid_status(db_session, sample_parcel, sample_admin):
    admin_update_status(
        parcel=sample_parcel,
        new_status="PICKED_UP",
        admin_id=sample_admin.id,
    )

    assert sample_parcel.status == "PICKED_UP"


def test_admin_status_change_accepts_string_admin_id(db_session, sample_parcel, sample_admin):
    admin_update_status(
        parcel=sample_parcel,
        new_status="PICKED_UP",
        admin_id=str(sample_admin.id),
    )
    assert sample_parcel.status == "PICKED_UP"


def test_admin_rejects_invalid_status_value(db_session, sample_parcel, sample_admin):
    with pytest.raises(InvalidStatusError):
        admin_update_status(
            parcel=sample_parcel,
            new_status="NOT_A_REAL_STATUS",
            admin_id=sample_admin.id,
        )


def test_admin_rejects_invalid_transition(db_session, sample_parcel, sample_admin):
    with pytest.raises(InvalidStatusTransitionError):
        admin_update_status(
            parcel=sample_parcel,
            new_status="DELIVERED",
            admin_id=sample_admin.id,
        )


def test_admin_status_change_creates_history_row(db_session, sample_parcel, sample_admin):
    admin_update_status(
        parcel=sample_parcel,
        new_status="PICKED_UP",
        admin_id=sample_admin.id,
    )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert len(entries) == 1
    assert entries[0].status == "PICKED_UP"
    assert entries[0].changed_by == sample_admin.id


def test_admin_status_change_records_custom_notes(db_session, sample_parcel, sample_admin):
    admin_update_status(
        parcel=sample_parcel,
        new_status="PICKED_UP",
        admin_id=sample_admin.id,
        notes="Picked up ahead of schedule",
    )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()
    assert entries[0].notes == "Picked up ahead of schedule"


def test_delivered_parcel_cannot_be_moved_to_another_status(db_session, sample_parcel, sample_admin):
    admin_update_status(sample_parcel, "PICKED_UP", sample_admin.id)
    admin_update_status(sample_parcel, "IN_TRANSIT", sample_admin.id)
    admin_update_status(sample_parcel, "OUT_FOR_DELIVERY", sample_admin.id)
    admin_update_status(sample_parcel, "DELIVERED", sample_admin.id)

    with pytest.raises(InvalidStatusTransitionError):
        admin_update_status(sample_parcel, "CANCELLED", sample_admin.id)

    assert sample_parcel.status == "DELIVERED"
