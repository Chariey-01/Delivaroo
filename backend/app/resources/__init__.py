from flask_restful import Api
from app.resources.auth import LoginResource, RegisterResource
from app.resources.parcel import ParcelResource

from app.resources.auth import (
    ForgotPasswordResource,
    ResetPasswordResource,
    LoginResource,
    LogoutResource,
    MeResource,
    RefreshResource,
    RegisterResource,
)
from app.resources.parcel_cancel import ParcelCancelResource


def init_resources(app):
    api = Api(app)

    api.add_resource(RegisterResource, "/api/auth/register")
    api.add_resource(LoginResource, "/api/auth/login")
    api.add_resource(RefreshResource, "/api/auth/refresh")
    api.add_resource(LogoutResource, "/api/auth/logout")
    api.add_resource(ForgotPasswordResource, "/api/auth/forgot-password")
    api.add_resource(ResetPasswordResource, "/api/auth/reset-password")
    api.add_resource(ParcelResource, "/api/parcels/<uuid:parcel_id>")
    api.add_resource(ParcelCancelResource, "/parcels/<uuid:parcel_id>")
    api.add_resource(MeResource, "/api/auth/me")
