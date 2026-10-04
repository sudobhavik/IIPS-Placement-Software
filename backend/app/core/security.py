import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

logger = logging.getLogger(__name__)

ph = PasswordHasher()

# Small built-in common password list
COMMON_PASSWORDS = {
    "password",
    "password123",
    "1234567890",
    "qwertyuiop",
    "admin123",
    "welcome123",
    "letmein123",
    "password1",
    "passw0rd",
    "abc12345",
    "Password123",
    "Password1",
    "Pa$$w0rd",
    "12345678",
    "qwerty123",
    "123456789",
    "11111111",
    "aaaaaaaa",
    "iloveyou1",
    "sunshine1",
    "admin",
    "administrator",
    "root",
    "user",
    "test",
    "testing",
}


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def needs_rehash(password_hash: str) -> bool:
    """Check if a password hash needs rehashing (e.g., Argon2 parameters changed)."""
    try:
        return ph.check_needs_rehash(password_hash)
    except Exception:
        return True


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token with minimal claims (no role, no personal data)."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.now(UTC) + expires_delta
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": datetime.now(UTC),
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["sub", "type", "exp", "iat"]},
    )


def generate_opaque_token() -> str:
    """Generate a cryptographically secure opaque token (URL-safe)."""
    return secrets.token_urlsafe(48)


def sha256_hex(value: str) -> str:
    """Return SHA-256 hash of a string as hex."""
    return hashlib.sha256(value.encode()).hexdigest()


def validate_password_strength(
    password: str,
    *,
    email: str,
    enrollment_no: str,
) -> tuple[bool, str | None]:
    """Validate password strength against policy.

    Returns (is_valid, error_message). Error is None if valid.
    """
    if len(password) < 10:
        return False, "Password must be at least 10 characters long"

    if not any(c.isalpha() for c in password):
        return False, "Password must contain at least one letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"

    # Check for email local part in password
    email_local = email.split("@")[0].lower()
    if len(email_local) >= 4 and email_local in password.lower():
        return False, "Password must not contain your email address"

    # Check for enrollment number in password
    if enrollment_no.upper() in password.upper():
        return False, "Password must not contain your enrollment number"

    # Check against common passwords
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common, please choose a different one"

    return True, None
