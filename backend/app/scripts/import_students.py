"""CLI script for importing students from Excel file."""
import argparse, hashlib, sys
from pathlib import Path
from sqlalchemy import select
from app.core.db import SessionLocal
from app.models.file import File
from app.models.import_job import ImportJob
from app.models.master import Batch
from app.models.user import User
from app.services.import_service import StudentImportService

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def main():
    p = argparse.ArgumentParser(description="Import students from Excel")
    p.add_argument("--file", required=True)
    p.add_argument("--batch-label", required=True)
    p.add_argument("--passing-year", type=int, required=True)
    p.add_argument("--admin-email", required=True)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--current-semester", type=int, default=7)
    args = p.parse_args()
    fp = Path(args.file)
    if not fp.exists():
        sys.exit(f"Error: file not found: {fp}")
    db = SessionLocal()
    try:
        admin = db.execute(select(User).where(User.email == args.admin_email)).scalar_one_or_none()
        if not admin:
            sys.exit(f"Error: admin '{args.admin_email}' not found. Run create_superuser.py first.")
        batch = db.execute(select(Batch).where(Batch.label == args.batch_label)).scalar_one_or_none()
        if not batch:
            batch = Batch(label=args.batch_label, passing_year=args.passing_year, is_active=True)
            db.add(batch); db.flush()
        content = fp.read_bytes()
        sha = hashlib.sha256(content).hexdigest()
        file_rec = db.execute(select(File).where(File.sha256 == sha)).scalar_one_or_none()
        if not file_rec:
            file_rec = File(storage_key=f"imports/{fp.name}", original_name=fp.name,
                            mime_type=XLSX_MIME, size_bytes=len(content),
                            sha256=sha, uploaded_by_id=admin.id)
            db.add(file_rec); db.flush()
        job = ImportJob(kind="students", file_id=file_rec.id, status="running",
                        total_rows=0, success_rows=0, failed_rows=0, started_by_id=admin.id)
        db.add(job); db.flush()
        svc = StudentImportService(db=db, job=job, current_user_id=admin.id,
                                   batch_label=args.batch_label, passing_year=args.passing_year,
                                   current_semester=args.current_semester, dry_run=args.dry_run)
        try:
            result = svc.run(str(fp))
        except Exception as exc:
            job.status = "failed"; db.commit()
            sys.exit(f"Import failed: {exc}")
        for k in ("total_rows", "imported_rows", "failed_rows", "warnings", "placed_flag_ignored"):
            print(f"{k}: {result[k]}")
        print(f"skipped_existing: {result.get('skipped_existing', 0)}")
        for err in result["errors"]:
            print(f"  Row {err.row_number} [{err.column_name}]: {err.message}")
        if args.dry_run:
            db.rollback(); print("\nDry run — no data persisted.")
        else:
            db.commit(); print("\nImport completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
