from uuid import uuid4

from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=True,
    )

    action = db.Column(
        db.String(100),
        nullable=False,
    )

    entity_type = db.Column(
        db.String(100),
        nullable=False,
    )

    entity_id = db.Column(
        db.UUID(as_uuid=True),
        nullable=True,
    )

    old_value = db.Column(
        db.JSON,
        nullable=True,
    )

    new_value = db.Column(
        db.JSON,
        nullable=True,
    )

    ip_address = db.Column(
        db.String(45),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )
