from datetime import datetime, timedelta, timezone

from flask_restful import Resource
from sqlalchemy import func

from app.models import Parcel, Review
from app.utils.auth_decorators import staff_required


class AdminDashboardResource(Resource):
    @staff_required
    def get(self):
        statuses = dict(Parcel.query.with_entities(Parcel.status, func.count(Parcel.id)).group_by(Parcel.status).all())
        modes = dict(Parcel.query.with_entities(Parcel.transport_mode, func.count(Parcel.id)).group_by(Parcel.transport_mode).all())
        since = datetime.now(timezone.utc) - timedelta(days=13)
        volume = Parcel.query.with_entities(func.date(Parcel.created_at), func.count(Parcel.id)).filter(Parcel.created_at >= since).group_by(func.date(Parcel.created_at)).order_by(func.date(Parcel.created_at)).all()
        return {"data": {
            "total": sum(statuses.values()), "status_totals": statuses, "transport_mode_totals": modes,
            "delivery_volume": [{"date": str(day), "count": count} for day, count in volume],
            "review_counts": {status: Review.query.filter_by(status=status).count() for status in ("pending", "approved", "rejected")},
            "recent_parcels": [parcel.to_dict() for parcel in Parcel.query.order_by(Parcel.updated_at.desc()).limit(8).all()],
        }}, 200
