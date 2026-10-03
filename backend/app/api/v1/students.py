from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import require_role
from app.models.enums import UserRole, VerificationStatus
from app.models.student import Student, StudentAcademic
from app.models.user import User
from app.schemas.student import (
    StudentAcademicCreate,
    StudentAcademicRead,
    StudentAcademicUpdate,
    StudentListResponse,
    StudentRead,
    StudentUpdate,
    StudentVerifyRequest,
)
from app.services import student_service

router = APIRouter(prefix="/students", tags=["students"])

# ── Dependencies ─────────────────────────────────────────────────────────

DbSession = Annotated[Session, Depends(get_db)]


def get_current_student(
    db: DbSession,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
) -> Student:
    student = student_service.get_student_by_user_id(db, current_user.id)
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student profile not found")
    return student


CurrentStudent = Annotated[Student, Depends(get_current_student)]


def get_unlocked_student(student: CurrentStudent) -> Student:
    if student.verification_status == VerificationStatus.VERIFIED:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Profile is verified and locked for editing"
        )
    return student


UnlockedStudent = Annotated[Student, Depends(get_unlocked_student)]


def get_academic_or_404(
    academic_id: int,
    db: DbSession,
    student: UnlockedStudent,
) -> StudentAcademic:
    academic = student_service.get_student_academic(db, academic_id, student.id)
    if not academic:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Academic record not found")
    return academic


AcademicRecord = Annotated[StudentAcademic, Depends(get_academic_or_404)]


def get_target_student(id: int, db: DbSession) -> Student:
    student = student_service.get_student_by_id(db, id)
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found")
    return student


TargetStudent = Annotated[Student, Depends(get_target_student)]
AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN))]

# ── /me routes (Student role) ────────────────────────────────────────────


@router.get("/me", response_model=StudentRead)
def get_my_profile(student: CurrentStudent):
    return student


@router.patch("/me", response_model=StudentRead)
def update_my_profile(data: StudentUpdate, db: DbSession, student: UnlockedStudent):
    if updates := data.model_dump(exclude_unset=True):
        student = student_service.update_student_profile(db, student, updates)
    return student


@router.get("/me/academics", response_model=list[StudentAcademicRead])
def get_my_academics(db: DbSession, student: CurrentStudent):
    return student_service.get_student_academics(db, student.id)


@router.post(
    "/me/academics",
    response_model=StudentAcademicRead,
    status_code=status.HTTP_201_CREATED,
)
def create_my_academic(
    data: StudentAcademicCreate, db: DbSession, student: UnlockedStudent
):
    return student_service.create_student_academic(db, student.id, data.model_dump())


@router.put("/me/academics/{academic_id}", response_model=StudentAcademicRead)
def update_my_academic(
    data: StudentAcademicUpdate, db: DbSession, academic: AcademicRecord
):
    return student_service.update_student_academic(db, academic, data.model_dump())


@router.delete("/me/academics/{academic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_academic(db: DbSession, academic: AcademicRecord):
    student_service.delete_student_academic(db, academic)


# ── Admin / Super-Admin routes ───────────────────────────────────────────


@router.get("", response_model=StudentListResponse)
def list_students(
    db: DbSession,
    _: AdminUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    batch_id: int | None = None,
    course_id: int | None = None,
    verification_status: VerificationStatus | None = None,
    min_cgpa: float | None = Query(None, ge=0, le=10),
    placement_opt_in: bool | None = None,
    search: str | None = None,
):
    items, total = student_service.list_students(
        db,
        page=page,
        page_size=page_size,
        batch_id=batch_id,
        course_id=course_id,
        verification_status=verification_status,
        min_cgpa=min_cgpa,
        placement_opt_in=placement_opt_in,
        search=search,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{id}", response_model=StudentRead)
def get_student(_: AdminUser, student: TargetStudent):
    return student


@router.get("/{id}/academics", response_model=list[StudentAcademicRead])
def get_student_academics(db: DbSession, _: AdminUser, student: TargetStudent):
    return student_service.get_student_academics(db, student.id)


@router.patch("/{id}/verify", response_model=StudentRead)
def verify_student(
    data: StudentVerifyRequest,
    db: DbSession,
    admin: AdminUser,
    student: TargetStudent,
):
    return student_service.verify_student(
        db,
        student,
        verification_status=data.verification_status,
        remarks=data.remarks,
        admin_user_id=admin.id,
    )
