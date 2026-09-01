import json

from app.extensions import db
from app.models.audit_log import AuditLog


def _serialize(value):
    if value is None:
        return None

    return json.dumps(value, default=str, sort_keys=True)


def record_audit_log(
    *,
    user_id,
    action,
    entity_type,
    entity_id,
    old_value=None,
    new_value=None,
    ip_address=None,
):
    """Add an audit record to the caller's current database transaction."""

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=_serialize(old_value),
        new_value=_serialize(new_value),
        ip_address=ip_address,
    )
    db.session.add(entry)
    return entry
