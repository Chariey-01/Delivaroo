from flask_restful import Api

from app.resources.auth import (
    LoginResource,
    LogoutResource,
    RefreshResource,
    RegisterResource,
)


def init_resources(app):
    api = Api(app)

    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout")

