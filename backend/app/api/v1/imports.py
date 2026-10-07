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
from app.api.v1.auth import get_current_admin_user 

router = APIRouter(prefix="/import", tags=["import"])
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
}
MAX_FILE_SIZE = 10 * 1024 * 1024


# backend/app/api/v1/imports.py

# REMOVE these lines (27-33):
# def get_current_admin_user(
#     db: Session = Depends(get_db),
# ) -> User:
#     from app.api.v1.auth import get_current_user
#     return get_current_user(db)

# REPLACE with import at top:
from app.api.v1.auth import get_current_admin_user

# Then the route will use the proper async dependency
@router.post("/students", response_model=StudentImportReport, status_code=status.HTTP_201_CREATED)
async def import_students(
    upload_file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),  # Now properly async
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
        # Check for existing file to avoid duplicate storage_key
        storage_key = f"imports/{current_user.id}/{upload_file.filename}"
        file_record = db.query(File).filter(File.storage_key == storage_key).first()
        
        if not file_record:
            file_record = File(
                storage_key=storage_key,
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


# ============================================================================
# Template Generation Endpoint
# ============================================================================

@router.get("/template/students")
async def download_student_template():
    """Generate and download the student import Excel template.
    
    Returns a properly formatted .xlsx file with:
    - Sheet 'Complete Data': All 28 columns (12 required + 16 optional) matching import_service.py
    - Sheet 'Instructions': Detailed validation rules and format requirements
    - Sheet 'Course Codes': Reference for valid course codes
    - Color-coded headers (yellow=required, green=optional)
    - Sample data row for reference
    """
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.comments import Comment

    wb = openpyxl.Workbook()
    
    # ---------------------------------------------------------------------
    # Sheet 1: Complete Data (Main sheet - REQUIRED by import service)
    # ---------------------------------------------------------------------
    ws = wb.active
    ws.title = "Complete Data"

    # Columns matching StudentImportService.required_headers + optional fields
    columns = [
        # Required columns (matching import_service.py required_headers)
        ("email", "Student email (unique)", True),
        ("fullname", "Full name of student", True),
        ("enrollment_no", "Enrollment number (format: D[A-Z]XXXXXXX)", True),
        ("roll_no", "Roll number (format: BR-2KYY-NN)", True),
        ("course", "Course code (MCA, MTECH_IT, etc.)", True),
        ("10th_percent", "10th percentage (0-100)", True),
        ("12th_percent", "12th percentage (0-100)", True),
        ("ug_cgpa", "UG CGPA (0-10, or percentage if >10)", True),
        ("current_cgpa", "Current CGPA (0-10, or percentage if >10)", True),
        ("backlogs", "Number of active backlogs (integer)", True),
        ("is_placed", "Is placed? (true/false)", True),
        ("is_debarred", "Is debarred? (true/false)", True),
        
        # Optional columns (supported by import_service.py)
        ("gender", "Gender (male/female/other/prefer_not_to_say)", False),
        ("dob", "Date of birth (YYYY-MM-DD)", False),
        ("personal_no", "Personal phone number (10 digits)", False),
        ("guardian_no", "Guardian phone number (10 digits)", False),
        ("father", "Father's name", False),
        ("mother", "Mother's name", False),
        ("caste", "Caste/category", False),
        ("home_address", "Home address (city, state)", False),
        ("city", "City", False),
        ("state", "State", False),
        ("linkedin_url", "LinkedIn profile URL", False),
        ("github_url", "GitHub profile URL", False),
        ("portfolio_url", "Portfolio website URL", False),
        ("placement_opt_in", "Interested in placements? (true/false)", False),
        ("diploma_percent", "Diploma percentage (0-100)", False),
        ("pg_cgpa", "PG CGPA (0-10)", False),
    ]

    # Header styles
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    required_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")  # Yellow
    optional_fill = PatternFill(start_color="F0FDF4", end_color="F0FDF4", fill_type="solid")  # Green

    # Write headers with comments
    for col_idx, (col_name, description, is_required) in enumerate(columns, 1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(wrap_text=True)
        cell.comment = Comment(f"{'REQUIRED' if is_required else 'OPTIONAL'}: {description}", "System")

    # Row 2: Required/Optional indicator with color coding
    for col_idx, (_, _, is_required) in enumerate(columns, 1):
        cell = ws.cell(row=2, column=col_idx)
        cell.fill = required_fill if is_required else optional_fill
        cell.value = "REQUIRED" if is_required else "OPTIONAL"
        cell.font = Font(italic=True, size=9)

    # Row 3: Sample data
    sample_data = [
        "student@example.com", "John Doe", "DX2200123", "BR-2K22-01", "MCA",
        85.5, 88.0, 8.5, 8.7, 0, False, False,
        "male", "2000-05-15", "9876543210", "9876543211",
        "Robert Doe", "Jane Doe", "General", "Mumbai, Maharashtra",
        "Mumbai", "Maharashtra",
        "https://linkedin.com/in/johndoe", "https://github.com/johndoe",
        "https://johndoe.dev", True, None, None,
    ]
    for col_idx, value in enumerate(sample_data, 1):
        ws.cell(row=3, column=col_idx, value=value)

    # Column widths
    for col_idx, (col_name, _, _) in enumerate(columns, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = max(len(col_name) + 5, 18)

    # ---------------------------------------------------------------------
    # Sheet 2: Instructions
    # ---------------------------------------------------------------------
    ws_inst = wb.create_sheet("Instructions")
    instructions = [
        ["STUDENT IMPORT TEMPLATE - INSTRUCTIONS"],
        [""],
        ["SHEET NAMES:"],
        ["1. 'Complete Data' (REQUIRED) - Main student data sheet"],
        ["2. 'Instructions' - This sheet"],
        ["3. 'Course Codes' - Valid course code reference"],
        [""],
        ["COLUMN REQUIREMENTS:"],
        ["Required columns (yellow): Must have values for every row"],
        ["Optional columns (green): Can be left blank"],
        [""],
        ["REQUIRED COLUMNS:"],
        ["email - Valid email, unique across students"],
        ["fullname - Student's full name"],
        ["enrollment_no - Format: D[A-Z]XXXXXXX (e.g., DX2200123)"],
        ["roll_no - Format: BR-2KYY-NN (e.g., BR-2K22-01)"],
        ["course - Must match existing course code (MCA, MTECH_IT)"],
        ["10th_percent - 0 to 100"],
        ["12th_percent - 0 to 100"],
        ["ug_cgpa - 0 to 10 (or percentage if >10, auto-converted)"],
        ["current_cgpa - 0 to 10 (or percentage if >10, auto-converted)"],
        ["backlogs - Non-negative integer"],
        ["is_placed - true or false"],
        ["is_debarred - true or false"],
        [""],
        ["OPTIONAL COLUMNS:"],
        ["gender - male/female/other/prefer_not_to_say"],
        ["dob - YYYY-MM-DD format"],
        ["personal_no, guardian_no - 10 digit phone numbers"],
        ["father, mother - Parent names"],
        ["caste - Category (General, OBC, SC, ST, etc.)"],
        ["home_address - Full address (city, state extracted)"],
        ["city, state - If home_address not provided"],
        ["linkedin_url, github_url, portfolio_url - Valid URLs"],
        ["placement_opt_in - true/false (default: true)"],
        ["diploma_percent - For diploma students (0-100)"],
        ["pg_cgpa - For MTech students (0-10)"],
        [""],
        ["VALIDATION RULES:"],
        ["- Enrollment numbers must be unique"],
        ["- Roll numbers must be unique"],
        ["- Emails must be valid and unique"],
        ["- Course must exist in master data"],
        ["- Duplicate rows (by enrollment_no) are skipped"],
        ["- Percentages: 0-100, CGPA: 0-10"],
        ["- If CGPA > 10, treated as percentage and divided by 10"],
        [""],
        ["NOTES:"],
        ["- Maximum file size: 10MB"],
        ["- Format: .xlsx or .xls"],
        ["- First row MUST contain headers exactly as shown"],
        ["- Sheet name MUST be 'Complete Data'"]
    ]
    for row_idx, row_data in enumerate(instructions, 1):
        ws_inst.cell(row=row_idx, column=1, value=row_data[0])
    ws_inst.column_dimensions['A'].width = 80

    # ---------------------------------------------------------------------
    # Sheet 3: Course Codes Reference
    # ---------------------------------------------------------------------
    ws_courses = wb.create_sheet("Course Codes")
    ws_courses.cell(row=1, column=1, value="Course Code").font = Font(bold=True)
    ws_courses.cell(row=1, column=2, value="Course Name").font = Font(bold=True)
    ws_courses.cell(row=1, column=3, value="Level").font = Font(bold=True)
    
    courses = [
        ["MCA", "Master of Computer Applications", "PG"],
        ["MTECH_IT", "M.Tech IT", "PG"],
    ]
    for row_idx, (code, name, level) in enumerate(courses, 2):
        ws_courses.cell(row=row_idx, column=1, value=code)
        ws_courses.cell(row=row_idx, column=2, value=name)
        ws_courses.cell(row=row_idx, column=3, value=level)
    ws_courses.column_dimensions['A'].width = 20
    ws_courses.column_dimensions['B'].width = 40
    ws_courses.column_dimensions['C'].width = 10

    # Stream response
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_import_template.xlsx"}
    )


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
