from app.extensions import db
from app.models.status_history import StatusHistory


def record_status_change(parcel, new_status, changed_by_id, latitude=None, longitude=None, notes=None):
    """
    Updates parcel.status and appends an audit row to status_history.
    Does not commit — caller controls the transaction boundary.
    """
    parcel.status = new_status

    entry = StatusHistory(
        parcel_id=parcel.id,
        changed_by=changed_by_id,
        status=new_status,
        latitude=latitude,
        longitude=longitude,
        notes=notes,
    )
    db.session.add(entry)
    return entry