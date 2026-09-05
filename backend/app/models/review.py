from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import validates

from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"
    __table_args__ = (
        db.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),
        db.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_reviews_status",
        ),
    )

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True)
    parcel_id = db.Column(
        db.UUID(as_uuid=True), db.ForeignKey("parcels.id"), nullable=False, unique=True, index=True
    )
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(1000), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    moderated_by = db.Column(db.UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    moderated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=db.func.now()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now()
    )

    user = db.relationship("User", foreign_keys=[user_id])
    parcel = db.relationship("Parcel", back_populates="review")
    moderator = db.relationship("User", foreign_keys=[moderated_by])

    @validates("rating")
    def validate_rating(self, _key, rating):
        if isinstance(rating, bool) or not isinstance(rating, int) or not 1 <= rating <= 5:
            raise ValueError("Rating must be an integer from 1 to 5")
        return rating

    @validates("comment")
    def validate_comment(self, _key, comment):
        if not isinstance(comment, str) or not 10 <= len(comment.strip()) <= 1000:
            raise ValueError("Comment must be between 10 and 1000 characters")
        return comment.strip()

    def to_dict(self, public=False):
        profile = getattr(self.user, "profile", None)
        name = (getattr(profile, "full_name", None) or "Customer").strip().split()[0]
        data = {
            "id": str(self.id),
            "rating": self.rating,
            "comment": self.comment,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if public:
            return {**data, "customer_name": name, "verified_delivery": True}
        return {
            **data,
            "user_id": str(self.user_id),
            "parcel_id": str(self.parcel_id),
            "customer_name": name,
            "moderated_at": self.moderated_at.isoformat() if self.moderated_at else None,
        }
