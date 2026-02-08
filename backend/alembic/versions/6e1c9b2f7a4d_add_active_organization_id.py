"""add active organization to users

Revision ID: 6e1c9b2f7a4d
Revises: 050c16fde00e
Create Date: 2026-02-08
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "6e1c9b2f7a4d"
down_revision = "050c16fde00e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("active_organization_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        "ix_users_active_organization_id",
        "users",
        ["active_organization_id"],
    )
    op.create_foreign_key(
        "fk_users_active_organization",
        "users",
        "organizations",
        ["active_organization_id"],
        ["id"],
    )

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            """
            SELECT user_id, organization_id
            FROM organization_members
            ORDER BY user_id, created_at ASC
            """
        )
    ).fetchall()
    seen: set[str] = set()
    for row in rows:
        user_id = str(row.user_id)
        if user_id in seen:
            continue
        seen.add(user_id)
        bind.execute(
            sa.text(
                """
                UPDATE users
                SET active_organization_id = :org_id
                WHERE id = :user_id
                  AND active_organization_id IS NULL
                """
            ),
            {"org_id": row.organization_id, "user_id": row.user_id},
        )


def downgrade() -> None:
    op.drop_constraint("fk_users_active_organization", "users", type_="foreignkey")
    op.drop_index("ix_users_active_organization_id", table_name="users")
    op.drop_column("users", "active_organization_id")
