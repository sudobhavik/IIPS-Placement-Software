"""CLI script for creating a super admin user."""

import argparse
import getpass
import sys

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import Base
from app.core.security import hash_password, validate_password_strength
from app.models.user import User


def main():
    parser = argparse.ArgumentParser(description="Create a super admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--name", required=True, help="Admin full name")
    parser.add_argument("--phone", default="9876543210", help="Phone number")
    parser.add_argument("--password", help="Password (if not provided, will prompt)")
    args = parser.parse_args()

    if args.password:
        password = args.password
    else:
        # Prompt for password (never as CLI arg)
        while True:
            password = getpass.getpass("Enter password: ")
            confirm = getpass.getpass("Confirm password: ")
            if password != confirm:
                print("Passwords do not match, try again.")
                continue

            # Validate strength (using email as enrollment fallback)
            is_valid, error = validate_password_strength(
                password, email=args.email, enrollment_no="ADMIN"
            )
            if not is_valid:
                print(f"Password too weak: {error}")
                continue
            break

    # Validate strength if provided via CLI
    if args.password:
        is_valid, error = validate_password_strength(
            password, email=args.email, enrollment_no="ADMIN"
        )
        if not is_valid:
            print(f"Password too weak: {error}")
            sys.exit(1)

    engine = create_engine(settings.database_url, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        # Check if user already exists
        existing = db.execute(
            select(User).where(User.email == args.email.lower())
        ).scalar_one_or_none()
        if existing:
            print(f"User with email {args.email} already exists!", file=sys.stderr)
            sys.exit(1)

        user = User(
            email=args.email.lower(),
            full_name=args.name,
            phone=args.phone,
            password_hash=hash_password(password),
            role="super_admin",
            is_active=True,
            must_change_password=False,
        )
        db.add(user)
        db.commit()
        print(f"Super admin created successfully: {args.email}")


if __name__ == "__main__":
    main()