from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from app.models.user import User

from app.services.auth_service import (
    register_user,
    authenticate_user,
)

from app.services.password_reset_service import (
    create_password_reset_token,
    reset_password,
)

from app.services.token_service import (
    get_valid_refresh_token,
    revoke_refresh_token,
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

class ForgotPasswordResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")

        if not email:
            return {"message": "Email is required"}, 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return {
                "message": "If the email exists, a password reset link will be sent"
            }, 200

        if not user.is_active:
            return {
                "message": "If the email exists, a password reset link will be sent"
            }, 200

        reset_token = create_password_reset_token(user)

        # Temporary response for development.
        # In production, this token will be sent through email.
        return {
            "message": "Password reset token created",
            "reset_token": reset_token,
        }, 200   

class ResetPasswordResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        token = data.get("token")
        new_password = data.get("new_password")

        if not token or not new_password:
            return {
                "message": "Token and new password are required"
            }, 400

        if len(new_password) < 8:
            return {
                "message": "Password must be at least 8 characters"
            }, 400

        try:
            reset_password(
                raw_token=token,
                new_password=new_password,
            )

            return {
                "message": "Password reset successfully"
            }, 200

        except ValueError as error:
            return {"message": str(error)}, 400         
        
class MeResource(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        user = User.query.get(user_id)

        if not user:
            return {"message": "User not found"}, 404

        return {
            "message": "Authenticated user retrieved successfully",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
            },
        }, 200        
        