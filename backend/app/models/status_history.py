import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class StatusHistory(db.Model):
    __tablename__ = "status_history"

    id = db.Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    parcel_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("parcels.id"), nullable=False, index=True
    )
    changed_by = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False
    )
    status = db.Column(db.String(30), nullable=False)
    latitude = db.Column(db.Numeric(10, 7), nullable=True)
    longitude = db.Column(db.Numeric(10, 7), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "parcel_id": str(self.parcel_id),
            "changed_by": str(self.changed_by),
            "status": self.status,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<StatusHistory parcel={self.parcel_id} status={self.status}>"