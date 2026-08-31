from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource

from app.services.profile_service import get_profile, upsert_profile, InvalidProfileError


class ProfileResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        profile = get_profile(user_id)

        if not profile:
            return {"message": "Profile not yet created", "profile": None}, 200

        return {"profile": profile.to_dict()}, 200

    @jwt_required()
    def patch(self):
        data = request.get_json()
        if not data:
            return {"message": "Request body is required"}, 400

        user_id = get_jwt_identity()

        try:
            profile = upsert_profile(
                user_id=user_id,
                full_name=data.get("full_name"),
                phone=data.get("phone"),
                profile_image=data.get("profile_image"),
            )
            return {"message": "Profile updated successfully", "profile": profile.to_dict()}, 200

        except InvalidProfileError as error:
            return {"message": str(error)}, 400
