import json
import socket
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from urllib import error, parse, request

from flask import current_app

from app.utils.geo import estimate_duration_minutes, haversine_distance_km


GEOCODING_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"
ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes"


class MapsServiceError(ValueError):
    """Application-level error for map provider failures."""


@dataclass(frozen=True)
class RouteInfo:
    distance_km: Decimal
    duration_minutes: int
    duration_seconds: int
    coordinates: list[dict]


def _api_key():
    return current_app.config.get("GOOGLE_MAPS_API_KEY")


def _timeout():
    return current_app.config.get("GOOGLE_MAPS_TIMEOUT_SECONDS", 5)


def _default_region():
    return current_app.config.get("GOOGLE_MAPS_DEFAULT_REGION", "KE")


def _validate_address(address):
    if not address or not str(address).strip():
        raise MapsServiceError("Address is required")
    return str(address).strip()


def validate_coordinate(value, field_name, minimum, maximum):
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise MapsServiceError(f"Invalid {field_name}") from None

    if parsed < Decimal(str(minimum)) or parsed > Decimal(str(maximum)):
        raise MapsServiceError(f"Invalid {field_name}")

    return parsed


def _coordinates(point, prefix):
    if not isinstance(point, dict):
        raise MapsServiceError(f"{prefix} coordinates are required")

    lat = validate_coordinate(point.get("lat"), f"{prefix} latitude", -90, 90)
    lng = validate_coordinate(point.get("lng"), f"{prefix} longitude", -180, 180)
    return lat, lng


def _request_json(url, *, method="GET", body=None, headers=None):
    key = _api_key()
    if not key:
        raise MapsServiceError("Google Maps API key is not configured")

    payload = None if body is None else json.dumps(body).encode("utf-8")
    req = request.Request(
        url,
        data=payload,
        method=method,
        headers={
            "Accept": "application/json",
            **({"Content-Type": "application/json"} if payload else {}),
            **(headers or {}),
        },
    )

    try:
        with request.urlopen(req, timeout=_timeout()) as response:
            return json.loads(response.read().decode("utf-8"))
    except socket.timeout as exc:
        raise MapsServiceError("Google Maps request timed out") from exc
    except error.URLError as exc:
        raise MapsServiceError("Google Maps request failed") from exc
    except json.JSONDecodeError as exc:
        raise MapsServiceError("Google Maps returned an invalid response") from exc


def _handle_geocode_status(payload):
    status = payload.get("status")
    if status == "OK":
        return
    if status == "ZERO_RESULTS":
        raise MapsServiceError("No location found for that address")
    if status in {"OVER_QUERY_LIMIT", "RESOURCE_EXHAUSTED"}:
        raise MapsServiceError("Google Maps quota limit reached")
    if status in {"REQUEST_DENIED", "PERMISSION_DENIED"}:
        raise MapsServiceError("Google Maps request was denied")
    raise MapsServiceError("Google Maps could not process the location")


def geocode_address(address):
    address = _validate_address(address)
    query = parse.urlencode(
        {
            "address": address,
            "region": _default_region(),
            "key": _api_key() or "",
        },
    )
    payload = _request_json(f"{GEOCODING_ENDPOINT}?{query}")
    _handle_geocode_status(payload)

    result = payload.get("results", [None])[0]
    location = result.get("geometry", {}).get("location", {}) if result else {}
    lat = validate_coordinate(location.get("lat"), "latitude", -90, 90)
    lng = validate_coordinate(location.get("lng"), "longitude", -180, 180)

    return {
        "address": result.get("formatted_address", address),
        "lat": float(lat),
        "lng": float(lng),
        "place_id": result.get("place_id"),
    }


def reverse_geocode(lat, lng):
    lat = validate_coordinate(lat, "latitude", -90, 90)
    lng = validate_coordinate(lng, "longitude", -180, 180)
    query = parse.urlencode(
        {
            "latlng": f"{lat},{lng}",
            "region": _default_region(),
            "key": _api_key() or "",
        },
    )
    payload = _request_json(f"{GEOCODING_ENDPOINT}?{query}")
    _handle_geocode_status(payload)

    result = payload.get("results", [None])[0]
    return {
        "address": result.get("formatted_address") if result else f"{lat}, {lng}",
        "lat": float(lat),
        "lng": float(lng),
        "place_id": result.get("place_id") if result else None,
    }


def _route_from_google(pickup, destination):
    pickup_lat, pickup_lng = _coordinates(pickup, "pickup")
    destination_lat, destination_lng = _coordinates(destination, "destination")
    body = {
        "origin": {
            "location": {
                "latLng": {"latitude": float(pickup_lat), "longitude": float(pickup_lng)}
            }
        },
        "destination": {
            "location": {
                "latLng": {
                    "latitude": float(destination_lat),
                    "longitude": float(destination_lng),
                }
            }
        },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "units": "METRIC",
    }
    payload = _request_json(
        f"{ROUTES_ENDPOINT}?key={parse.quote(_api_key() or '')}",
        method="POST",
        body=body,
        headers={
            "X-Goog-FieldMask": (
                "routes.distanceMeters,routes.duration,"
                "routes.polyline.encodedPolyline"
            )
        },
    )
    route = payload.get("routes", [None])[0]
    if not route:
        raise MapsServiceError("No route found between those locations")

    try:
        distance_km = Decimal(str(route["distanceMeters"])) / Decimal("1000")
        duration_seconds = int(str(route.get("duration", "0s")).rstrip("s"))
    except (KeyError, InvalidOperation, TypeError, ValueError):
        raise MapsServiceError("Google Maps returned an invalid route") from None

    return RouteInfo(
        distance_km=distance_km.quantize(Decimal("0.01")),
        duration_minutes=round(duration_seconds / 60),
        duration_seconds=duration_seconds,
        coordinates=[],
    )


def route_between(pickup, destination):
    return _route_from_google(pickup, destination)


def test_route_between(pickup, destination):
    """Deterministic test/demo fallback; never used for production requests."""

    pickup_lat, pickup_lng = _coordinates(pickup, "pickup")
    destination_lat, destination_lng = _coordinates(destination, "destination")
    distance = Decimal(
        str(
            haversine_distance_km(
                pickup_lat,
                pickup_lng,
                destination_lat,
                destination_lng,
            )
        )
    )
    duration = estimate_duration_minutes(distance)
    return RouteInfo(
        distance_km=distance.quantize(Decimal("0.01")),
        duration_minutes=duration,
        duration_seconds=duration * 60,
        coordinates=[
            {"lat": float(pickup_lat), "lng": float(pickup_lng)},
            {"lat": float(destination_lat), "lng": float(destination_lng)},
        ],
    )
