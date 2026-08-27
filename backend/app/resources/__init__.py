from flask_restful import Api

from app.resources.auth import (
    ForgotPasswordResource,
    ResetPasswordResource,
    LoginResource,
    LogoutResource,
    MeResource,
    RefreshResource,
    RegisterResource,
)


def init_resources(app):
    api = Api(app)

    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout")
    api.add_resource(ForgotPasswordResource, "/auth/forgot-password")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")
    api.add_resource(MeResource, "/auth/me")