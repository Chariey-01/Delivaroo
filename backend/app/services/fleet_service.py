from app.extensions import db
from app.models import TransportAvailability


DEFAULT_FLEET = {
    "ROAD": "AVAILABLE",
    "MOTORBIKE": "AVAILABLE",
    "AIR": "AVAILABLE",
    "SHIP": "AVAILABLE",
    "DRONE": "AVAILABLE",
}
VALID_STATUSES = {"AVAILABLE", "BUSY", "OFFLINE"}


def get_fleet():
    values = DEFAULT_FLEET.copy()
    for row in TransportAvailability.query.all():
        values[row.mode] = row.status
    return values


def set_fleet_status(mode, status):
    if mode not in DEFAULT_FLEET:
        raise ValueError(f"Unknown transport mode {mode}.")
    if status not in VALID_STATUSES:
        raise ValueError(f"Unknown availability {status}.")

    row = db.session.get(TransportAvailability, mode)
    if row is None:
        row = TransportAvailability(mode=mode)
        db.session.add(row)
    row.status = status
    db.session.commit()
    return get_fleet()
