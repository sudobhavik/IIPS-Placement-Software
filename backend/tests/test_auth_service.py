from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.security import ph
from app.models.enums import UserRole
from app.models.student import Student
from app.models.user import User
from app.services.auth_service import ActivationService, AuthService


@pytest.fixture
def test_user(db: Session, master_data):
    user = User(
        email="test@student.com",
        full_name="Test Student",
        phone="9876543210",
        password_hash=ph.hash("password123"),
        role=UserRole.STUDENT,
        is_active=True,
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def test_student(db: Session, test_user: User, master_data):
    student = Student(
        user_id=test_user.id,
        enrollment_no="DA1234567",
        roll_no="IC-2K22-01",
        course_id=master_data["mca_id"],
        batch_id=master_data["batch_id"],
        current_semester=1,
        current_percentage=85.0,
        active_backlogs=0,
        gap_years=0,
        gender="male",
        date_of_birth=date(2000, 8, 15),
        placement_opt_in=True,
        verification_status="pending",
        profile_completeness=0,
        is_debarred=False,
    )
    db.add(student)
    db.commit()
    return student


@pytest.fixture
def inactive_user(db: Session, master_data):
    user = User(
        email="inactive@student.com",
        full_name="Inactive Student",
        phone="9876543211",
        password_hash=None,  # Not activated yet
        role=UserRole.STUDENT,
        is_active=True,
        must_change_password=True,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def inactive_student(db: Session, inactive_user: User, master_data):
    student = Student(
        user_id=inactive_user.id,
        enrollment_no="DB2345678",
        roll_no="IT-2K22-02",
        course_id=master_data["mca_id"],
        batch_id=master_data["batch_id"],
        current_semester=1,
        current_percentage=80.0,
        active_backlogs=0,
        gap_years=0,
        gender="female",
        date_of_birth=date(2001, 1, 20),
        placement_opt_in=True,
        verification_status="pending",
        profile_completeness=0,
        is_debarred=False,
    )
    db.add(student)
    db.commit()
    return student


def test_hash_and_verify_password(db: Session):
    from app.core.security import hash_password, verify_password

    password = "testpassword123"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token(db: Session, test_user: User):
    auth_service = AuthService(db)
    token = auth_service.create_access_token(test_user.id)

    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify
    payload = auth_service.decode_access_token(token)
    assert payload["sub"] == str(test_user.id)
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_create_refresh_token(db: Session, test_user: User):
    auth_service = AuthService(db)
    token, rt = auth_service.create_refresh_token(test_user, "test-agent")

    assert isinstance(token, str)
    assert len(token) == 64  # secrets.token_urlsafe(48) = 64 chars
    assert rt.user_id == test_user.id
    assert rt.token_hash is not None
    assert rt.user_agent == "test-agent"
    assert rt.revoked_at is None


def test_verify_refresh_token(db: Session, test_user: User):
    auth_service = AuthService(db)
    token, rt = auth_service.create_refresh_token(test_user)

    verified = auth_service.verify_refresh_token(token)
    assert verified is not None
    assert verified.id == rt.id

    # Wrong token
    assert auth_service.verify_refresh_token("wrongtoken") is None


def test_revoke_refresh_token(db: Session, test_user: User):
    auth_service = AuthService(db)
    token, _ = auth_service.create_refresh_token(test_user)

    assert auth_service.verify_refresh_token(token) is not None
    assert auth_service.revoke_refresh_token(token) is True
    assert auth_service.verify_refresh_token(token) is None

    # Revoking again should return False
    assert auth_service.revoke_refresh_token(token) is False


def test_revoke_all_user_tokens(db: Session, test_user: User):
    auth_service = AuthService(db)
    token1, _ = auth_service.create_refresh_token(test_user)
    token2, _ = auth_service.create_refresh_token(test_user)

    count = auth_service.revoke_all_user_tokens(test_user.id)
    assert count == 2

    assert auth_service.verify_refresh_token(token1) is None
    assert auth_service.verify_refresh_token(token2) is None


def test_authenticate_by_email(db: Session, test_user: User, test_student: Student):
    auth_service = AuthService(db)
    user = auth_service.authenticate("test@student.com", "password123")

    assert user is not None
    assert user.id == test_user.id
    assert user.last_login_at is not None


def test_authenticate_by_enrollment(db: Session, test_user: User, test_student: Student):
    auth_service = AuthService(db)
    user = auth_service.get_user_by_enrollment("DA1234567")
    assert user is not None
    assert user.id == test_user.id
    assert ph.verify(user.password_hash, "password123")


def test_authenticate_wrong_password(db: Session, test_user: User, test_student: Student):
    auth_service = AuthService(db)
    user = auth_service.authenticate("test@student.com", "wrongpassword")

    assert user is None


def test_authenticate_inactive_user(db: Session, inactive_user: User, inactive_student: Student):
    auth_service = AuthService(db)
    # User has no password_hash yet
    user = auth_service.authenticate("inactive@student.com", "anypassword")

    assert user is None


def test_authenticate_nonexistent(db: Session):
    auth_service = AuthService(db)
    user = auth_service.authenticate("nonexistent@test.com", "password")

    assert user is None


def test_get_user_by_email(db: Session, test_user: User):
    auth_service = AuthService(db)
    user = auth_service.get_user_by_email("test@student.com")

    assert user is not None
    assert user.id == test_user.id

    # Case insensitive
    user2 = auth_service.get_user_by_email("TEST@STUDENT.COM")
    assert user2 is not None
    assert user2.id == test_user.id


def test_get_user_by_enrollment(db: Session, test_user: User, test_student: Student):
    auth_service = AuthService(db)
    user = auth_service.get_user_by_enrollment("DA1234567")

    assert user is not None
    assert user.id == test_user.id


def test_create_activation_token(db: Session, inactive_user: User):
    activation_service = ActivationService(db)
    prt, token = activation_service.create_activation_token(inactive_user)

    assert prt.user_id == inactive_user.id
    assert prt.purpose == "activate"
    assert prt.used_at is None
    assert prt.expires_at is not None
    assert isinstance(token, str)
    assert len(token) == 64


def test_verify_activation_token(db: Session, inactive_user: User):
    activation_service = ActivationService(db)
    prt, token = activation_service.create_activation_token(inactive_user)

    verified = activation_service.verify_activation_token(token)
    assert verified is not None
    assert verified.id == prt.id

    # Wrong token
    assert activation_service.verify_activation_token("wrongtoken") is None


def test_activate_account_success(db: Session, inactive_user: User, inactive_student: Student):
    activation_service = ActivationService(db)
    prt, token = activation_service.create_activation_token(inactive_user)

    success, error = activation_service.activate_account(
        token=token,
        enrollment_no="DB2345678",
        dob=date(2001, 1, 20),
        new_password="newpassword123",
        accepted_terms=True,
    )

    assert success is True
    assert error is None

    # Verify user was updated
    db.refresh(inactive_user)
    assert inactive_user.password_hash is not None
    assert inactive_user.must_change_password is False
    assert inactive_user.is_active is True
    assert ph.verify(inactive_user.password_hash, "newpassword123")

    # Verify token was used
    db.refresh(prt)
    assert prt.used_at is not None


def test_activate_account_invalid_token(
    db: Session, inactive_user: User, inactive_student: Student
):
    activation_service = ActivationService(db)

    success, error = activation_service.activate_account(
        token="invalidtoken",
        enrollment_no="DB2345678",
        dob=date(2001, 1, 20),
        new_password="newpassword123",
        accepted_terms=True,
    )

    assert success is False
    assert error == "Invalid or expired activation link, or details do not match"


def test_activate_account_wrong_enrollment(
    db: Session, inactive_user: User, inactive_student: Student
):
    activation_service = ActivationService(db)
    _, token = activation_service.create_activation_token(inactive_user)

    success, error = activation_service.activate_account(
        token=token,
        enrollment_no="WRONG1234",
        dob=date(2001, 1, 20),
        new_password="newpassword123",
        accepted_terms=True,
    )

    assert success is False
    assert error == "Invalid or expired activation link, or details do not match"


def test_activate_account_wrong_dob(db: Session, inactive_user: User, inactive_student: Student):
    activation_service = ActivationService(db)
    _, token = activation_service.create_activation_token(inactive_user)

    success, error = activation_service.activate_account(
        token=token,
        enrollment_no="DB2345678",
        dob=date(2000, 1, 1),  # Wrong DOB
        new_password="newpassword123",
        accepted_terms=True,
    )

    assert success is False
    assert error == "Invalid or expired activation link, or details do not match"


def test_activate_account_expired_token(
    db: Session, inactive_user: User, inactive_student: Student
):
    activation_service = ActivationService(db)
    prt, token = activation_service.create_activation_token(inactive_user)

    # Manually expire the token
    prt.expires_at = prt.expires_at - timedelta(days=10)
    db.commit()

    success, error = activation_service.activate_account(
        token=token,
        enrollment_no="DB2345678",
        dob=date(2001, 1, 20),
        new_password="newpassword123",
        accepted_terms=True,
    )

    assert success is False
    assert error == "Invalid or expired activation link, or details do not match"


def test_activate_account_already_used_token(
    db: Session, inactive_user: User, inactive_student: Student
):
    activation_service = ActivationService(db)
    _, token = activation_service.create_activation_token(inactive_user)

    # Use the token once
    activation_service.activate_account(
        token=token,
        enrollment_no="DB2345678",
        dob=date(2001, 1, 20),
        new_password="newpassword123",
        accepted_terms=True,
    )

    # Try to use again
    success, error = activation_service.activate_account(
        token=token,
        enrollment_no="DB2345678",
        dob=date(2001, 1, 20),
        new_password="anotherpassword",
        accepted_terms=True,
    )

    assert success is False
    assert error == "Invalid or expired activation link, or details do not match"
