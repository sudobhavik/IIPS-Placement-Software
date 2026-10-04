import logging
from datetime import UTC, date, datetime, timedelta

import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    decode_access_token,
    generate_opaque_token,
    hash_password,
    needs_rehash,
    sha256_hex,
    validate_password_strength,
    verify_password,
)
from app.models.user import PasswordResetToken, RefreshToken, User

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def create_access_token(self, user_id: int, expires_delta: timedelta | None = None) -> str:
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

    def decode_access_token(self, token: str) -> dict:
        return decode_access_token(token)

    def create_refresh_token(
        self, user: User, user_agent: str | None = None
    ) -> tuple[str, RefreshToken]:
        token = generate_opaque_token()
        token_hash = sha256_hex(token)
        expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked_at=None,
            user_agent=user_agent,
        )
        self.db.add(refresh_token)
        self.db.flush()
        return token, refresh_token

    def verify_refresh_token(self, token: str) -> RefreshToken | None:
        token_hash = sha256_hex(token)
        rt = self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(UTC),
            )
        ).scalar_one_or_none()
        return rt

    def revoke_refresh_token(self, token: str) -> bool:
        token_hash = sha256_hex(token)
        rt = self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        ).scalar_one_or_none()
        if rt and rt.revoked_at is None:
            rt.revoked_at = datetime.now(UTC)
            self.db.commit()
            return True
        return False

    def revoke_all_user_tokens(self, user_id: int) -> int:
        tokens = (
            self.db.execute(
                select(RefreshToken).where(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked_at.is_(None),
                )
            )
            .scalars()
            .all()
        )
        count = 0
        for rt in tokens:
            rt.revoked_at = datetime.now(UTC)
            count += 1
        if count:
            self.db.commit()
        return count

    def authenticate(self, identifier: str, password: str) -> User | None:
        """Authenticate user by email or enrollment number.

        Returns user on success, None on failure. All failure cases return None
        to prevent user enumeration. A dummy hash verification is run when user
        is not found to keep timing consistent.
        """
        # First, try to find user by email
        user = self.db.execute(
            select(User).where(
                User.email == identifier.lower().strip(),
                User.is_active,
            )
        ).scalar_one_or_none()

        # If not found by email, try enrollment number
        if not user:
            from app.models.student import Student

            student = self.db.execute(
                select(Student).where(
                    Student.enrollment_no == identifier.upper().strip(),
                )
            ).scalar_one_or_none()
            if student:
                user = self.db.execute(
                    select(User).where(User.id == student.user_id, User.is_active)
                ).scalar_one_or_none()

        # Run dummy verification to keep timing consistent
        if not user or not user.password_hash:
            # Use a real argon2 hash for timing consistency
            dummy_hash = "$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHQ$O5R5K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K9K"
            try:
                verify_password(password, dummy_hash)
            except Exception:
                pass
            return None

        if not verify_password(password, user.password_hash):
            return None

        # Check if password needs rehash
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)

        user.last_login_at = datetime.now(UTC)
        self.db.commit()

        # Write login audit
        self._write_login_audit(user.id, success=True)

        return user

    def get_user_by_email(self, email: str) -> User | None:
        return self.db.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()

    def get_user_by_enrollment(self, enrollment_no: str) -> User | None:
        from app.models.student import Student

        student = self.db.execute(
            select(Student).where(Student.enrollment_no == enrollment_no.upper())
        ).scalar_one_or_none()
        if student:
            return self.db.execute(
                select(User).where(User.id == student.user_id)
            ).scalar_one_or_none()
        return None

    def change_password(
        self, user_id: int, current_password: str, new_password: str, email: str, enrollment_no: str
    ) -> tuple[bool, str | None]:
        """Change user's password after verifying current password."""
        user = self.db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return False, "User not found"

        if not user.password_hash or not verify_password(current_password, user.password_hash):
            return False, "Current password is incorrect"

        # Validate new password strength
        is_valid, error = validate_password_strength(
            new_password, email=email, enrollment_no=enrollment_no
        )
        if not is_valid:
            return False, error

        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        self.db.commit()

        # Revoke all other refresh tokens (force re-login on other devices)
        self.revoke_all_user_tokens(user_id)

        return True, None

    def _write_login_audit(self, user_id: int, success: bool) -> None:
        from app.models.audit import AuditLog

        audit = AuditLog(
            actor_user_id=user_id if success else None,
            action="login" if success else "login_failed",
            entity_type="user",
            entity_id=str(user_id) if success else None,
            old_values=None,
            new_values={"success": success},
            ip_address=None,
            request_id=None,
        )
        self.db.add(audit)


