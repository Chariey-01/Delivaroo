from flask import request
from flask_restful import Resource
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.services.token_service import (
    get_valid_refresh_token,
    revoke_refresh_token,
)

from app.services.auth_service import (
    register_user,
    authenticate_user,
)


class RegisterResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {
                "message": "Email and password are required"
            }, 400

        try:
            user = register_user(
                email=email,
                password=password,
            )

            return {
                "message": "User registered successfully",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role,
                },
            }, 201

        except ValueError as error:
            return {"message": str(error)}, 409


class LoginResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {
                "message": "Email and password are required"
            }, 400

        try:
            result = authenticate_user(
                email=email,
                password=password,
            )

            return {
                "message": "Login successful",
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "user": {
                    "id": str(result["user"].id),
                    "email": result["user"].email,
                    "role": result["user"].role,
                },
            }, 200

        except ValueError as error:
            return {"message": str(error)}, 401

class RefreshResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return {"message": "Refresh token is required"}, 400

        try:
            stored_token = get_valid_refresh_token(refresh_token)

            user = User.query.get(stored_token.user_id)

            if not user:
                return {"message": "User not found"}, 404

            if not user.is_active:
                return {"message": "User account is inactive"}, 401

            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    "role": user.role,
                },
            )

            return {
                "message": "Access token refreshed successfully",
                "access_token": access_token,
            }, 200

        except ValueError as error:
            return {"message": str(error)}, 401
                
class LogoutResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return {"message": "Refresh token is required"}, 400

        try:
            revoke_refresh_token(refresh_token)

            return {
                "message": "Logout successful"
            }, 200

        except ValueError as error:
            return {"message": str(error)}, 401
                