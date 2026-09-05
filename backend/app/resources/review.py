from datetime import datetime, timezone

from flask import current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from uuid import UUID

from app.extensions import db
from app.models import Parcel, Review
from app.services.audit_log_service import record_audit_log
from app.services.notification_service import notify_event
from app.utils.auth_decorators import admin_required


def _page_args():
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(50, max(1, int(request.args.get("per_page", 12))))
    except (TypeError, ValueError):
        return None
    return page, per_page


def _paginated(query, public=False):
    args = _page_args()
    if not args:
        return {"message": "page and per_page must be positive integers"}, 400
    page, per_page = args
    result = query.order_by(Review.created_at.desc(), Review.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return {
        "data": {
            "items": [item.to_dict(public=public) for item in result.items],
            "pagination": {"page": page, "per_page": per_page, "total": result.total, "pages": result.pages},
        }
    }, 200


class ReviewListResource(Resource):
    @jwt_required()
    def post(self):
        payload = request.get_json(silent=True) or {}
        parcel_id = payload.get("parcel_id")
        if not parcel_id:
            return {"message": "parcel_id is required"}, 400
        try:
            parcel = db.session.get(Parcel, UUID(str(parcel_id)))
            user_id = UUID(str(get_jwt_identity()))
        except (TypeError, ValueError):
            return {"message": "Parcel not found"}, 404
        if not parcel or str(parcel.user_id) != str(user_id):
            return {"message": "Parcel not found"}, 404
        if parcel.status.upper() != "DELIVERED":
            return {"message": "Only delivered parcels can be reviewed"}, 409
        if Review.query.filter_by(parcel_id=parcel.id).first():
            return {"message": "This parcel has already been reviewed"}, 409
        try:
            review = Review(user_id=user_id, parcel_id=parcel.id, rating=payload.get("rating"), comment=payload.get("comment"))
            db.session.add(review)
            db.session.commit()
        except (ValueError, TypeError) as error:
            db.session.rollback()
            return {"message": str(error)}, 400
        except IntegrityError:
            db.session.rollback()
            return {"message": "This parcel has already been reviewed"}, 409
        return {"message": "Thank you. Your review has been submitted for approval.", "data": review.to_dict()}, 201


class MyReviewListResource(Resource):
    @jwt_required()
    def get(self):
        return _paginated(Review.query.filter_by(user_id=get_jwt_identity()))


class PublicReviewListResource(Resource):
    def get(self):
        return _paginated(Review.query.filter_by(status="approved"), public=True)


class AdminReviewListResource(Resource):
    @admin_required
    def get(self):
        query = Review.query
        status = request.args.get("status")
        if status:
            if status not in {"pending", "approved", "rejected"}:
                return {"message": "Invalid review status"}, 400
            query = query.filter_by(status=status)
        return _paginated(query)


class AdminReviewResource(Resource):
    @admin_required
    def get(self, review_id):
        review = db.session.get(Review, review_id)
        if not review:
            return {"message": "Review not found"}, 404
        return {"data": review.to_dict()}, 200


class AdminReviewModerationResource(Resource):
    @admin_required
    def patch(self, review_id, decision):
        if decision not in {"approve", "reject"}:
            return {"message": "Invalid moderation decision"}, 404
        review = db.session.get(Review, review_id)
        if not review:
            return {"message": "Review not found"}, 404
        moderator_id = UUID(str(get_jwt_identity()))
        if str(review.user_id) == str(moderator_id):
            return {"message": "Users cannot moderate their own reviews"}, 403
        old_status = review.status
        review.status = "approved" if decision == "approve" else "rejected"
        review.moderated_by = moderator_id
        review.moderated_at = datetime.now(timezone.utc)
        record_audit_log(
            user_id=moderator_id, action=f"REVIEW_{review.status.upper()}", entity_type="review",
            entity_id=review.id, old_value={"status": old_status}, new_value={"status": review.status},
            ip_address=request.remote_addr,
        )
        db.session.commit()
        try:
            notify_event(
                current_app._get_current_object(), recipient_user_id=review.user_id, actor_user_id=moderator_id,
                event_type=f"REVIEW_{review.status.upper()}", parcel=review.parcel,
                metadata={"review_id": str(review.id), "status": review.status},
                idempotency_key=f"review-moderation:{review.id}:{review.status}",
            )
        except (ValueError, RuntimeError):
            current_app.logger.exception("Unable to create review moderation notification")
        return {"message": f"Review {review.status}", "data": review.to_dict()}, 200
