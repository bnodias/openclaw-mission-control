from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel


class OrganizationRead(SQLModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class OrganizationCreate(SQLModel):
    name: str


class OrganizationActiveUpdate(SQLModel):
    organization_id: UUID


class OrganizationListItem(SQLModel):
    id: UUID
    name: str
    role: str
    is_active: bool


class OrganizationUserRead(SQLModel):
    id: UUID
    email: str | None = None
    name: str | None = None
    preferred_name: str | None = None


class OrganizationMemberRead(SQLModel):
    id: UUID
    organization_id: UUID
    user_id: UUID
    role: str
    all_boards_read: bool
    all_boards_write: bool
    created_at: datetime
    updated_at: datetime
    user: OrganizationUserRead | None = None
    board_access: list[OrganizationBoardAccessRead] = Field(default_factory=list)


class OrganizationMemberUpdate(SQLModel):
    role: str | None = None


class OrganizationBoardAccessSpec(SQLModel):
    board_id: UUID
    can_read: bool = True
    can_write: bool = False


class OrganizationBoardAccessRead(SQLModel):
    id: UUID
    board_id: UUID
    can_read: bool
    can_write: bool
    created_at: datetime
    updated_at: datetime


class OrganizationMemberAccessUpdate(SQLModel):
    all_boards_read: bool = False
    all_boards_write: bool = False
    board_access: list[OrganizationBoardAccessSpec] = Field(default_factory=list)


class OrganizationInviteCreate(SQLModel):
    invited_email: str
    role: str = "member"
    all_boards_read: bool = False
    all_boards_write: bool = False
    board_access: list[OrganizationBoardAccessSpec] = Field(default_factory=list)


class OrganizationInviteRead(SQLModel):
    id: UUID
    organization_id: UUID
    invited_email: str
    role: str
    all_boards_read: bool
    all_boards_write: bool
    token: str
    created_by_user_id: UUID | None = None
    accepted_by_user_id: UUID | None = None
    accepted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OrganizationInviteAccept(SQLModel):
    token: str
