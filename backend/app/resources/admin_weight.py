from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import UUID

from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource

from app.extensions import db
from app.models import Parcel, User
from app.services.audit_log_service import record_audit_log
from app.utils.auth_decorators import staff_required


MAX_WEIGHT_KG = Decimal("1000")
WEIGHABLE_STATUSES = {"PENDING", "ASSIGNED", "PICKED_UP"}


class AdminParcelWeightResource(Resource):
    @staff_required
    def patch(self, parcel_id):
        data = request.get_json(silent=True) or {}
        raw_weight = data.get("weightKg", data.get("weight_kg", data.get("verified_weight_kg")))

        try:
            weight = Decimal(str(raw_weight))
        except (InvalidOperation, TypeError, ValueError):
            return {"message": "Enter the weight from the scale, in kilograms."}, 400

        if weight <= 0:
            return {"message": "Enter the weight from the scale, in kilograms."}, 400
        if weight > MAX_WEIGHT_KG:
            return {"message": f"We cannot carry more than {MAX_WEIGHT_KG} kg."}, 400

        parcel = db.session.get(Parcel, parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404
        if parcel.status not in WEIGHABLE_STATUSES:
            return {"message": "The parcel is already in transit. The fare is settled and cannot be worked out again."}, 409

        actor_id = UUID(get_jwt_identity())
        old_weight = parcel.verified_weight_kg
        parcel.verified_weight_kg = weight.quantize(Decimal("0.01"))
        parcel.weighed_at = datetime.now(timezone.utc)
        parcel.weighed_by = actor_id

        record_audit_log(
            user_id=actor_id,
            action="parcel.weight_verified",
            entity_type="parcel",
            entity_id=parcel.id,
            old_value={"verified_weight_kg": old_weight},
            new_value={"verified_weight_kg": parcel.verified_weight_kg},
            ip_address=request.remote_addr,
        )
        db.session.commit()

        data = parcel.to_dict()
        user = db.session.get(User, parcel.weighed_by) if parcel.weighed_by else None
        data["weighed_by"] = user.email if user else data["weighed_by"]
        return {"message": "Parcel weight verified successfully", "data": data, "parcel": data}, 200
