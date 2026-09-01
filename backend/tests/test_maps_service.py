import socket
from urllib import error

import pytest

from app.services import maps_service
from app.services.maps_service import MapsServiceError


def test_geocode_success(app, monkeypatch):
    def fake_request(url, **kwargs):
        assert "key=" in url
        return {
            "status": "OK",
            "results": [
                {
                    "formatted_address": "Westlands, Nairobi",
                    "place_id": "place-1",
                    "geometry": {"location": {"lat": -1.2641, "lng": 36.8078}},
                }
            ],
        }

    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "server-key")
    monkeypatch.setattr(maps_service, "_request_json", fake_request)

    with app.app_context():
        assert maps_service.geocode_address("Westlands") == {
            "address": "Westlands, Nairobi",
            "lat": -1.2641,
            "lng": 36.8078,
            "place_id": "place-1",
        }


def test_route_success_normalizes_distance_and_duration(app, monkeypatch):
    def fake_request(url, **kwargs):
        assert kwargs["method"] == "POST"
        return {"routes": [{"distanceMeters": 12543, "duration": "1840s"}]}

    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "server-key")
    monkeypatch.setattr(maps_service, "_request_json", fake_request)

    with app.app_context():
        route = maps_service.route_between(
            {"lat": -1.2921, "lng": 36.8219},
            {"lat": -1.3, "lng": 36.9},
        )

    assert float(route.distance_km) == pytest.approx(12.54)
    assert route.duration_seconds == 1840
    assert route.duration_minutes == 31


@pytest.mark.parametrize(
    "point",
    [
        {"lat": -91, "lng": 36.8},
        {"lat": -1.2, "lng": 181},
        {"lat": "north", "lng": 36.8},
    ],
)
def test_invalid_coordinates_are_rejected(app, point):
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "server-key")
    with app.app_context(), pytest.raises(MapsServiceError):
        maps_service.route_between(point, {"lat": -1.3, "lng": 36.9})
    monkeypatch.undo()


def test_missing_address_is_rejected(app):
    with app.app_context(), pytest.raises(MapsServiceError, match="Address is required"):
        maps_service.geocode_address("")


def test_missing_api_key_is_controlled(app):
    with app.app_context(), pytest.raises(MapsServiceError, match="not configured"):
        maps_service.route_between(
            {"lat": -1.2921, "lng": 36.8219},
            {"lat": -1.3, "lng": 36.9},
        )


@pytest.mark.parametrize(
    ("exc", "message"),
    [
        (socket.timeout(), "timed out"),
        (error.URLError("offline"), "failed"),
    ],
)
def test_network_failures_are_controlled(app, monkeypatch, exc, message):
    def fail(*args, **kwargs):
        raise exc

    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "server-key")
    monkeypatch.setattr(maps_service.request, "urlopen", fail)

    with app.app_context(), pytest.raises(MapsServiceError, match=message):
        maps_service._request_json("https://maps.googleapis.test")


@pytest.mark.parametrize(
    ("status", "message"),
    [
        ("ZERO_RESULTS", "No location"),
        ("OVER_QUERY_LIMIT", "quota"),
        ("REQUEST_DENIED", "denied"),
    ],
)
def test_google_error_statuses_are_controlled(app, monkeypatch, status, message):
    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "server-key")
    monkeypatch.setattr(maps_service, "_request_json", lambda *a, **k: {"status": status})

    with app.app_context(), pytest.raises(MapsServiceError, match=message):
        maps_service.geocode_address("Nowhere")


def test_error_messages_do_not_leak_key(app, monkeypatch):
    monkeypatch.setitem(app.config, "GOOGLE_MAPS_API_KEY", "secret-server-key")
    monkeypatch.setattr(maps_service, "_request_json", lambda *a, **k: {"status": "REQUEST_DENIED"})

    with app.app_context(), pytest.raises(MapsServiceError) as exc:
        maps_service.geocode_address("Westlands")

    assert "secret-server-key" not in str(exc.value)


def test_route_endpoint_uses_mocked_backend_service(client, auth_headers, monkeypatch):
    def fake_route(pickup, destination):
        return maps_service.RouteInfo(
            distance_km=maps_service.Decimal("8.50"),
            duration_minutes=18,
            duration_seconds=1080,
            coordinates=[pickup, destination],
        )

    monkeypatch.setattr("app.resources.maps.route_between", fake_route)

    response = client.post(
        "/api/maps/route",
        json={
            "pickup": {"lat": -1.2921, "lng": 36.8219},
            "destination": {"lat": -1.3, "lng": 36.9},
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["distanceKm"] == 8.5
