from uuid import uuid4

from app.extensions import db


class WeightCategory(db.Model):
    __tablename__ = "weight_categories"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name = db.Column(
        db.String(50),
        nullable=False,
        unique=True,
    )

    min_weight = db.Column(
        db.Numeric(10, 2),
        nullable=False,
    )

    max_weight = db.Column(
        db.Numeric(10, 2),
        nullable=False,
    )

    base_price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    price_per_km = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
    )