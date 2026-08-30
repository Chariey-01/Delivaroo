import pytest

from app.models.status_history import StatusHistory
from app.services.admin_location_service import (
    InvalidLocationError,
    ParcelLocationLockedError,
    admin_update_location,
)


def test_admin_can_update_location(db_session, sample_parcel, sample_admin):
    admin_update_location(
        parcel=sample_parcel,
        latitude=-1.2921,
        longitude=36.8219,
        address="Nairobi CBD",
        admin_id=sample_admin.id,
    )

    assert float(sample_parcel.present_latitude) == -1.2921
    assert float(sample_parcel.present_longitude) == 36.8219


def test_location_update_creates_history_row(db_session, sample_parcel, sample_admin):
    admin_update_location(
        parcel=sample_parcel,
        latitude=-1.2921,
        longitude=36.8219,
        admin_id=sample_admin.id,
    )

    entries = StatusHistory.query.filter_by(parcel_id=sample_parcel.id).all()

    assert len(entries) == 1
    assert entries[0].changed_by == sample_admin.id
    assert float(entries[0].latitude) == -1.2921


def test_location_update_does_not_alter_status(db_session, sample_parcel, sample_admin):
    sample_parcel.status = "IN_TRANSIT"

    admin_update_location(
        parcel=sample_parcel,
        latitude=-1.2921,
        longitude=36.8219,
        admin_id=sample_admin.id,
    )

    assert sample_parcel.status == "IN_TRANSIT"


def test_rejects_missing_coordinates(db_session, sample_parcel, sample_admin):
    with pytest.raises(InvalidLocationError):
        admin_update_location(
            parcel=sample_parcel,
            latitude=None,
            longitude=36.8219,
            admin_id=sample_admin.id,
        )


def test_rejects_out_of_range_latitude(db_session, sample_parcel, sample_admin):
    with pytest.raises(InvalidLocationError):
        admin_update_location(
            parcel=sample_parcel,
            latitude=95,
            longitude=36.8219,
            admin_id=sample_admin.id,
        )


def test_rejects_non_numeric_coordinates(db_session, sample_parcel, sample_admin):
    with pytest.raises(InvalidLocationError):
        admin_update_location(
            parcel=sample_parcel,
            latitude="not-a-number",
            longitude=36.8219,
            admin_id=sample_admin.id,
        )


def test_rejects_location_update_on_delivered_parcel(
    db_session,
    sample_parcel,
    sample_admin,
):
    sample_parcel.status = "DELIVERED"
    db_session.commit()

    with pytest.raises(ParcelLocationLockedError):
        admin_update_location(
            parcel=sample_parcel,
            latitude=-1.2921,
            longitude=36.8219,
            admin_id=sample_admin.id,
        )


def test_rejects_location_update_on_cancelled_parcel(
    db_session,
    sample_parcel,
    sample_admin,
):
    sample_parcel.status = "CANCELLED"
    db_session.commit()

    with pytest.raises(ParcelLocationLockedError):
        admin_update_location(
            parcel=sample_parcel,
            latitude=-1.2921,
            longitude=36.8219,
            admin_id=sample_admin.id,
        )
