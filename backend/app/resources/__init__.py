from flask_restful import Api
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import PyJWTError

from app.resources.auth import (
    ChangePasswordResource,
    ForgotPasswordResource,
    LoginResource,
    LogoutResource,
    MeResource,
    RefreshResource,
    RegisterResource,
    ResetPasswordResource,
)
from app.resources.admin_parcel import AdminParcelListResource
from app.resources.admin_location import AdminParcelLocationResource
from app.resources.admin_status import AdminParcelStatusResource
from app.resources.admin_delivery_agent import AdminParcelDeliveryAgentResource
from app.resources.admin_audit import AdminAuditResource
from app.resources.admin_courier import AdminCourierListResource, AdminCourierShiftResource
from app.resources.admin_notification import AdminNotificationListResource
from app.resources.admin_user import (
    AdminUserListResource,
    AdminUserRoleResource,
    AdminUserSuspensionResource,
)
from app.resources.admin_weight import AdminParcelWeightResource
from app.resources.fleet import AdminFleetAvailabilityResource, FleetAvailabilityResource
from app.resources.parcel import (
    ParcelHistoryResource,
    ParcelListResource,
    ParcelResource,
    ParcelTrackingResource,
)
from app.resources.parcel_cancel import ParcelCancelResource
from app.resources.weight_category import WeightCategoryListResource
from app.resources.address import (
    AddressListResource,
    AddressResource,
    AddressSetDefaultResource,
)
from app.resources.profile import ProfileResource
from app.resources.maps import GeocodeResource, ReverseGeocodeResource, RouteResource
from app.resources.health import HealthResource
from app.resources.settings import AdminSettingsResource, SettingsResource
from app.resources.notification import (
    NotificationListResource,
    NotificationPreferenceResource,
    NotificationReadAllResource,
    NotificationReadResource,
    NotificationUnreadCountResource,
)


class JWTCompatibleApi(Api):
    """Let Flask-JWT-Extended format authentication failures.

    Flask-RESTful otherwise treats JWT exceptions as unknown application errors
    when ``PROPAGATE_EXCEPTIONS`` is false (the production default), turning an
    expected missing/expired-token response into HTTP 500. The JWT extension has
    already registered the correct 401/422 handlers on the Flask application, so
    route those exceptions back to Flask's original error handler.
    """

    def error_router(self, original_handler, error):
        if isinstance(error, (JWTExtendedException, PyJWTError)):
            return original_handler(error)
        return super().error_router(original_handler, error)


def init_resources(app):
    api = JWTCompatibleApi(app)

    api.add_resource(HealthResource, "/api/health")
    api.add_resource(RegisterResource, "/auth/register", "/api/auth/register")
    api.add_resource(LoginResource, "/auth/login", "/api/auth/login")
    api.add_resource(RefreshResource, "/auth/refresh", "/api/auth/refresh")
    api.add_resource(LogoutResource, "/auth/logout", "/api/auth/logout")
    api.add_resource(
        ChangePasswordResource,
        "/auth/change-password",
        "/api/auth/change-password",
    )
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
    api.add_resource(WeightCategoryListResource, "/api/weight-categories")
    api.add_resource(
        ParcelResource,
        "/api/parcels/<uuid:parcel_id>",
        "/api/parcels/<uuid:parcel_id>/destination",
    )
    api.add_resource(ParcelTrackingResource, "/api/parcels/track/<string:tracking_number>")
    api.add_resource(ParcelHistoryResource, "/api/parcels/<uuid:parcel_id>/history")
    api.add_resource(
        ParcelCancelResource,
        "/parcels/<uuid:parcel_id>",
        "/api/parcels/<uuid:parcel_id>/cancel",
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
        AdminParcelDeliveryAgentResource,
        "/admin/parcels/<uuid:parcel_id>/delivery-agent",
        "/api/admin/parcels/<uuid:parcel_id>/delivery-agent",
    )
    api.add_resource(
        AdminParcelWeightResource,
        "/admin/parcels/<uuid:parcel_id>/weight",
        "/api/admin/parcels/<uuid:parcel_id>/weight",
    )
    api.add_resource(AdminUserListResource, "/admin/users", "/api/admin/users")
    api.add_resource(
        AdminUserRoleResource,
        "/admin/users/<uuid:user_id>/role",
        "/api/admin/users/<uuid:user_id>/role",
    )
    api.add_resource(
        AdminUserSuspensionResource,
        "/admin/users/<uuid:user_id>/suspension",
        "/api/admin/users/<uuid:user_id>/suspension",
    )
    api.add_resource(AdminCourierListResource, "/admin/couriers", "/api/admin/couriers")
    api.add_resource(
        AdminCourierShiftResource,
        "/admin/couriers/<uuid:courier_id>/shift",
        "/api/admin/couriers/<uuid:courier_id>/shift",
    )
    api.add_resource(AdminAuditResource, "/admin/audit", "/api/admin/audit")
    api.add_resource(
        AdminNotificationListResource,
        "/admin/notifications",
        "/api/admin/notifications",
    )
    api.add_resource(SettingsResource, "/settings", "/api/settings")
    api.add_resource(AdminSettingsResource, "/admin/settings", "/api/admin/settings")
    api.add_resource(
        FleetAvailabilityResource,
        "/transport/availability",
        "/api/transport/availability",
    )
    api.add_resource(
        AdminFleetAvailabilityResource,
        "/admin/transport/availability",
        "/api/admin/transport/availability",
    )

    api.add_resource(AddressListResource, "/addresses", "/api/addresses")
    api.add_resource(
        AddressResource,
        "/addresses/<uuid:address_id>",
        "/api/addresses/<uuid:address_id>",
    )
    api.add_resource(
        AddressSetDefaultResource,
        "/addresses/<uuid:address_id>/default",
        "/api/addresses/<uuid:address_id>/default",
    )

    api.add_resource(ProfileResource, "/profile", "/api/profile")
    api.add_resource(NotificationListResource, "/api/notifications")
    api.add_resource(NotificationUnreadCountResource, "/api/notifications/unread-count")
    api.add_resource(NotificationReadAllResource, "/api/notifications/read-all")
    api.add_resource(NotificationReadResource, "/api/notifications/<uuid:notification_id>/read")
    api.add_resource(NotificationPreferenceResource, "/api/notification-preferences")
    api.add_resource(GeocodeResource, "/api/maps/geocode")
    api.add_resource(ReverseGeocodeResource, "/api/maps/reverse-geocode")
    api.add_resource(RouteResource, "/api/maps/route")
