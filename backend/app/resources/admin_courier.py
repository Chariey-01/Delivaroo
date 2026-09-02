from uuid import UUID

from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource

from app.extensions import db
from app.models import DeliveryAgent, Parcel
from app.services.audit_log_service import record_audit_log
from app.utils.auth_decorators import staff_required


def serialize_courier(agent):
    jobs = Parcel.query.filter_by(delivery_agent_id=agent.id).all()
    active_statuses = {"PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"}
    data = agent.to_dict()
    data.update(
        {
            "vehicleMode": "ROAD" if agent.transport_mode == "TRUCK" else agent.transport_mode,
            "vehicle": data["transport_label"],
            "plate": agent.email,
            "activeJobs": sum(1 for job in jobs if job.status in active_statuses),
            "completedJobs": sum(1 for job in jobs if job.status == "DELIVERED"),
        }
    )
    return data


class AdminCourierListResource(Resource):
    @staff_required
    def get(self):
        agents = DeliveryAgent.query.order_by(DeliveryAgent.name.asc()).all()
        return {"data": [serialize_courier(agent) for agent in agents]}, 200


class AdminCourierShiftResource(Resource):
    @staff_required
    def patch(self, courier_id):
        data = request.get_json(silent=True) or {}
        try:
            agent_uuid = UUID(str(courier_id))
        except (TypeError, ValueError):
            return {"message": "Delivery agent not found"}, 404

        agent = db.session.get(DeliveryAgent, agent_uuid)
        if not agent:
            return {"message": "Delivery agent not found"}, 404

        agent.is_active = bool(data.get("onShift"))
        record_audit_log(
            user_id=UUID(get_jwt_identity()),
            action="courier.shift_changed",
            entity_type="delivery_agent",
            entity_id=agent.id,
            new_value={"onShift": agent.is_active},
            ip_address=request.remote_addr,
        )
        db.session.commit()
        agents = DeliveryAgent.query.order_by(DeliveryAgent.name.asc()).all()
        return {"data": [serialize_courier(entry) for entry in agents]}, 200
