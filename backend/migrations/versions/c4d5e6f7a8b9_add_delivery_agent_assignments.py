"""add delivery agent assignments

Revision ID: c4d5e6f7a8b9
Revises: f2a1c3d4e5b6
"""

from alembic import op
import sqlalchemy as sa


revision = "c4d5e6f7a8b9"
down_revision = "f2a1c3d4e5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "delivery_agents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("transport_mode", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "transport_mode IN ('MOTORBIKE', 'TRUCK', 'SHIP', 'AIR')",
            name="ck_delivery_agents_transport_mode",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.add_column(sa.Column("delivery_agent_id", sa.UUID(), nullable=True))
        batch_op.create_foreign_key(
            "fk_parcels_delivery_agent_id",
            "delivery_agents",
            ["delivery_agent_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.drop_constraint("fk_parcels_delivery_agent_id", type_="foreignkey")
        batch_op.drop_column("delivery_agent_id")
    op.drop_table("delivery_agents")
