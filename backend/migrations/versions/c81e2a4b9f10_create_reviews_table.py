"""create reviews table

Revision ID: c81e2a4b9f10
Revises: 8b7c6d5e4f3a
"""
from alembic import op
import sqlalchemy as sa

revision = "c81e2a4b9f10"
down_revision = "8b7c6d5e4f3a"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("parcel_id", sa.Uuid(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=1000), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("moderated_by", sa.Uuid(), nullable=True),
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating"),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_reviews_status"),
        sa.ForeignKeyConstraint(["moderated_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["parcel_id"], ["parcels.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("parcel_id", name="uq_reviews_parcel_id"),
    )
    op.create_index("ix_reviews_user_id", "reviews", ["user_id"])
    op.create_index("ix_reviews_parcel_id", "reviews", ["parcel_id"], unique=True)
    op.create_index("ix_reviews_status", "reviews", ["status"])


def downgrade():
    op.drop_index("ix_reviews_status", table_name="reviews")
    op.drop_index("ix_reviews_parcel_id", table_name="reviews")
    op.drop_index("ix_reviews_user_id", table_name="reviews")
    op.drop_table("reviews")
