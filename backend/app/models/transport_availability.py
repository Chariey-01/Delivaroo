from app.extensions import db
from app.models.transport import TRANSPORT_MODES


class TransportAvailability(db.Model):
    __tablename__ = "transport_availability"
    __table_args__ = (
        db.CheckConstraint(
            "status IN ('AVAILABLE', 'BUSY', 'OFFLINE')",
            name="ck_transport_availability_status",
        ),
    )

    mode = db.Column(db.String(20), primary_key=True)
    status = db.Column(db.String(20), nullable=False, default="AVAILABLE")
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now(),
    )

    @staticmethod
    def valid_modes():
        return {*TRANSPORT_MODES.keys(), "ROAD", "DRONE"}
