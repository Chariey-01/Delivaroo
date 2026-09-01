from app.extensions import db
from app.models.parcel import Parcel
from app.models.user import User
from app.models.transport import TRANSPORT_MODES


VALID_STATUSES = {
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
}


class InvalidFilterError(ValueError):
    """Raised when a filter or pagination parameter is invalid."""


def list_all_parcels(status=None, tracking_number=None, transport_mode=None, page=1, per_page=20):
    """
    Returns a paginated list of all parcels across all users, optionally
    filtered by status and/or a tracking number search.

    Each parcel dict includes the owning user's email (name is not yet
    available - profiles model does not exist yet).
    """
    if status is not None and status not in VALID_STATUSES:
        raise InvalidFilterError(f"'{status}' is not a valid parcel status")
    if transport_mode is not None and transport_mode not in TRANSPORT_MODES:
        raise InvalidFilterError(f"'{transport_mode}' is not a valid transport mode")

    try:
        page = int(page)
        per_page = int(per_page)
    except (TypeError, ValueError):
        raise InvalidFilterError("page and per_page must be integers")

    if page < 1:
        raise InvalidFilterError("page must be 1 or greater")

    if per_page < 1 or per_page > 100:
        raise InvalidFilterError("per_page must be between 1 and 100")

    query = Parcel.query.join(User, Parcel.user_id == User.id)

    if status is not None:
        query = query.filter(Parcel.status == status)

    if tracking_number:
        query = query.filter(Parcel.tracking_number.ilike(f"%{tracking_number}%"))
    if transport_mode is not None:
        query = query.filter(Parcel.transport_mode == transport_mode)

    query = query.order_by(Parcel.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    results = []
    for parcel in pagination.items:
        parcel_dict = parcel.to_dict()
        owner = db.session.get(User, parcel.user_id)
        parcel_dict["owner"] = {
            "email": owner.email if owner else None,
        }
        results.append(parcel_dict)

    return {
        "parcels": results,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    }
