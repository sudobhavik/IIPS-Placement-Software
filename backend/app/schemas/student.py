from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AcademicLevel, Gender, VerificationStatus


# ── Nested read schemas (minimal, for eager-loaded relationships) ────────


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    phone: str | None


class CourseBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    level: str


class BatchBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    passing_year: int


# ── Student ──────────────────────────────────────────────────────────────


class StudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    enrollment_no: str
    course_id: int
    specialization_id: int | None
    batch_id: int
    current_semester: int | None
    cgpa: float | None
    active_backlogs: int
    gap_years: int
    gender: str | None
    date_of_birth: date | None
    city: str | None
    state: str | None
    linkedin_url: str | None
    github_url: str | None
    portfolio_url: str | None
    placement_opt_in: bool
    verification_status: str
    verified_by_id: int | None
    verified_at: datetime | None
    verification_remarks: str | None
    profile_completeness: int
    created_at: datetime
    updated_at: datetime
    user: UserBrief
    course: CourseBrief
    batch: BatchBrief


class StudentUpdate(BaseModel):
    gender: Gender | None = None
    date_of_birth: date | None = None
    city: str | None = None
    state: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    placement_opt_in: bool | None = None


# ── StudentAcademic ──────────────────────────────────────────────────────


class StudentAcademicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    level: str
    institution: str | None
    stream: str | None
    year_of_passing: int | None
    percentage: float | None
    cgpa: float | None
    created_at: datetime
    updated_at: datetime


class StudentAcademicCreate(BaseModel):
    level: AcademicLevel
    institution: str | None = None
    stream: str | None = None
    year_of_passing: int | None = None
    percentage: float | None = None
    cgpa: float | None = None


class StudentAcademicUpdate(BaseModel):
    level: AcademicLevel
    institution: str | None = None
    stream: str | None = None
    year_of_passing: int | None = None
    percentage: float | None = None
    cgpa: float | None = None


# ── Verify ───────────────────────────────────────────────────────────────


class StudentVerifyRequest(BaseModel):
    verification_status: VerificationStatus
    remarks: str | None = None


# ── Paginated list ───────────────────────────────────────────────────────


class StudentListResponse(BaseModel):
    items: list[StudentRead]
    total: int
    page: int
    page_size: int
