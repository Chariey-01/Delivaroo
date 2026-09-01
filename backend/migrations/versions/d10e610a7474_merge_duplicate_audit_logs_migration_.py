"""merge duplicate audit_logs migration heads

Revision ID: d10e610a7474
Revises: 9a1c4e7f2b3d, a8b3f26d4e91
Create Date: 2026-08-30 23:33:43.251662

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd10e610a7474'
down_revision = ('9a1c4e7f2b3d', 'a8b3f26d4e91')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
