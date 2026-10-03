# TEMPORARY STUB. Replace with the colleague's auth when merged.
from fastapi import Depends, HTTPException, status

from app.models.user import User


def get_current_user() -> User:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Auth not wired yet")


def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return current_user

    return checker
