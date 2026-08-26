from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource

from app.models.parcel import Parcel
from app.services.parcel_cancel_service import (
    cancel_parcel,
    NotParcelOwnerError,
    ParcelNotCancellableError,
)


class ParcelCancelResource(Resource):
    @jwt_required()
    def patch(self, parcel_id):
        parcel = Parcel.query.get(parcel_id)
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
                "parcel": cancelled_parcel.to_dict(),
            }, 200

        except NotParcelOwnerError as error:
            return {"message": str(error)}, 403

        except ParcelNotCancellableError as error:
            return {"message": str(error)}, 409
