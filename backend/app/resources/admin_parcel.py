from flask import request
from flask_restful import Resource

from app.services.admin_parcel_service import list_all_parcels, InvalidFilterError
from app.utils.auth_decorators import admin_required


class AdminParcelListResource(Resource):
    @admin_required
    def get(self):
        status = request.args.get("status")
        tracking_number = request.args.get("tracking_number")
        transport_mode = request.args.get("transport_mode")
        page = request.args.get("page", 1)
        per_page = request.args.get("per_page", 20)

        try:
            result = list_all_parcels(
                status=status,
                tracking_number=tracking_number,
                transport_mode=transport_mode,
                page=page,
                per_page=per_page,
            )
            result["data"] = result["parcels"]
            return result, 200

        except InvalidFilterError as error:
            return {"message": str(error)}, 400
