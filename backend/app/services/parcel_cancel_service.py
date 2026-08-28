import uuid

from app.services.status_history_service import (
    record_status_change,
    InvalidStatusTransitionError,
)


class NotParcelOwnerError(Exception):
    """Raised when the requester does not own the parcel."""


class ParcelNotCancellableError(Exception):
    """Raised when the parcel is already delivered and cannot be cancelled."""


def cancel_parcel(parcel, requester_id):
    """
    Cancels a parcel if the requester owns it and the parcel has not
    already been delivered.

    Cancelling an already-cancelled parcel is idempotent: it succeeds
    and returns the parcel unchanged, without creating a duplicate
    StatusHistory row.

    Records the cancellation in StatusHistory via record_status_change()
    for the first cancellation. Commits the transaction.
    """
    if isinstance(requester_id, str):
        requester_id = uuid.UUID(requester_id)

    if parcel.user_id != requester_id:
        raise NotParcelOwnerError("You do not own this parcel")

    if parcel.status == "DELIVERED":
        raise ParcelNotCancellableError("Cannot cancel a parcel that has already been delivered")

    if parcel.status == "CANCELLED":
        return parcel

    try:
        record_status_change(
            parcel=parcel,
            new_status="CANCELLED",
            changed_by_id=requester_id,
            notes="Parcel cancelled by owner",
        )
    except InvalidStatusTransitionError:
        raise ParcelNotCancellableError(
            f"Cannot cancel a parcel with status '{parcel.status}'"
        )

    return parcel
