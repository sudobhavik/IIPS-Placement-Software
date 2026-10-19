"""
Service layer for User-related database operations.
"""

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Retrieve a user by their ID."""
    return db.get(User, user_id)


def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    role: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Retrieve a paginated list of users, with optional search, returning (items, total)."""
    query = select(User)
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    if search:
        term = f"%{search}%"
        query = query.where(or_(User.full_name.ilike(term), User.email.ilike(term)))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = list(
        db.scalars(
            query.order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    return items, total


def update_user_profile(db: Session, user: User, updates: dict[str, Any]) -> User:
    """Update a user's fields based on a dictionary of changes."""
    if not updates:
        return user

    for key, value in updates.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user