class ActivationService:
    def __init__(self, db: Session):
        self.db = db

    def create_activation_token(self, user: User) -> tuple[PasswordResetToken, str]:
        # Invalidate any earlier unused activation tokens for this user
        self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.purpose == "activate",
                PasswordResetToken.used_at.is_(None),
            )
        ).scalars().all()  # Just to fetch, we'll update them below

        # Invalidate old unused tokens
        for old_token in (
            self.db.execute(
                select(PasswordResetToken).where(
                    PasswordResetToken.user_id == user.id,
                    PasswordResetToken.purpose == "activate",
                    PasswordResetToken.used_at.is_(None),
                )
            )
            .scalars()
            .all()
        ):
            old_token.used_at = datetime.now(UTC)

        token = generate_opaque_token()
        token_hash = sha256_hex(token)
        expires_at = datetime.now(UTC) + timedelta(hours=settings.activation_token_expire_hours)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            purpose="activate",
            expires_at=expires_at,
            used_at=None,
        )
        self.db.add(reset_token)
        self.db.commit()
        return reset_token, token

    def verify_activation_token(self, token: str) -> PasswordResetToken | None:
        token_hash = sha256_hex(token)
        prt = self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.purpose == "activate",
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.now(UTC),
            )
        ).scalar_one_or_none()
        return prt

    def check_activation_token(self, token: str) -> bool:
        """Cheap pre-check: returns True if token exists, is unused, and unexpired."""
        prt = self.verify_activation_token(token)
        return prt is not None

    def activate_account(
        self,
        token: str,
        enrollment_no: str,
        dob: date,
        new_password: str,
        accepted_terms: bool,
    ) -> tuple[bool, str | None]:
        if not accepted_terms:
            return False, "Terms must be accepted"

        prt = self.verify_activation_token(token)
        if not prt:
            return False, "Invalid or expired activation link, or details do not match"

        user = self.db.execute(select(User).where(User.id == prt.user_id)).scalar_one_or_none()
        if not user:
            return False, "Invalid or expired activation link, or details do not match"

        from app.models.student import Student

        student = self.db.execute(
            select(Student).where(
                Student.user_id == user.id,
                Student.enrollment_no == enrollment_no.upper().strip(),
                Student.date_of_birth == dob,
            )
        ).scalar_one_or_none()

        if not student:
            # Increment failed attempts
            prt.failed_attempts = (prt.failed_attempts or 0) + 1
            if prt.failed_attempts >= 5:
                prt.used_at = datetime.now(UTC)  # Lock the token
                self.db.commit()
                return False, "Invalid or expired activation link, or details do not match"
            self.db.commit()
            return False, "Invalid or expired activation link, or details do not match"

        # Validate password strength
        is_valid, error = validate_password_strength(
            new_password, email=user.email, enrollment_no=enrollment_no
        )
        if not is_valid:
            return False, error

        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        user.is_active = True
        user.activated_at = datetime.now(UTC)

        prt.used_at = datetime.now(UTC)

        self.db.commit()

        # Write activation audit
        from app.models.audit import AuditLog

        audit = AuditLog(
            actor_user_id=user.id,
            action="activation",
            entity_type="user",
            entity_id=str(user.id),
            old_values={"activated": False},
            new_values={"activated": True, "activated_at": user.activated_at.isoformat()},
            ip_address=None,
            request_id=None,
        )
        self.db.add(audit)
        self.db.commit()

        logger.info("Account activated for user %d", user.id)
        return True, None
