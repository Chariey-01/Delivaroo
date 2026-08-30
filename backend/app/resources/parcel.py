from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from app.extensions import db
from app.models.parcel import Parcel
from app.services.parcel_service import (
    ParcelNotFoundError,
    create_parcel,
    get_visible_parcel,
    list_user_parcels,
    serialize_parcel,
)
from app.services.parcel_update_service import (
    InvalidDestinationError,
    NotParcelOwnerError,
    ParcelNotUpdatableError,
    update_parcel_destination,
)


class ParcelListResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        required_fields = [
            "weight_category_id",
            "pickup_address",
            "destination_address",
        ]
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return {
                "message": "Required fields are missing",
                "fields": missing_fields,
            }, 400

        try:
            parcel = create_parcel(
                user_id=get_jwt_identity(),
                weight_category_id=data["weight_category_id"],
                pickup_address=data["pickup_address"],
                pickup_latitude=data.get("pickup_latitude"),
                pickup_longitude=data.get("pickup_longitude"),
                destination_address=data["destination_address"],
                destination_latitude=data.get("destination_latitude"),
                destination_longitude=data.get("destination_longitude"),
                distance=data.get("distance"),
                duration=data.get("duration"),
            )
        except ValueError as error:
            return {"message": str(error)}, 400

        return {
            "message": "Parcel created successfully",
            "parcel": serialize_parcel(parcel),
        }, 201

    @jwt_required()
    def get(self):
        parcels = list_user_parcels(get_jwt_identity())

        return {
            "parcels": [serialize_parcel(parcel) for parcel in parcels],
        }, 200


class ParcelResource(Resource):
    @jwt_required()
    def get(self, parcel_id):
        try:
            parcel = get_visible_parcel(
                parcel_id=parcel_id,
                user_id=get_jwt_identity(),
                role=get_jwt().get("role"),
            )
        except (ParcelNotFoundError, ValueError):
            return {"message": "Parcel not found"}, 404

        return {"parcel": serialize_parcel(parcel)}, 200

    @jwt_required()
    def patch(self, parcel_id):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        parcel = db.session.get(Parcel, parcel_id)

        if not parcel:
            return {"message": "Parcel not found"}, 404

        try:
            updated_parcel = update_parcel_destination(
                parcel=parcel,
                requester_id=get_jwt_identity(),
                new_address=data.get("destination_address"),
                new_latitude=data.get("destination_latitude"),
                new_longitude=data.get("destination_longitude"),
            )
        except NotParcelOwnerError as error:
            return {"message": str(error)}, 403
        except ParcelNotUpdatableError as error:
            return {"message": str(error)}, 409
        except InvalidDestinationError as error:
            return {"message": str(error)}, 400

        return {
            "message": "Parcel destination updated successfully",
            "parcel": updated_parcel.to_dict(),
        }, 200
