"""create addresses table

Revision ID: 28f2b09080b0
Revises: 4316d68771df
Create Date: 2026-08-30 10:19:01.193571

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28f2b09080b0'
down_revision = '4316d68771df'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('addresses',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('label', sa.String(length=100), nullable=True),
    sa.Column('address_line', sa.String(length=255), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=False),
    sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True),
    sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True),
    sa.Column('is_default', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('addresses', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_addresses_user_id'), ['user_id'], unique=False)


def downgrade():
    with op.batch_alter_table('addresses', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_addresses_user_id'))
    op.drop_table('addresses')
