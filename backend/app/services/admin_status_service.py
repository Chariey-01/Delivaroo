import uuid

from app.services.status_history_service import (
    record_status_change,
    VALID_STATUSES,
    InvalidStatusError,
    InvalidStatusTransitionError,
)


def admin_update_status(parcel, new_status, admin_id, notes=None):
    """
    Updates a parcel's status as an admin action. Validates the status
    and the transition, then records the change in StatusHistory via
    record_status_change() (reused directly - same validation rules
    apply regardless of who initiates the change).
    """
    if isinstance(admin_id, str):
        admin_id = uuid.UUID(admin_id)

    return record_status_change(
        parcel=parcel,
        new_status=new_status,
        changed_by_id=admin_id,
        notes=notes or f"Status updated to {new_status} by admin",
    )
