import hashlib
import logging
import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi import File as FastAPIFile
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.file import File
from app.models.import_job import ImportJob, ImportJobError
from app.models.user import User
from app.schemas.imports import ImportJobErrorRead, ImportJobRead, StudentImportReport
from app.services.import_service import StudentImportService

router = APIRouter(prefix="/import", tags=["import"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}
MAX_FILE_SIZE = 10 * 1024 * 1024


def get_current_admin_user(
    db: Session = Depends(get_db),
) -> User:
    from app.api.v1.auth import get_current_user

    return get_current_user(db)


@router.post("/students", response_model=StudentImportReport, status_code=status.HTTP_201_CREATED)
async def import_students(
    upload_file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    if upload_file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only .xlsx and .xls files are allowed.",
        )

    content = await upload_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        file_record = File(
            storage_key=f"imports/{current_user.id}/{upload_file.filename}",
            original_name=upload_file.filename,
            mime_type=upload_file.content_type,
            size_bytes=len(content),
            sha256=hashlib.sha256(content).hexdigest(),
            uploaded_by_id=current_user.id,
        )
        db.add(file_record)
        db.flush()

        job = ImportJob(
            kind="students",
            file_id=file_record.id,
            status="running",
            total_rows=0,
            success_rows=0,
            failed_rows=0,
            started_by_id=current_user.id,
        )
        db.add(job)
        db.commit()

        service = StudentImportService(db, job, current_user.id)
        result = service.run(tmp_path)

        return StudentImportReport(
            total_rows=result["total_rows"],
            imported_rows=result["imported_rows"],
            failed_rows=result["failed_rows"],
            warnings=result["warnings"],
            placed_flag_ignored=result["placed_flag_ignored"],
            errors=[
                ImportJobErrorRead(
                    id=e.id,
                    job_id=e.job_id,
                    row_number=e.row_number,
                    column_name=e.column_name,
                    message=e.message,
                    raw_row=e.raw_row,
                    created_at=e.created_at,
                )
                for e in result["errors"]
            ],
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.get("/jobs/{job_id}", response_model=ImportJobRead)
def get_import_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job


@router.get("/jobs/{job_id}/errors", response_model=list[ImportJobErrorRead])
def get_import_job_errors(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    errors = db.query(ImportJobError).filter(ImportJobError.job_id == job_id).all()
    return errors
