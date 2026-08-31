from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource

from app.extensions import db
from app.models.parcel import Parcel
from app.services.parcel_cancel_service import (
    cancel_parcel,
    NotParcelOwnerError,
    ParcelNotCancellableError,
)


class ParcelCancelResource(Resource):
    def _cancel(self, parcel_id):
        parcel = db.session.get(Parcel, parcel_id)
        if not parcel:
            return {"message": "Parcel not found"}, 404

        requester_id = get_jwt_identity()

        try:
            cancelled_parcel = cancel_parcel(
                parcel=parcel,
                requester_id=requester_id,
            )

            return {
                "message": "Parcel cancelled successfully",
                "data": cancelled_parcel.to_dict(),
                "parcel": cancelled_parcel.to_dict(),
            }, 200

        except NotParcelOwnerError as error:
            return {"message": str(error)}, 403

        except ParcelNotCancellableError as error:
            return {"message": str(error)}, 409

    @jwt_required()
    def delete(self, parcel_id):
        return self._cancel(parcel_id)

    @jwt_required()
    def patch(self, parcel_id):
        return self._cancel(parcel_id)
