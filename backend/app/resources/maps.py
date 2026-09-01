from flask import request
from flask_jwt_extended import jwt_required
from flask_restful import Resource

from app.services.maps_service import (
    MapsServiceError,
    geocode_address,
    reverse_geocode,
    route_between,
)


def _payload():
    return request.get_json(silent=True) or {}


def _map_error(error):
    return {"message": str(error)}, 400


class GeocodeResource(Resource):
    @jwt_required()
    def post(self):
        try:
            return {"data": geocode_address(_payload().get("address"))}, 200
        except MapsServiceError as error:
            return _map_error(error)


class ReverseGeocodeResource(Resource):
    @jwt_required()
    def post(self):
        data = _payload()
        try:
            return {"data": reverse_geocode(data.get("lat"), data.get("lng"))}, 200
        except MapsServiceError as error:
            return _map_error(error)


class RouteResource(Resource):
    @jwt_required()
    def post(self):
        data = _payload()
        try:
            route = route_between(data.get("pickup"), data.get("destination"))
        except MapsServiceError as error:
            return _map_error(error)

        return {
            "data": {
                "distanceKm": float(route.distance_km),
                "durationSeconds": route.duration_seconds,
                "coordinates": route.coordinates,
                "estimated": False,
            }
        }, 200
