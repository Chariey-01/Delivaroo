from functools import wraps

from flask_jwt_extended import jwt_required, get_jwt


STAFF_ROLES = {"admin", "dispatcher"}


def admin_required(fn):
    """
    Decorator that requires a valid JWT AND that the token's role claim
    is 'admin'. Must be used together with (or in place of) @jwt_required().
    """
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return {"message": "Admin access required"}, 403
        return fn(*args, **kwargs)
    return wrapper


def staff_required(fn):
    """Require a JWT whose role is allowed to use the admin portal."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") not in STAFF_ROLES:
            return {"message": "Staff access required"}, 403
        return fn(*args, **kwargs)
    return wrapper
