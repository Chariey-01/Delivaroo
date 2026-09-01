"""merge redundant migration heads

Revision ID: 6835b08741d3
Revises: f7c00f8255dc, e7c9d2a4b5f6
Create Date: 2026-08-31 06:44:51.085771

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6835b08741d3'
down_revision = ('f7c00f8255dc', 'e7c9d2a4b5f6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
