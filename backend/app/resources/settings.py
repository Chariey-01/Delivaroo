from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource
from uuid import UUID

from app.services.audit_log_service import record_audit_log
from app.services.platform_settings_service import get_settings, update_settings
from app.extensions import db
from app.utils.auth_decorators import admin_required


class SettingsResource(Resource):
    def get(self):
        return {"data": get_settings()}, 200


class AdminSettingsResource(Resource):
    @admin_required
    def patch(self):
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return {"message": "Request body is required"}, 400

        current = get_settings()
        updated = update_settings(data)
        record_audit_log(
            user_id=UUID(get_jwt_identity()),
            action="settings.updated",
            entity_type="settings",
            entity_id=None,
            old_value=current,
            new_value=updated,
            ip_address=request.remote_addr,
        )
        db.session.commit()
        return {"data": updated}, 200
