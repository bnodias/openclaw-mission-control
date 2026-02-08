"""backfill_invite_access

Revision ID: 050c16fde00e
Revises: 2c7b1c4d9e10
Create Date: 2026-02-08 20:07:14.621575

"""
from __future__ import annotations

from datetime import datetime
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '050c16fde00e'
down_revision = '2c7b1c4d9e10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    now = datetime.utcnow()
    rows = bind.execute(
        sa.text(
            """
            SELECT
                m.id AS member_id,
                iba.board_id AS board_id,
                iba.can_read AS can_read,
                iba.can_write AS can_write
            FROM organization_invites i
            JOIN organization_invite_board_access iba
                ON iba.organization_invite_id = i.id
            JOIN organization_members m
                ON m.user_id = i.accepted_by_user_id
                AND m.organization_id = i.organization_id
            WHERE i.accepted_at IS NOT NULL
            """
        )
    ).fetchall()

    for row in rows:
        can_write = bool(row.can_write)
        can_read = bool(row.can_read or row.can_write)
        bind.execute(
            sa.text(
                """
                INSERT INTO organization_board_access (
                    id,
                    organization_member_id,
                    board_id,
                    can_read,
                    can_write,
                    created_at,
                    updated_at
                )
                VALUES (
                    :id,
                    :member_id,
                    :board_id,
                    :can_read,
                    :can_write,
                    :now,
                    :now
                )
                ON CONFLICT (organization_member_id, board_id) DO UPDATE
                SET
                    can_read = organization_board_access.can_read OR EXCLUDED.can_read,
                    can_write = organization_board_access.can_write OR EXCLUDED.can_write,
                    updated_at = EXCLUDED.updated_at
                """
            ),
            {
                "id": uuid.uuid4(),
                "member_id": row.member_id,
                "board_id": row.board_id,
                "can_read": can_read,
                "can_write": can_write,
                "now": now,
            },
        )


def downgrade() -> None:
    pass
