import math


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two lat/lng points
    using the haversine formula. Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in km

    lat1_rad = math.radians(float(lat1))
    lat2_rad = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2) - float(lat1))
    delta_lon = math.radians(float(lon2) - float(lon1))

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)


def estimate_duration_minutes(distance_km, average_speed_kmh=40):
    """
    Rough delivery duration estimate based on distance and an assumed
    average speed. average_speed_kmh defaults to 40 km/h (urban delivery).
    """
    if distance_km <= 0:
        return 0
    hours = distance_km / average_speed_kmh
    return round(hours * 60)
