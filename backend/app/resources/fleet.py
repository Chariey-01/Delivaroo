from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource
from uuid import UUID

from app.extensions import db
from app.services.audit_log_service import record_audit_log
from app.services.fleet_service import get_fleet, set_fleet_status
from app.utils.auth_decorators import staff_required


class FleetAvailabilityResource(Resource):
    def get(self):
        return {"data": get_fleet()}, 200


class AdminFleetAvailabilityResource(Resource):
    @staff_required
    def patch(self):
        data = request.get_json(silent=True) or {}
        mode = data.get("mode")
        status = data.get("status")

        try:
            fleet = set_fleet_status(mode, status)
        except ValueError as error:
            return {"message": str(error)}, 400

        record_audit_log(
            user_id=UUID(get_jwt_identity()),
            action="fleet.status_changed",
            entity_type="transport_availability",
            entity_id=None,
            new_value={"mode": mode, "status": status},
            ip_address=request.remote_addr,
        )
        db.session.commit()
        return {"data": fleet}, 200
