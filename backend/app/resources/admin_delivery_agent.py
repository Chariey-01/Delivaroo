from uuid import UUID

from flask import current_app, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from app.extensions import db
from app.models import DeliveryAgent, Parcel
from app.services.notification_service import notify_event
from app.services.status_history_service import record_status_change
from app.utils.auth_decorators import STAFF_ROLES


class AdminParcelDeliveryAgentResource(Resource):
    @jwt_required()
    def patch(self, parcel_id):
        data = request.get_json(silent=True) or {}
        agent_id = data.get("delivery_agent_id") or data.get("deliveryAgentId")

        parcel = db.session.get(Parcel, parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404

        requester_id = UUID(get_jwt_identity())
        is_staff = get_jwt().get("role") in STAFF_ROLES

        if not is_staff and parcel.user_id != requester_id:
            return {"message": "Parcel not found"}, 404

        if agent_id and not is_staff:
            return {"message": "Staff access required"}, 403

        if agent_id:
            try:
                agent_uuid = UUID(str(agent_id))
            except (TypeError, ValueError):
                return {"message": "delivery_agent_id is invalid"}, 400
            agent = db.session.get(DeliveryAgent, agent_uuid)
        else:
            agent = (
                DeliveryAgent.query.filter_by(
                    transport_mode=parcel.transport_mode,
                    is_active=True,
                )
                .order_by(DeliveryAgent.created_at.asc())
                .first()
            )

        if not agent:
            return {"message": "Delivery agent not found"}, 404
        if not agent.is_active:
            return {"message": "Delivery agent is inactive"}, 409

        if parcel.delivery_agent_id != agent.id:
            parcel.delivery_agent_id = agent.id
            if parcel.status == "PENDING":
                record_status_change(
                    parcel=parcel,
                    new_status="ASSIGNED",
                    changed_by_id=requester_id,
                    notes=f"Delivery agent assigned: {agent.name}",
                    audit_action="parcel.agent_assigned",
                )
            else:
                db.session.commit()
            try:
                notify_event(
                    current_app._get_current_object(),
                    recipient_user_id=parcel.user_id,
                    actor_user_id=get_jwt_identity(),
                    event_type="PARCEL_AGENT_ASSIGNED",
                    parcel=parcel,
                    metadata={"tracking_number": parcel.tracking_number},
                    idempotency_key=f"parcel-agent:{parcel.id}:{agent.id}:{parcel.updated_at.isoformat()}",
                )
            except (ValueError, RuntimeError):
                current_app.logger.exception("Unable to create delivery-agent notification")

        parcel_data = parcel.to_dict()
        return {
            "message": "Delivery agent assigned successfully",
            "data": parcel_data,
            "parcel": parcel_data,
        }, 200
