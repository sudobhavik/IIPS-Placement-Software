import pytest
from app.api.v1.auth import get_current_user
from app.main import app
from app.models.enums import UserRole
from app.models.user import User

PREFIX = "/api/v1/users"


def _create_user(db, email, full_name, role, is_active=True, phone=None):
    user = User(
        email=email,
        full_name=full_name,
        role=role,
        is_active=is_active,
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_get_me(client, db):
    student = _create_user(db, "student@test.com", "Student User", UserRole.STUDENT)
    app.dependency_overrides[get_current_user] = lambda: student

    resp = client.get(f"{PREFIX}/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == student.id
    assert data["email"] == "student@test.com"
    assert data["full_name"] == "Student User"
    assert data["role"] == "student"
    assert data["is_active"] is True


def test_update_me(client, db):
    student = _create_user(db, "student2@test.com", "Old Name", UserRole.STUDENT)
    app.dependency_overrides[get_current_user] = lambda: student

    resp = client.patch(
        f"{PREFIX}/me", json={"full_name": "New Name", "phone": "1234567890"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "New Name"
    assert data["phone"] == "1234567890"

    db.refresh(student)
    assert student.full_name == "New Name"
    assert student.phone == "1234567890"


def test_list_users_as_admin(client, db):
    admin = _create_user(db, "admin@test.com", "Admin User", UserRole.ADMIN)
    student1 = _create_user(db, "stu1@test.com", "Student One", UserRole.STUDENT)
    student2 = _create_user(db, "stu2@test.com", "Student Two", UserRole.STUDENT)

    app.dependency_overrides[get_current_user] = lambda: admin

    resp = client.get(f"{PREFIX}?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 3
    assert len(data["items"]) >= 3


def test_list_users_filters(client, db):
    admin = _create_user(db, "admin2@test.com", "Admin Two", UserRole.ADMIN)
    _create_user(db, "active_stu@test.com", "Active Student", UserRole.STUDENT, is_active=True)
    _create_user(db, "inactive_stu@test.com", "Inactive Student", UserRole.STUDENT, is_active=False)

    app.dependency_overrides[get_current_user] = lambda: admin

    # Filter by role
    resp = client.get(f"{PREFIX}?role=student")
    assert resp.status_code == 200
    data = resp.json()
    assert all(item["role"] == "student" for item in data["items"])

    # Filter by is_active
    resp = client.get(f"{PREFIX}?is_active=false")
    assert resp.status_code == 200
    data = resp.json()
    assert all(item["is_active"] is False for item in data["items"])

    # Search filter
    resp = client.get(f"{PREFIX}?search=Inactive")
    assert resp.status_code == 200
    data = resp.json()
    assert any(item["email"] == "inactive_stu@test.com" for item in data["items"])


def test_list_users_forbidden_for_student(client, db):
    student = _create_user(db, "student3@test.com", "Student Three", UserRole.STUDENT)
    app.dependency_overrides[get_current_user] = lambda: student

    resp = client.get(PREFIX)
    assert resp.status_code == 403


def test_get_user_by_id_success(client, db):
    admin = _create_user(db, "admin3@test.com", "Admin Three", UserRole.ADMIN)
    target = _create_user(db, "target@test.com", "Target User", UserRole.STUDENT)

    app.dependency_overrides[get_current_user] = lambda: admin

    resp = client.get(f"{PREFIX}/{target.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == target.id
    assert data["email"] == "target@test.com"


def test_get_user_by_id_not_found(client, db):
    admin = _create_user(db, "admin4@test.com", "Admin Four", UserRole.ADMIN)
    app.dependency_overrides[get_current_user] = lambda: admin

    resp = client.get(f"{PREFIX}/99999")
    assert resp.status_code == 404


def test_get_user_by_id_forbidden_for_student(client, db):
    student = _create_user(db, "student4@test.com", "Student Four", UserRole.STUDENT)
    target = _create_user(db, "target2@test.com", "Target Two", UserRole.STUDENT)

    app.dependency_overrides[get_current_user] = lambda: student

    resp = client.get(f"{PREFIX}/{target.id}")
    assert resp.status_code == 403


def test_update_user_as_super_admin(client, db):
    super_admin = _create_user(
        db, "super@test.com", "Super Admin", UserRole.SUPER_ADMIN
    )
    target = _create_user(db, "target3@test.com", "Target Three", UserRole.STUDENT)

    app.dependency_overrides[get_current_user] = lambda: super_admin

    resp = client.patch(
        f"{PREFIX}/{target.id}", json={"is_active": False, "role": "admin"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_active"] is False
    assert data["role"] == "admin"

    db.refresh(target)
    assert target.is_active is False
    assert target.role == "admin"


def test_update_user_forbidden_for_regular_admin(client, db):
    regular_admin = _create_user(db, "admin5@test.com", "Admin Five", UserRole.ADMIN)
    target = _create_user(db, "target4@test.com", "Target Four", UserRole.STUDENT)

    app.dependency_overrides[get_current_user] = lambda: regular_admin

    resp = client.patch(f"{PREFIX}/{target.id}", json={"is_active": False})
    assert resp.status_code == 403


def test_update_user_self_modification_prevented(client, db):
    super_admin = _create_user(
        db, "super2@test.com", "Super Admin 2", UserRole.SUPER_ADMIN
    )
    app.dependency_overrides[get_current_user] = lambda: super_admin

    resp = client.patch(
        f"{PREFIX}/{super_admin.id}", json={"role": "admin"}
    )
    assert resp.status_code == 400
    assert "Cannot change your own role" in resp.json()["detail"]


def test_update_user_not_found(client, db):
    super_admin = _create_user(
        db, "super3@test.com", "Super Admin 3", UserRole.SUPER_ADMIN
    )
    app.dependency_overrides[get_current_user] = lambda: super_admin

    resp = client.patch(f"{PREFIX}/99999", json={"is_active": False})
    assert resp.status_code == 404
