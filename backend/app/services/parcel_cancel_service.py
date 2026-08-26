import uuid

from app.services.status_history_service import (
    record_status_change,
    InvalidStatusTransitionError,
)


class NotParcelOwnerError(Exception):
    """Raised when the requester does not own the parcel."""


class ParcelNotCancellableError(Exception):
    """Raised when the parcel is already delivered or already cancelled."""


def cancel_parcel(parcel, requester_id):
    """
    Cancels a parcel if the requester owns it and the parcel is not
    already delivered or already cancelled.

    Records the cancellation in StatusHistory via record_status_change().
    Commits the transaction.
    """
    if isinstance(requester_id, str):
        requester_id = uuid.UUID(requester_id)

    if parcel.user_id != requester_id:
        raise NotParcelOwnerError("You do not own this parcel")

    if parcel.status == "DELIVERED":
        raise ParcelNotCancellableError("Cannot cancel a parcel that has already been delivered")

    if parcel.status == "CANCELLED":
        raise ParcelNotCancellableError("Parcel is already cancelled")

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
