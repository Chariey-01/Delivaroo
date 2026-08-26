from flask import request
from flask_restful import Resource

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
        