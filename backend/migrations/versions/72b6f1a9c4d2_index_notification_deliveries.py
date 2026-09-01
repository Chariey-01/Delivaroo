"""index notification deliveries

Revision ID: 72b6f1a9c4d2
Revises: 0f93aebad1c1
"""

from alembic import op


revision = "72b6f1a9c4d2"
down_revision = "0f93aebad1c1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_notification_deliveries_notification_id",
        "notification_deliveries",
        ["notification_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_notification_deliveries_notification_id",
        table_name="notification_deliveries",
    )
