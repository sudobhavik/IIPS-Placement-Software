"""CLI script for importing students from Excel file."""

import argparse
import hashlib
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import Base
from app.models.file import File
from app.models.import_job import ImportJob
from app.models.master import Batch, Course
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.import_service import StudentImportService


def get_or_create_admin(db: Session, email: str) -> User:
    """Get or create an admin user for the import."""
    admin = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not admin:
        admin = User(
            email=email,
            full_name="Admin User",
            phone="9876543210",
            password_hash=hash_password("admin123"),
            role="admin",
            is_active=True,
            must_change_password=False,
        )
        db.add(admin)
        db.commit()
    return admin


def get_or_create_batch(db: Session, label: str, passing_year: int) -> Batch:
    """Get or create a batch."""
    batch = db.execute(select(Batch).where(Batch.label == label)).scalar_one_or_none()
    if not batch:
        batch = Batch(label=label, passing_year=passing_year, is_active=True)
        db.add(batch)
        db.commit()
    return batch


def seed_master_data(db: Session) -> None:
    """Create master data (courses) if not exists."""
    courses = [
        ("MCA", "Master of Computer Applications", "PG", 2),
        ("MTECH_IT", "M.Tech IT", "PG", 2),
    ]
    for code, name, level, duration in courses:
        existing = db.execute(select(Course).where(Course.code == code)).scalar_one_or_none()
        if not existing:
            course = Course(
                code=code, name=name, level=level, duration_years=duration, is_active=True
            )
            db.add(course)
    db.commit()


def main():
    parser = argparse.ArgumentParser(description="Import students from Excel file")
    parser.add_argument("--file", required=True, help="Path to Excel file")
    parser.add_argument("--batch-label", required=True, help="Batch label (e.g., 2024-26)")
    parser.add_argument("--passing-year", type=int, required=True, help="Passing year")
    parser.add_argument("--admin-email", required=True, help="Admin email for audit")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, don't persist")
    parser.add_argument("--current-semester", type=int, default=7, help="Current semester")

    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    # Create engine and session
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        # Seed master data
        seed_master_data(db)

        # Get admin user
        admin = get_or_create_admin(db, args.admin_email)

        # Get or create batch
        _ = get_or_create_batch(db, args.batch_label, args.passing_year)

        # Create file record (check if already exists)
        storage_key = f"imports/{args.admin_email}/{file_path.name}"
        file_record = db.execute(
            select(File).where(File.storage_key == storage_key)
        ).scalar_one_or_none()
        if not file_record:
            with open(file_path, "rb") as f:
                content = f.read()
            file_record = File(
                storage_key=storage_key,
                original_name=file_path.name,
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size_bytes=len(content),
                sha256=hashlib.sha256(content).hexdigest(),
                uploaded_by_id=admin.id,
            )
            db.add(file_record)
            db.flush()

        # Create import job
        job = ImportJob(
            kind="students",
            file_id=file_record.id,
            status="running",
            total_rows=0,
            success_rows=0,
            failed_rows=0,
            started_by_id=admin.id,
        )
        db.add(job)
        db.commit()

        # Run import
        service = StudentImportService(
            db=db,
            job=job,
            current_user_id=admin.id,
            batch_label=args.batch_label,
            passing_year=args.passing_year,
            current_semester=args.current_semester,
            dry_run=args.dry_run,
        )

        try:
            result = service.run(str(file_path))
        except Exception as e:
            job.status = "failed"
            db.commit()
            print(f"Import failed: {e}", file=sys.stderr)
            sys.exit(1)

        # Print results
        print(f"Total rows: {result['total_rows']}")
        print(f"Imported: {result['imported_rows']}")
        print(f"Failed: {result['failed_rows']}")
        print(f"Warnings: {result['warnings']}")
        print(f"Placed flag ignored: {result['placed_flag_ignored']}")
        print(f"Skipped existing: {result.get('skipped_existing', 0)}")

        if result["errors"]:
            print("\nErrors:")
            for err in result["errors"]:
                print(f"  Row {err.row_number} [{err.column_name}]: {err.message}")

        if not args.dry_run:
            print("\nImport completed successfully!")
        else:
            print("\nDry run completed - no data persisted.")


if __name__ == "__main__":
    main()
