"""merge status_history and password_reset_token heads

Revision ID: 4316d68771df
Revises: 59eccf900871, d34ad9b0d1bd
Create Date: 2026-08-30 10:16:09.095703

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4316d68771df'
down_revision = ('59eccf900871', 'd34ad9b0d1bd')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
