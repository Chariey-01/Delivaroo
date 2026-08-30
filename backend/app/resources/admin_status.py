from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource

from app.models.parcel import Parcel
from app.extensions import db
from app.services.admin_status_service import admin_update_status
from app.services.status_history_service import (
    InvalidStatusError,
    InvalidStatusTransitionError,
)
from app.utils.auth_decorators import admin_required


class AdminParcelStatusResource(Resource):
    @admin_required
    def patch(self, parcel_id):
        data = request.get_json()

        if not data or "status" not in data:
            return {"message": "status is required"}, 400

        parcel = db.session.get(Parcel, parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404

        admin_id = get_jwt_identity()
        new_status = data.get("status")
        notes = data.get("notes")

        try:
            admin_update_status(
                parcel=parcel,
                new_status=new_status,
                admin_id=admin_id,
                notes=notes,
            )

            return {
                "message": "Parcel status updated successfully",
                "data": parcel.to_dict(),
                "parcel": parcel.to_dict(),
            }, 200

        except InvalidStatusError as error:
            return {"message": str(error)}, 400

        except InvalidStatusTransitionError as error:
            return {"message": str(error)}, 400
