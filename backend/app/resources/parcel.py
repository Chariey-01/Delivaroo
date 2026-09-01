from flask import current_app, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from flask_restful import Resource

from app.extensions import db
from app.models.parcel import Parcel
from app.models.status_history import StatusHistory
from app.services.parcel_service import (
    ParcelNotFoundError,
    create_parcel,
    get_visible_parcel,
    list_user_parcels,
    serialize_parcel,
)
from app.services.maps_service import MapsServiceError, route_between, test_route_between
from app.services.parcel_update_service import (
    InvalidDestinationError,
    NotParcelOwnerError,
    ParcelNotUpdatableError,
    update_parcel_destination,
)
from app.services.notification_service import notify_event


def _first_value(data, *keys):
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value

    return None


def _place_value(data, place_key, field_name, *flat_keys):
    place = data.get(place_key)

    if isinstance(place, dict):
        nested_aliases = {
            "address": ("address",),
            "latitude": ("latitude", "lat"),
            "longitude": ("longitude", "lng", "lon"),
        }
        value = _first_value(place, *nested_aliases[field_name])

        if value is not None:
            return value

    return _first_value(data, *flat_keys)


def _duration_value(data):
    duration = _first_value(data, "duration", "durationMinutes")

    if duration is not None:
        return duration

    duration_seconds = _first_value(data, "duration_seconds", "durationSeconds")

    if duration_seconds is None:
        return None

    try:
        return round(float(duration_seconds) / 60)
    except (TypeError, ValueError):
        return duration_seconds


def _route_for_creation(app, pickup_latitude, pickup_longitude, destination_latitude, destination_longitude):
    if None in (
        pickup_latitude,
        pickup_longitude,
        destination_latitude,
        destination_longitude,
    ):
        return None

    pickup = {"lat": pickup_latitude, "lng": pickup_longitude}
    destination = {"lat": destination_latitude, "lng": destination_longitude}

    try:
        return route_between(pickup, destination)
    except MapsServiceError:
        if app.config.get("TESTING"):
            return test_route_between(pickup, destination)
        raise


class ParcelListResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        weight_category_id = _first_value(
            data,
            "weight_category_id",
            "weightCategoryId",
        )
        pickup_address = _place_value(
            data,
            "pickup",
            "address",
            "pickup_address",
            "pickupAddress",
        )
        destination_address = _place_value(
            data,
            "destination",
            "address",
            "destination_address",
            "destinationAddress",
        )
        missing_fields = []

        if not weight_category_id:
            missing_fields.append("weight_category_id")

        if not pickup_address:
            missing_fields.append("pickup_address")

        if not destination_address:
            missing_fields.append("destination_address")

        if missing_fields:
            return {
                "message": "Required fields are missing",
                "fields": missing_fields,
            }, 400

        try:
            pickup_latitude = _place_value(
                data,
                "pickup",
                "latitude",
                "pickup_latitude",
                "pickupLatitude",
            )
            pickup_longitude = _place_value(
                data,
                "pickup",
                "longitude",
                "pickup_longitude",
                "pickupLongitude",
            )
            destination_latitude = _place_value(
                data,
                "destination",
                "latitude",
                "destination_latitude",
                "destinationLatitude",
            )
            destination_longitude = _place_value(
                data,
                "destination",
                "longitude",
                "destination_longitude",
                "destinationLongitude",
            )
            route = _route_for_creation(
                current_app,
                pickup_latitude,
                pickup_longitude,
                destination_latitude,
                destination_longitude,
            )
            parcel = create_parcel(
                user_id=get_jwt_identity(),
                weight_category_id=weight_category_id,
                pickup_address=pickup_address,
                pickup_latitude=pickup_latitude,
                pickup_longitude=pickup_longitude,
                destination_address=destination_address,
                destination_latitude=destination_latitude,
                destination_longitude=destination_longitude,
                distance=route.distance_km if route else None,
                duration=route.duration_minutes if route else None,
                transport_mode=_first_value(data, "transport_mode", "transportMode") or "MOTORBIKE",
            )
        except MapsServiceError as error:
            return {"message": str(error)}, 400
        except ValueError as error:
            return {"message": str(error)}, 400

        notify_event(
            current_app._get_current_object(),
            recipient_user_id=parcel.user_id,
            actor_user_id=get_jwt_identity(),
            event_type="PARCEL_CREATED",
            parcel=parcel,
            metadata={"tracking_number": parcel.tracking_number},
            idempotency_key=f"parcel-created:{parcel.id}",
        )

        return {
            "message": "Parcel created successfully",
            "data": serialize_parcel(parcel),
            "parcel": serialize_parcel(parcel),
        }, 201

    @jwt_required()
    def get(self):
        parcels = list_user_parcels(get_jwt_identity())

        return {
            "data": [serialize_parcel(parcel) for parcel in parcels],
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

        return {
            "data": serialize_parcel(parcel),
            "parcel": serialize_parcel(parcel),
        }, 200

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
                new_address=_place_value(
                    data,
                    "destination",
                    "address",
                    "destination_address",
                    "destinationAddress",
                    "address",
                ),
                new_latitude=_place_value(
                    data,
                    "destination",
                    "latitude",
                    "destination_latitude",
                    "destinationLatitude",
                    "latitude",
                    "lat",
                ),
                new_longitude=_place_value(
                    data,
                    "destination",
                    "longitude",
                    "destination_longitude",
                    "destinationLongitude",
                    "longitude",
                    "lng",
                ),
            )
        except NotParcelOwnerError as error:
            return {"message": str(error)}, 403
        except ParcelNotUpdatableError as error:
            return {"message": str(error)}, 409
        except InvalidDestinationError as error:
            return {"message": str(error)}, 400

        notify_event(
            current_app._get_current_object(),
            recipient_user_id=updated_parcel.user_id,
            actor_user_id=get_jwt_identity(),
            event_type="PARCEL_DESTINATION_UPDATED",
            parcel=updated_parcel,
            metadata={"tracking_number": updated_parcel.tracking_number},
            idempotency_key=f"parcel-destination:{updated_parcel.id}:{updated_parcel.updated_at.isoformat()}",
        )

        return {
            "message": "Parcel destination updated successfully",
            "data": updated_parcel.to_dict(),
            "parcel": updated_parcel.to_dict(),
        }, 200


class ParcelTrackingResource(Resource):
    @jwt_required()
    def get(self, tracking_number):
        parcel = Parcel.query.filter_by(tracking_number=tracking_number).first()

        if not parcel:
            return {"message": "Parcel not found"}, 404

        try:
            visible_parcel = get_visible_parcel(
                parcel_id=parcel.id,
                user_id=get_jwt_identity(),
                role=get_jwt().get("role"),
            )
        except (ParcelNotFoundError, ValueError):
            return {"message": "Parcel not found"}, 404

        return {
            "data": serialize_parcel(visible_parcel),
            "parcel": serialize_parcel(visible_parcel),
        }, 200


class ParcelHistoryResource(Resource):
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

        history = (
            StatusHistory.query.filter_by(parcel_id=parcel.id)
            .order_by(StatusHistory.created_at.asc(), StatusHistory.id.asc())
            .all()
        )
        data = [entry.to_dict() for entry in history]

        return {
            "data": data,
            "history": data,
        }, 200
