from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ImportJobCreate(BaseModel):
    kind: Literal["students"]
    file_id: int


class ImportJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    file_id: int
    status: str
    total_rows: int
    success_rows: int
    failed_rows: int
    started_by_id: int
    finished_at: datetime | None
    created_at: datetime


class ImportJobErrorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    row_number: int
    column_name: str | None
    message: str
    raw_row: dict | None
    created_at: datetime


class StudentImportRow(BaseModel):
    email: str
    full_name: str
    enrollment_no: str
    gender: str | None = None
    dob: str | None = None
    personal_no: str | None = None
    guardian_no: str | None = None
    course: str
    tenth_percent: float | None = None
    twelfth_percent: float | None = None
    ug_cgpa: float | None = None
    current_cgpa: float | None = None
    backlogs: int | None = None
    roll_no: str | None = None
    is_debarred: bool = False


class StudentImportReport(BaseModel):
    total_rows: int
    imported_rows: int
    failed_rows: int
    warnings: int
    placed_flag_ignored: int
    errors: list[ImportJobErrorRead]
