import json

from app.models import AuditLog
from app.services.admin_location_service import admin_update_location
from app.services.admin_status_service import admin_update_status
from app.services.parcel_cancel_service import cancel_parcel
from app.services.parcel_service import create_parcel
from app.services.parcel_update_service import update_parcel_destination


def test_parcel_creation_records_audit_log(db_session, sample_user, sample_weight_category):
    parcel = create_parcel(
        user_id=sample_user.id,
        weight_category_id=sample_weight_category.id,
        pickup_address="Pickup",
        destination_address="Destination",
    )

    entry = AuditLog.query.filter_by(entity_id=parcel.id).one()
    assert entry.user_id == sample_user.id
    assert entry.action == "parcel.created"
    assert json.loads(entry.new_value) == {"status": "PENDING"}


def test_admin_status_and_location_updates_record_audit_logs(
    db_session,
    sample_parcel,
    sample_admin,
):
    admin_update_status(sample_parcel, "PICKED_UP", sample_admin.id)
    admin_update_location(sample_parcel, -1.2921, 36.8219, admin_id=sample_admin.id)

    entries = AuditLog.query.filter_by(entity_id=sample_parcel.id).order_by(AuditLog.created_at).all()
    assert [entry.action for entry in entries] == [
        "parcel.status_changed",
        "parcel.location_updated",
    ]
    assert json.loads(entries[0].old_value) == {"status": "PENDING"}
    assert json.loads(entries[0].new_value) == {"status": "PICKED_UP"}
    assert json.loads(entries[1].new_value) == {
        "latitude": -1.2921,
        "longitude": 36.8219,
    }


def test_destination_update_and_cancellation_use_specific_audit_actions(
    db_session,
    sample_parcel,
    sample_user,
):
    update_parcel_destination(
        sample_parcel,
        sample_user.id,
        "Updated destination",
        -1.31,
        36.84,
    )
    cancel_parcel(sample_parcel, sample_user.id)

    entries = AuditLog.query.filter_by(entity_id=sample_parcel.id).order_by(AuditLog.created_at).all()
    assert [entry.action for entry in entries] == [
        "parcel.destination_updated",
        "parcel.cancelled",
    ]
    assert json.loads(entries[0].old_value) == {"address": "456 Destination Ave"}
    assert json.loads(entries[0].new_value) == {"address": "Updated destination"}
    assert json.loads(entries[1].new_value) == {"status": "CANCELLED"}
