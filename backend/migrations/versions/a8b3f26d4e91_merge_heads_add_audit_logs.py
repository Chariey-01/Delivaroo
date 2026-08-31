"""merge migration heads (audit_logs already created by 9a1c4e7f2b3d)

Revision ID: a8b3f26d4e91
Revises: d34ad9b0d1bd, 59eccf900871
Create Date: 2026-08-30 00:00:00.000000

NOTE: This originally also created audit_logs, but that table is
already created by migration 9a1c4e7f2b3d earlier in the merged chain.
Neutralized to a pure merge migration to avoid a duplicate-table error.
Resolved with Charity - she confirmed 9a1c4e7f2b3d is the canonical
audit_logs schema.
"""
from alembic import op
import sqlalchemy as sa

revision = "a8b3f26d4e91"
down_revision = ("d34ad9b0d1bd", "59eccf900871")
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
