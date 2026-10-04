"""CLI script for seeding master data (courses)."""

import argparse

from sqlalchemy import create_engine, select 
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import Base
from app.models.master import Course


def main():
    parser = argparse.ArgumentParser(description="Seed master data (courses)")
    parser.add_argument("--force", action="store_true", help="Force re-seed even if courses exist")
    args = parser.parse_args()

    engine = create_engine(settings.database_url, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        courses = [
            ("MCA", "Master of Computer Applications", "PG", 2),
            ("MTECH_IT", "M.Tech IT", "PG", 2),
        ]
        for code, name, level, duration in courses:
            existing = db.execute(
                select(Course).where(Course.code == code)
            ).scalar_one_or_none()
            if existing:
                if args.force:
                    db.delete(existing)
                    db.flush()
                else:
                    print(f"Course {code} already exists, skipping (use --force to overwrite)")
                    continue
            course = Course(
                code=code, name=name, level=level, duration_years=duration, is_active=True
            )
            db.add(course)
            print(f"Created course: {code} - {name}")

        db.commit()
        print("Master data seeded successfully!")


if __name__ == "__main__":
    main()
