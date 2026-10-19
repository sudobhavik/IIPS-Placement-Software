"""
API routes for user management and profile operations.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.api.v1.auth import get_current_admin_user, get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserAdminUpdate, UserListResponse, UserRead, UserUpdate
from app.services import user_services

router = APIRouter(prefix="/users", tags=["users"])


def get_current_super_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
    return user


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_current_admin_user)]
SuperAdminUser = Annotated[User, Depends(get_current_super_admin)]


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser):
    """Retrieve the currently authenticated user's profile."""
    return user


@router.patch("/me", response_model=UserRead)
def update_me(data: UserUpdate, db: DbSession, user: CurrentUser):
    """Update the currently authenticated user's allowed profile fields."""
    updates = data.model_dump(exclude_unset=True)
    return user_services.update_user_profile(db, user, updates)


@router.get("", response_model=UserListResponse)
def list_users(
    db: DbSession,
    _: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
):
    """Retrieve a paginated list of users, with optional filtering."""
    items, total = user_services.list_users(
        db, page=page, page_size=page_size, role=role, is_active=is_active, search=search
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{id}", response_model=UserRead)
def get_user(id: int, db: DbSession, _: AdminUser):
    """Retrieve a specific user by their ID."""
    if not (user := user_services.get_user_by_id(db, id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.patch("/{id}", response_model=UserRead)
def update_user(id: int, data: UserAdminUpdate, db: DbSession, admin: SuperAdminUser):
    """Update a specific user's role or active status (Super Admin only)."""
    if not (user := user_services.get_user_by_id(db, id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    if user.id == admin.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Cannot change your own role or active status"
        )
    
    updates = data.model_dump(exclude_unset=True)
    return user_services.update_user_profile(db, user, updates)
