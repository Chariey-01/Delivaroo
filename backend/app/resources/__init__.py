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

    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout")
    api.add_resource(ForgotPasswordResource, "/auth/forgot-password")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")
    api.add_resource(ParcelResource, "/api/parcels/<uuid:parcel_id>")
    api.add_resource(ParcelCancelResource, "/parcels/<uuid:parcel_id>")
    api.add_resource(MeResource, "/auth/me")
