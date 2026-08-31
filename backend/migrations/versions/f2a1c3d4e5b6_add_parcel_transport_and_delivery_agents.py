"""add parcel transport mode

Revision ID: f2a1c3d4e5b6
Revises: e7c9d2a4b5f6
"""

from alembic import op
import sqlalchemy as sa


revision = "f2a1c3d4e5b6"
down_revision = "e7c9d2a4b5f6"
branch_labels = None
depends_on = None


TRANSPORT_MODES = "'MOTORBIKE', 'TRUCK', 'SHIP', 'AIR'"


def upgrade():
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.add_column(
            sa.Column(
                "transport_mode",
                sa.String(length=20),
                nullable=False,
                server_default="MOTORBIKE",
            )
        )
        batch_op.create_check_constraint(
            "ck_parcels_transport_mode",
            f"transport_mode IN ({TRANSPORT_MODES})",
        )


def downgrade():
    with op.batch_alter_table("parcels") as batch_op:
        batch_op.drop_constraint("ck_parcels_transport_mode", type_="check")
        batch_op.drop_column("transport_mode")
