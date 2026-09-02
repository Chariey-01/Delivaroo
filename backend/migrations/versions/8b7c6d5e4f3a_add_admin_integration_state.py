"""add admin integration state

Revision ID: 8b7c6d5e4f3a
Revises: 72b6f1a9c4d2
Create Date: 2026-09-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "8b7c6d5e4f3a"
down_revision = "72b6f1a9c4d2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(length=80), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )
    op.create_table(
        "transport_availability",
        sa.Column("mode", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('AVAILABLE', 'BUSY', 'OFFLINE')",
            name="ck_transport_availability_status",
        ),
        sa.PrimaryKeyConstraint("mode"),
    )
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.add_column(sa.Column("declared_weight_kg", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("verified_weight_kg", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("weighed_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("weighed_by", sa.UUID(), nullable=True))
        batch_op.create_foreign_key("fk_parcels_weighed_by_users", "users", ["weighed_by"], ["id"])


def downgrade():
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.drop_constraint("fk_parcels_weighed_by_users", type_="foreignkey")
        batch_op.drop_column("weighed_by")
        batch_op.drop_column("weighed_at")
        batch_op.drop_column("verified_weight_kg")
        batch_op.drop_column("declared_weight_kg")
    op.drop_table("transport_availability")
    op.drop_table("platform_settings")
