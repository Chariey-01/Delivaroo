"""merge profile and delivery-agent migration heads

Revision ID: 179caaa6fbeb
Revises: 6835b08741d3, c4d5e6f7a8b9
Create Date: 2026-08-31 07:03:31.873044

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '179caaa6fbeb'
down_revision = ('6835b08741d3', 'c4d5e6f7a8b9')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
