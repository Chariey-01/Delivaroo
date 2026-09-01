"""create audit_logs table

Revision ID: 9a1c4e7f2b3d
Revises: 28f2b09080b0
Create Date: 2026-08-30 10:19:01.193571

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '9a1c4e7f2b3d'
down_revision = '28f2b09080b0'
branch_labels = None
depends_on = None


def upgrade():
    if inspect(op.get_bind()).has_table('audit_logs'):
        return

    op.create_table('audit_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('action', sa.String(length=100), nullable=False),
    sa.Column('entity_type', sa.String(length=50), nullable=False),
    sa.Column('entity_id', sa.UUID(), nullable=True),
    sa.Column('old_value', sa.Text(), nullable=True),
    sa.Column('new_value', sa.Text(), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    if not inspect(op.get_bind()).has_table('audit_logs'):
        return

    op.drop_table('audit_logs')
