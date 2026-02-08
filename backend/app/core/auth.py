from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer
from fastapi_clerk_auth import HTTPAuthorizationCredentials as ClerkCredentials
from pydantic import BaseModel, ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db import crud
from app.db.session import get_session
from app.models.users import User

security = HTTPBearer(auto_error=False)


class ClerkTokenPayload(BaseModel):
    sub: str


@lru_cache
def _build_clerk_http_bearer(auto_error: bool) -> ClerkHTTPBearer:
    if not settings.clerk_jwks_url:
        raise RuntimeError("CLERK_JWKS_URL is not set.")
    clerk_config = ClerkConfig(
        jwks_url=settings.clerk_jwks_url,
        verify_iat=settings.clerk_verify_iat,
        leeway=settings.clerk_leeway,
    )
    return ClerkHTTPBearer(config=clerk_config, auto_error=auto_error, add_state=True)


@dataclass
class AuthContext:
    actor_type: Literal["user"]
    user: User | None = None


def _resolve_clerk_auth(
    request: Request, fallback: ClerkCredentials | None
) -> ClerkCredentials | None:
    auth_data = getattr(request.state, "clerk_auth", None)
    if isinstance(auth_data, ClerkCredentials):
        return auth_data
    return fallback


def _parse_subject(auth_data: ClerkCredentials | None) -> str | None:
    if not auth_data or not auth_data.decoded:
        return None
    payload = ClerkTokenPayload.model_validate(auth_data.decoded)
    return payload.sub


async def get_auth_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> AuthContext:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        guard = _build_clerk_http_bearer(auto_error=False)
        clerk_credentials = await guard(request)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR) from exc
    except HTTPException as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc

    auth_data = _resolve_clerk_auth(request, clerk_credentials)
    try:
        clerk_user_id = _parse_subject(auth_data)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc

    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    claims: dict[str, object] = {}
    if auth_data and auth_data.decoded:
        claims = auth_data.decoded
    email_obj = claims.get("email")
    name_obj = claims.get("name")
    defaults: dict[str, object | None] = {
        "email": email_obj if isinstance(email_obj, str) else None,
        "name": name_obj if isinstance(name_obj, str) else None,
    }
    user, _created = await crud.get_or_create(
        session,
        User,
        clerk_user_id=clerk_user_id,
        defaults=defaults,
    )
    from app.services.organizations import ensure_member_for_user

    await ensure_member_for_user(session, user)

    return AuthContext(
        actor_type="user",
        user=user,
    )


async def get_auth_context_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> AuthContext | None:
    if request.headers.get("X-Agent-Token"):
        return None
    if credentials is None:
        return None

    try:
        guard = _build_clerk_http_bearer(auto_error=False)
        clerk_credentials = await guard(request)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR) from exc
    except HTTPException:
        return None

    auth_data = _resolve_clerk_auth(request, clerk_credentials)
    try:
        clerk_user_id = _parse_subject(auth_data)
    except ValidationError:
        return None

    if not clerk_user_id:
        return None

    claims: dict[str, object] = {}
    if auth_data and auth_data.decoded:
        claims = auth_data.decoded
    email_obj = claims.get("email")
    name_obj = claims.get("name")
    defaults: dict[str, object | None] = {
        "email": email_obj if isinstance(email_obj, str) else None,
        "name": name_obj if isinstance(name_obj, str) else None,
    }
    user, _created = await crud.get_or_create(
        session,
        User,
        clerk_user_id=clerk_user_id,
        defaults=defaults,
    )
    from app.services.organizations import ensure_member_for_user

    await ensure_member_for_user(session, user)

    return AuthContext(
        actor_type="user",
        user=user,
    )
