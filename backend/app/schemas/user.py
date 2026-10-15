"""
Pydantic schemas for User data validation and serialization.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import UserRole


class UserRead(BaseModel):
    """Schema for returning user data in API responses."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool
    last_login_at: datetime | None


class UserUpdate(BaseModel):
    """Schema for users updating their own profile data."""
    full_name: str | None = None
    phone: str | None = None


class UserAdminUpdate(BaseModel):
    """Schema for administrators updating a user's role or active status."""
    role: UserRole | None = None
    is_active: bool | None = None


class UserListResponse(BaseModel):
    """Schema for paginated lists of users."""
    items: list[UserRead]
    total: int
    page: int
    page_size: int
