"""add organizations

Revision ID: 1f2a3b4c5d6e
Revises: 9f0c4fb2a7b8
Create Date: 2026-02-07
"""

from __future__ import annotations

from datetime import datetime
import uuid

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "1f2a3b4c5d6e"
down_revision = "9f0c4fb2a7b8"
branch_labels = None
depends_on = None


DEFAULT_ORG_NAME = "Personal"


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("name", name="uq_organizations_name"),
    )
    op.create_index("ix_organizations_name", "organizations", ["name"])

    op.create_table(
        "organization_members",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
        sa.Column("all_boards_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("all_boards_write", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_org_members_org"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_org_members_user"),
        sa.UniqueConstraint(
            "organization_id",
            "user_id",
            name="uq_organization_members_org_user",
        ),
    )
    op.create_index("ix_org_members_org", "organization_members", ["organization_id"])
    op.create_index("ix_org_members_user", "organization_members", ["user_id"])
    op.create_index("ix_org_members_role", "organization_members", ["role"])

    op.create_table(
        "organization_board_access",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("organization_member_id", sa.UUID(), nullable=False),
        sa.Column("board_id", sa.UUID(), nullable=False),
        sa.Column("can_read", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("can_write", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_member_id"],
            ["organization_members.id"],
            name="fk_org_board_access_member",
        ),
        sa.ForeignKeyConstraint(["board_id"], ["boards.id"], name="fk_org_board_access_board"),
        sa.UniqueConstraint(
            "organization_member_id",
            "board_id",
            name="uq_org_board_access_member_board",
        ),
    )
    op.create_index(
        "ix_org_board_access_member",
        "organization_board_access",
        ["organization_member_id"],
    )
    op.create_index(
        "ix_org_board_access_board",
        "organization_board_access",
        ["board_id"],
    )

    op.create_table(
        "organization_invites",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("invited_email", sa.String(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
        sa.Column("all_boards_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("all_boards_write", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_by_user_id", sa.UUID(), nullable=True),
        sa.Column("accepted_by_user_id", sa.UUID(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_org_invites_org"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], name="fk_org_invites_creator"),
        sa.ForeignKeyConstraint(["accepted_by_user_id"], ["users.id"], name="fk_org_invites_acceptor"),
        sa.UniqueConstraint("token", name="uq_org_invites_token"),
    )
    op.create_index("ix_org_invites_org", "organization_invites", ["organization_id"])
    op.create_index("ix_org_invites_email", "organization_invites", ["invited_email"])
    op.create_index("ix_org_invites_token", "organization_invites", ["token"])

    op.create_table(
        "organization_invite_board_access",
        sa.Column("id", sa.UUID(), primary_key=True, nullable=False),
        sa.Column("organization_invite_id", sa.UUID(), nullable=False),
        sa.Column("board_id", sa.UUID(), nullable=False),
        sa.Column("can_read", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("can_write", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_invite_id"],
            ["organization_invites.id"],
            name="fk_org_invite_access_invite",
        ),
        sa.ForeignKeyConstraint(["board_id"], ["boards.id"], name="fk_org_invite_access_board"),
        sa.UniqueConstraint(
            "organization_invite_id",
            "board_id",
            name="uq_org_invite_board_access_invite_board",
        ),
    )
    op.create_index(
        "ix_org_invite_access_invite",
        "organization_invite_board_access",
        ["organization_invite_id"],
    )
    op.create_index(
        "ix_org_invite_access_board",
        "organization_invite_board_access",
        ["board_id"],
    )

    op.add_column("boards", sa.Column("organization_id", sa.UUID(), nullable=True))
    op.add_column("board_groups", sa.Column("organization_id", sa.UUID(), nullable=True))
    op.add_column("gateways", sa.Column("organization_id", sa.UUID(), nullable=True))

    op.create_index("ix_boards_organization_id", "boards", ["organization_id"])
    op.create_index("ix_board_groups_organization_id", "board_groups", ["organization_id"])
    op.create_index("ix_gateways_organization_id", "gateways", ["organization_id"])

    op.create_foreign_key(
        "fk_boards_organization_id",
        "boards",
        "organizations",
        ["organization_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_board_groups_organization_id",
        "board_groups",
        "organizations",
        ["organization_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_gateways_organization_id",
        "gateways",
        "organizations",
        ["organization_id"],
        ["id"],
    )

    bind = op.get_bind()
    now = datetime.utcnow()
    org_id = uuid.uuid4()
    bind.execute(
        sa.text(
            "INSERT INTO organizations (id, name, created_at, updated_at) VALUES (:id, :name, :now, :now)"
        ),
        {"id": org_id, "name": DEFAULT_ORG_NAME, "now": now},
    )

    bind.execute(
        sa.text("UPDATE boards SET organization_id = :org_id"),
        {"org_id": org_id},
    )
    bind.execute(
        sa.text("UPDATE board_groups SET organization_id = :org_id"),
        {"org_id": org_id},
    )
    bind.execute(
        sa.text("UPDATE gateways SET organization_id = :org_id"),
        {"org_id": org_id},
    )

    user_rows = list(bind.execute(sa.text("SELECT id FROM users")))
    for row in user_rows:
        user_id = row[0]
        bind.execute(
            sa.text(
                """
                INSERT INTO organization_members
                    (id, organization_id, user_id, role, all_boards_read, all_boards_write, created_at, updated_at)
                VALUES
                    (:id, :org_id, :user_id, :role, :all_read, :all_write, :now, :now)
                """
            ),
            {
                "id": uuid.uuid4(),
                "org_id": org_id,
                "user_id": user_id,
                "role": "owner",
                "all_read": True,
                "all_write": True,
                "now": now,
            },
        )

    op.alter_column("boards", "organization_id", nullable=False)
    op.alter_column("board_groups", "organization_id", nullable=False)
    op.alter_column("gateways", "organization_id", nullable=False)


def downgrade() -> None:
    op.drop_constraint("fk_gateways_organization_id", "gateways", type_="foreignkey")
    op.drop_constraint("fk_board_groups_organization_id", "board_groups", type_="foreignkey")
    op.drop_constraint("fk_boards_organization_id", "boards", type_="foreignkey")

    op.drop_index("ix_gateways_organization_id", table_name="gateways")
    op.drop_index("ix_board_groups_organization_id", table_name="board_groups")
    op.drop_index("ix_boards_organization_id", table_name="boards")

    op.drop_column("gateways", "organization_id")
    op.drop_column("board_groups", "organization_id")
    op.drop_column("boards", "organization_id")

    op.drop_index("ix_org_invite_access_board", table_name="organization_invite_board_access")
    op.drop_index("ix_org_invite_access_invite", table_name="organization_invite_board_access")
    op.drop_table("organization_invite_board_access")

    op.drop_index("ix_org_invites_token", table_name="organization_invites")
    op.drop_index("ix_org_invites_email", table_name="organization_invites")
    op.drop_index("ix_org_invites_org", table_name="organization_invites")
    op.drop_table("organization_invites")

    op.drop_index("ix_org_board_access_board", table_name="organization_board_access")
    op.drop_index("ix_org_board_access_member", table_name="organization_board_access")
    op.drop_table("organization_board_access")

    op.drop_index("ix_org_members_role", table_name="organization_members")
    op.drop_index("ix_org_members_user", table_name="organization_members")
    op.drop_index("ix_org_members_org", table_name="organization_members")
    op.drop_table("organization_members")

    op.drop_index("ix_organizations_name", table_name="organizations")
    op.drop_table("organizations")
