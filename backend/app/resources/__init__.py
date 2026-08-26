from flask_restful import Api
from app.resources.auth import LoginResource, RegisterResource
from app.resources.parcel import ParcelResource


def init_resources(app):
    api = Api(app)
    api.add_resource(RegisterResource, "/api/auth/register")
    api.add_resource(LoginResource, "/api/auth/login")
    api.add_resource(ParcelResource, "/api/parcels/<uuid:parcel_id>")
