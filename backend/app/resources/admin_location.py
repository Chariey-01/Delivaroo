from flask import request, current_app
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource

from app.extensions import db
from app.models.parcel import Parcel
from app.services.admin_location_service import (
    admin_update_location,
    ParcelLocationLockedError,
    InvalidLocationError,
)
from app.services.notification_service import notify_event
from app.utils.auth_decorators import admin_required


class AdminParcelLocationResource(Resource):
    @admin_required
    def patch(self, parcel_id):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        parcel = db.session.get(Parcel, parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404

        admin_id = get_jwt_identity()
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        address = data.get("address")

        try:
            history = admin_update_location(
                parcel=parcel,
                latitude=latitude,
                longitude=longitude,
                address=address,
                admin_id=admin_id,
            )

            try:
                notify_event(
                    current_app._get_current_object(),
                    recipient_user_id=parcel.user_id,
                    actor_user_id=admin_id,
                    event_type="PARCEL_LOCATION_UPDATED",
                    parcel=parcel,
                    metadata={"tracking_number": parcel.tracking_number},
                    idempotency_key=f"parcel-location:{parcel.id}:{history.id}",
                )
            except (ValueError, RuntimeError):
                current_app.logger.exception("Unable to create parcel location notification")

            parcel_data = parcel.to_dict()
            return {
                "message": "Parcel location updated successfully",
                "parcel": parcel_data,
                "data": parcel_data,
            }, 200

        except ParcelLocationLockedError as error:
            return {"message": str(error)}, 409
        except InvalidLocationError as error:
            return {"message": str(error)}, 400
