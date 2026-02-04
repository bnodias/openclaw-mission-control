"""normalize task statuses

Revision ID: 75e05e158ca9
Revises: 4b2a5e2dbb6e
Create Date: 2026-02-05 00:16:48.958679

"""
from __future__ import annotations

from alembic import op


# revision identifiers, used by Alembic.
revision = '75e05e158ca9'
down_revision = '4b2a5e2dbb6e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE tasks SET status='in_progress' WHERE status IN ('assigned','testing')"
    )


def downgrade() -> None:
    pass
