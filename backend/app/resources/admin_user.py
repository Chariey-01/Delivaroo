from uuid import UUID

from flask import request
from flask_jwt_extended import get_jwt_identity
from flask_restful import Resource

from app.extensions import db
from app.models import Parcel, User
from app.services.audit_log_service import record_audit_log
from app.utils.auth_decorators import admin_required


ROLE_MAP = {
    "USER": "user",
    "CUSTOMER": "user",
    "DISPATCHER": "dispatcher",
    "ADMIN": "admin",
    "user": "user",
    "customer": "user",
    "dispatcher": "dispatcher",
    "admin": "admin",
}


def serialize_admin_user(user):
    deliveries = Parcel.query.filter_by(user_id=user.id).count()
    name = user.email.split("@", 1)[0].replace(".", " ").replace("_", " ").title()
    return {
        "id": str(user.id),
        "name": name,
        "email": user.email,
        "role": user.role.upper() if user.role != "user" else "CUSTOMER",
        "isAdmin": user.role == "admin",
        "suspended": not user.is_active,
        "deliveries": deliveries,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastSeenAt": user.updated_at.isoformat() if user.updated_at else None,
    }


class AdminUserListResource(Resource):
    @admin_required
    def get(self):
        users = User.query.order_by(User.created_at.desc(), User.email.asc()).all()
        return {"data": [serialize_admin_user(user) for user in users]}, 200


class AdminUserRoleResource(Resource):
    @admin_required
    def patch(self, user_id):
        data = request.get_json(silent=True) or {}
        role = ROLE_MAP.get(data.get("role"))
        if not role:
            return {"message": "Invalid user role"}, 400

        try:
            user_uuid = UUID(str(user_id))
        except (TypeError, ValueError):
            return {"message": "User not found"}, 404

        actor_id = UUID(get_jwt_identity())
        if user_uuid == actor_id and role != "admin":
            return {"message": "You cannot change your own role. Ask another administrator."}, 400

        user = db.session.get(User, user_uuid)
        if not user:
            return {"message": "User not found"}, 404

        old_role = user.role
        user.role = role
        record_audit_log(
            user_id=actor_id,
            action="account.role_changed",
            entity_type="user",
            entity_id=user.id,
            old_value={"role": old_role},
            new_value={"role": role},
            ip_address=request.remote_addr,
        )
        db.session.commit()
        return {"data": serialize_admin_user(user)}, 200


class AdminUserSuspensionResource(Resource):
    @admin_required
    def patch(self, user_id):
        data = request.get_json(silent=True) or {}
        suspended = bool(data.get("suspended"))

        try:
            user_uuid = UUID(str(user_id))
        except (TypeError, ValueError):
            return {"message": "User not found"}, 404

        actor_id = UUID(get_jwt_identity())
        if user_uuid == actor_id:
            return {"message": "You cannot suspend your own account."}, 400

        user = db.session.get(User, user_uuid)
        if not user:
            return {"message": "User not found"}, 404

        old_active = user.is_active
        user.is_active = not suspended
        record_audit_log(
            user_id=actor_id,
            action="account.suspended" if suspended else "account.restored",
            entity_type="user",
            entity_id=user.id,
            old_value={"is_active": old_active},
            new_value={"is_active": user.is_active},
            ip_address=request.remote_addr,
        )
        db.session.commit()
        return {"data": serialize_admin_user(user)}, 200
