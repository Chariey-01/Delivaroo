from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource

from app.models.parcel import Parcel
from app.services.parcel_update_service import (
    update_parcel_destination,
    NotParcelOwnerError,
    ParcelNotUpdatableError,
    InvalidDestinationError,
)


class ParcelResource(Resource):
    @jwt_required()
    def patch(self, parcel_id):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        parcel = Parcel.query.get(parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404

        requester_id = get_jwt_identity()

        new_address = data.get("destination_address")
        new_latitude = data.get("destination_latitude")
        new_longitude = data.get("destination_longitude")

        try:
            updated_parcel = update_parcel_destination(
                parcel=parcel,
                requester_id=requester_id,
                new_address=new_address,
                new_latitude=new_latitude,
                new_longitude=new_longitude,
            )

            return {
                "message": "Parcel destination updated successfully",
                "parcel": updated_parcel.to_dict(),
            }, 200

        except NotParcelOwnerError as error:
            return {"message": str(error)}, 403

        except ParcelNotUpdatableError as error:
            return {"message": str(error)}, 409

        except InvalidDestinationError as error:
            return {"message": str(error)}, 400
