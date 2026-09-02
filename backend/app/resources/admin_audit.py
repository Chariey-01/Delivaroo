import json

from flask_restful import Resource

from app.extensions import db
from app.models import AuditLog, User
from app.utils.auth_decorators import staff_required


def _decode(value):
    if value is None:
        return None
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return value


def serialize_audit(entry):
    actor = db.session.get(User, entry.user_id) if entry.user_id else None
    detail = _decode(entry.new_value)
    return {
        "id": str(entry.id),
        "actor": actor.email if actor else "system",
        "actorEmail": actor.email if actor else None,
        "action": entry.action,
        "subject": entry.entity_type,
        "target": str(entry.entity_id) if entry.entity_id else None,
        "detail": detail,
        "oldValue": _decode(entry.old_value),
        "newValue": detail,
        "createdAt": entry.created_at.isoformat() if entry.created_at else None,
    }


class AdminAuditResource(Resource):
    @staff_required
    def get(self):
        entries = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(300).all()
        return {"data": [serialize_audit(entry) for entry in entries]}, 200
