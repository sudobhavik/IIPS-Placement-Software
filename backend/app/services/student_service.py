from datetime import datetime, timezone

from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models.student import Student, StudentAcademic
from app.models.user import User


def get_student_by_user_id(db: Session, user_id: int) -> Student | None:
    return (
        db.query(Student)
        .options(
            joinedload(Student.user),
            joinedload(Student.course),
            joinedload(Student.batch),
        )
        .filter(Student.user_id == user_id)
        .first()
    )


def update_student_profile(db: Session, student: Student, data: dict) -> Student:
    for k, v in data.items():
        setattr(student, k, v)
    db.commit()
    db.refresh(student)
    return student


def get_student_academics(db: Session, student_id: int) -> list[StudentAcademic]:
    return (
        db.query(StudentAcademic).filter(StudentAcademic.student_id == student_id).all()
    )


def get_student_academic(
    db: Session, academic_id: int, student_id: int
) -> StudentAcademic | None:
    return (
        db.query(StudentAcademic)
        .filter(
            StudentAcademic.id == academic_id, StudentAcademic.student_id == student_id
        )
        .first()
    )


def create_student_academic(
    db: Session, student_id: int, data: dict
) -> StudentAcademic:
    academic = StudentAcademic(student_id=student_id, **data)
    db.add(academic)
    db.commit()
    db.refresh(academic)
    return academic


def update_student_academic(
    db: Session, academic: StudentAcademic, data: dict
) -> StudentAcademic:
    for k, v in data.items():
        setattr(academic, k, v)
    db.commit()
    db.refresh(academic)
    return academic


def delete_student_academic(db: Session, academic: StudentAcademic) -> None:
    db.delete(academic)
    db.commit()


def list_students(
    db: Session,
    page: int,
    page_size: int,
    batch_id: int | None = None,
    course_id: int | None = None,
    verification_status: str | None = None,
    min_cgpa: float | None = None,
    placement_opt_in: bool | None = None,
    search: str | None = None,
) -> tuple[list[Student], int]:
    query = db.query(Student).join(User, Student.user_id == User.id)
    if batch_id is not None:
        query = query.filter(Student.batch_id == batch_id)
    if course_id is not None:
        query = query.filter(Student.course_id == course_id)
    if verification_status is not None:
        query = query.filter(Student.verification_status == verification_status)
    if min_cgpa is not None:
        query = query.filter(Student.current_percentage >= min_cgpa)
    if placement_opt_in is not None:
        query = query.filter(Student.placement_opt_in == placement_opt_in)
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%")
            | Student.enrollment_no.ilike(f"%{search}%")
        )

    total = query.count()
    items = (
        query.options(
            contains_eager(Student.user),
            joinedload(Student.course),
            joinedload(Student.batch),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_student_by_id(db: Session, student_id: int) -> Student | None:
    return (
        db.query(Student)
        .options(
            joinedload(Student.user),
            joinedload(Student.course),
            joinedload(Student.batch),
        )
        .filter(Student.id == student_id)
        .first()
    )


def verify_student(
    db: Session,
    student: Student,
    verification_status: str,
    remarks: str | None,
    admin_user_id: int,
) -> Student:
    student.verification_status = verification_status
    student.verification_remarks = remarks
    student.verified_by_id = admin_user_id
    student.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(student)
    return student
