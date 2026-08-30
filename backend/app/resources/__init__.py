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
from app.resources.parcel import ParcelResource
from app.resources.parcel_cancel import ParcelCancelResource
from app.resources.admin_parcel import AdminParcelListResource
from app.resources.admin_status import AdminParcelStatusResource
from app.resources.admin_location import AdminParcelLocationResource
from app.resources.parcel_cancel import ParcelCancelResource
from app.resources.parcel import (
    ParcelHistoryResource,
    ParcelListResource,
    ParcelResource,
    ParcelTrackingResource,
)
from app.resources.address import (
    AddressListResource,
    AddressResource,
    AddressSetDefaultResource,
)
from app.resources.admin_location import AdminParcelLocationResource


def init_resources(app):
    api = Api(app)

    api.add_resource(RegisterResource, "/auth/register", "/api/auth/register")
    api.add_resource(LoginResource, "/auth/login", "/api/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh", "/api/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout", "/api/auth/logout")
    api.add_resource(MeResource, "/auth/me", "/api/auth/me")
    api.add_resource(
        ForgotPasswordResource,
        "/auth/forgot-password",
        "/api/auth/forgot-password",
    )
    api.add_resource(
        ResetPasswordResource,
        "/auth/reset-password",
        "/api/auth/reset-password",
    )
    api.add_resource(ParcelListResource, "/api/parcels")
    api.add_resource(
        ParcelResource,
        "/api/parcels/<uuid:parcel_id>",
        "/api/parcels/<uuid:parcel_id>/destination",
    )
    api.add_resource(AdminParcelListResource, "/admin/parcels", "/api/admin/parcels")
    api.add_resource(
        AdminParcelStatusResource,
        "/admin/parcels/<uuid:parcel_id>/status",
        "/api/admin/parcels/<uuid:parcel_id>/status",
    )
    api.add_resource(
        AdminParcelLocationResource,
        "/admin/parcels/<uuid:parcel_id>/location",
        "/api/admin/parcels/<uuid:parcel_id>/location",
    )
    api.add_resource(
        ParcelCancelResource,
        "/parcels/<uuid:parcel_id>",
        "/api/parcels/<uuid:parcel_id>/cancel",
    )
    api.add_resource(ParcelTrackingResource, "/api/parcels/track/<string:tracking_number>")
    api.add_resource(ParcelHistoryResource, "/api/parcels/<uuid:parcel_id>/history")
    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout")
    api.add_resource(MeResource, "/auth/me")
    api.add_resource(ForgotPasswordResource, "/auth/forgot-password")
    api.add_resource(ResetPasswordResource, "/auth/reset-password")
    api.add_resource(MeResource, "/auth/me")
    api.add_resource(ParcelListResource, "/api/parcels")
    api.add_resource(ParcelDetailResource, "/api/parcels/<string:parcel_id>")
    api.add_resource(AdminParcelListResource, "/admin/parcels")
    api.add_resource(AdminParcelStatusResource, "/admin/parcels/<uuid:parcel_id>/status")
    api.add_resource(ParcelResource, "/api/parcels/<uuid:parcel_id>")
    api.add_resource(ParcelCancelResource, "/parcels/<uuid:parcel_id>")
    api.add_resource(AdminParcelListResource, "/admin/parcels")
    api.add_resource(AdminParcelStatusResource, "/admin/parcels/<uuid:parcel_id>/status")
    api.add_resource(AddressListResource, "/addresses")
    api.add_resource(AddressResource, "/addresses/<uuid:address_id>")
    api.add_resource(AddressSetDefaultResource, "/addresses/<uuid:address_id>/default")
    api.add_resource(AdminParcelLocationResource, "/admin/parcels/<uuid:parcel_id>/location")
