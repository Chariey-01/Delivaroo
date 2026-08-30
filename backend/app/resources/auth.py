from uuid import UUID

from flask import current_app, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_restful import Resource

from app.extensions import db
from app.models.user import User
from app.services.auth_service import authenticate_user, register_user
from app.services.email_service import send_password_reset_email
from app.services.password_reset_service import (
    create_password_reset_token,
    reset_password,
)
from app.services.token_service import (
    create_refresh_token,
    get_valid_refresh_token,
    revoke_refresh_token,
)


def bearer_token_from_header():
    authorization = request.headers.get("Authorization", "")

    if not authorization.lower().startswith("bearer "):
        return None

    return authorization.split(None, 1)[1].strip()


def serialize_user(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


class RegisterResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        try:
            user = register_user(email=email, password=password)
        except ValueError as error:
            return {"message": str(error)}, 409

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role},
        )
        refresh_token = create_refresh_token(user.id)
        user_payload = serialize_user(user)

        return {
            "message": "User registered successfully",
            "data": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_payload,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user_payload,
        }, 201


class LoginResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        try:
            result = authenticate_user(email=email, password=password)
        except ValueError as error:
            return {"message": str(error)}, 401

        return {
            "message": "Login successful",
            "data": {
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
                "user": serialize_user(result["user"]),
            },
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "user": serialize_user(result["user"]),
        }, 200


class MeResource(Resource):
    @jwt_required()
    def get(self):
        try:
            user_id = UUID(get_jwt_identity())
        except ValueError:
            return {"message": "User not found"}, 404

        user = db.session.get(User, user_id)

        if not user or not user.is_active:
            return {"message": "User not found"}, 404

        return {
            "message": "Authenticated user retrieved successfully",
            "data": serialize_user(user),
            "user": serialize_user(user),
        }, 200


class RefreshResource(Resource):
    def post(self):
        data = request.get_json(silent=True) or {}

        refresh_token = data.get("refresh_token") or bearer_token_from_header()

        if not refresh_token:
            return {"message": "Refresh token is required"}, 400

        try:
            stored_token = get_valid_refresh_token(refresh_token)
        except ValueError as error:
            return {"message": str(error)}, 401

        user = db.session.get(User, stored_token.user_id)

        if not user:
            return {"message": "User not found"}, 404

        if not user.is_active:
            return {"message": "User account is inactive"}, 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role},
        )

        return {
            "message": "Access token refreshed successfully",
            "data": {
                "access_token": access_token,
            },
            "access_token": access_token,
        }, 200


class LogoutResource(Resource):
    def post(self):
        data = request.get_json(silent=True) or {}

        refresh_token = data.get("refresh_token") or bearer_token_from_header()

        if not refresh_token:
            return {"message": "Refresh token is required"}, 400

        try:
            revoke_refresh_token(refresh_token)
        except ValueError as error:
            return {"message": str(error)}, 401

        return {"message": "Logout successful"}, 200


class ForgotPasswordResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        email = data.get("email")

        if not email:
            return {"message": "Email is required"}, 400

        user = User.query.filter_by(email=email.strip().lower()).first()

        generic_response = {
            "message": "If the email exists, a password reset link will be sent"
        }

        if not user or not user.is_active:
            return generic_response, 200

        reset_token = create_password_reset_token(user)

        try:
            send_password_reset_email(user.email, reset_token)
        except RuntimeError:
            if not current_app.testing:
                current_app.logger.warning(
                    "Password reset email skipped because email service is not configured"
                )
        except Exception:
            current_app.logger.exception("Password reset email delivery failed")

        if current_app.testing:
            generic_response["reset_token"] = reset_token

        return generic_response, 200


class ResetPasswordResource(Resource):
    def post(self):
        data = request.get_json()

        if not data:
            return {"message": "Request body is required"}, 400

        token = data.get("token")
        new_password = data.get("new_password")

        if not token or not new_password:
            return {"message": "Token and new password are required"}, 400

        if len(new_password) < 8:
            return {"message": "Password must be at least 8 characters"}, 400

        try:
            reset_password(raw_token=token, new_password=new_password)
        except ValueError as error:
            return {"message": str(error)}, 400

        return {"message": "Password reset successfully"}, 200
