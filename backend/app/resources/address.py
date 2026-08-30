from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource

from app.services.address_service import (
    create_address,
    list_addresses,
    update_address,
    delete_address,
    set_default_address,
    AddressNotFoundError,
    NotAddressOwnerError,
    InvalidAddressError,
)


class AddressListResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        addresses = list_addresses(user_id)
        return {"addresses": [a.to_dict() for a in addresses]}, 200

    @jwt_required()
    def post(self):
        data = request.get_json()
        if not data:
            return {"message": "Request body is required"}, 400

        user_id = get_jwt_identity()

        try:
            address = create_address(
                user_id=user_id,
                address_line=data.get("address_line"),
                city=data.get("city"),
                label=data.get("label"),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                is_default=data.get("is_default", False),
            )
            return {"message": "Address created successfully", "address": address.to_dict()}, 201

        except InvalidAddressError as error:
            return {"message": str(error)}, 400


class AddressResource(Resource):
    @jwt_required()
    def patch(self, address_id):
        data = request.get_json()
        if not data:
            return {"message": "Request body is required"}, 400

        user_id = get_jwt_identity()

        try:
            address = update_address(address_id, user_id, **data)
            return {"message": "Address updated successfully", "address": address.to_dict()}, 200

        except AddressNotFoundError as error:
            return {"message": str(error)}, 404
        except NotAddressOwnerError as error:
            return {"message": str(error)}, 403
        except InvalidAddressError as error:
            return {"message": str(error)}, 400

    @jwt_required()
    def delete(self, address_id):
        user_id = get_jwt_identity()

        try:
            delete_address(address_id, user_id)
            return {"message": "Address deleted successfully"}, 200

        except AddressNotFoundError as error:
            return {"message": str(error)}, 404
        except NotAddressOwnerError as error:
            return {"message": str(error)}, 403


class AddressSetDefaultResource(Resource):
    @jwt_required()
    def patch(self, address_id):
        user_id = get_jwt_identity()

        try:
            address = set_default_address(address_id, user_id)
            return {"message": "Default address updated successfully", "address": address.to_dict()}, 200

        except AddressNotFoundError as error:
            return {"message": str(error)}, 404
        except NotAddressOwnerError as error:
            return {"message": str(error)}, 403
