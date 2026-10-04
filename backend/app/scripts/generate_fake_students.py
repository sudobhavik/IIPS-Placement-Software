"""CLI script for generating fake student data for testing."""

import argparse
import random
from datetime import date
from pathlib import Path

import openpyxl
from faker import Faker


def generate_fake_data(count: int, seed: int) -> list:
    """Generate fake student data with deliberate dirty rows."""
    fake = Faker()
    Faker.seed(seed)
    random.seed(seed)

    # Valid courses
    courses = ["MCA", "MTECH IT", "MTech IT", "MCA ", " mca"]

    # Valid genders
    genders = ["Male", "Female", "Other", "Prefer not to say", "male", "FEMALE"]

    # Roll number patterns
    branches = ["IC", "IT", "CS", "EC", "EE", "ME", "CE"]

    data = []
    used_enrollments = set()
    used_roll_nos = set()
    used_emails = set()

    for i in range(count):
        # 85% valid, 15% dirty
        is_dirty = random.random() < 0.15

        # Enrollment number
        while True:
            enrollment = (
                f"D{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1000000, 9999999)}"
            )
            if enrollment not in used_enrollments:
                used_enrollments.add(enrollment)
                break
        if is_dirty and random.random() < 0.3:
            enrollment = enrollment.lower() + " "  # dirty: lowercase + space

        # Roll number
        while True:
            roll_no = (
            f"{random.choice(branches)}-2K{random.randint(20, 24):02d}-"
            f"{random.randint(1, 99):02d}"
        )
            if roll_no not in used_roll_nos:
                used_roll_nos.add(roll_no)
                break
        if is_dirty and random.random() < 0.3:
            roll_no = roll_no.replace("-", "")  # dirty: no hyphens

        # Email
        while True:
            email = f"{fake.user_name()}{random.randint(1, 999)}@gmail.com"
            if email not in used_emails:
                used_emails.add(email)
                break
        if is_dirty and random.random() < 0.2:
            email = "invalid-email"  # dirty: invalid format

        # Name
        name = fake.name()
        if is_dirty and random.random() < 0.2:
            name = "  " + name + "  "  # dirty: leading/trailing spaces

        # Gender
        gender = random.choice(genders)

        # DOB - 85% valid format, 15% Excel datetime or invalid
        if is_dirty and random.random() < 0.3:
            # Excel datetime (serial number)
            dob_serial = random.randint(36526, 40178)  # roughly 2000-2010
            dob = dob_serial
        elif is_dirty and random.random() < 0.2:
            dob = "2000-13-45"  # invalid format
        else:
            start_date = date(1998, 1, 1)
            end_date = date(2005, 12, 31)
            dob = fake.date_between(start_date=start_date, end_date=end_date).strftime("%d/%m/%Y")

        # Phone numbers
        personal_phone = f"{random.randint(6, 9)}{random.randint(100000000, 999999999)}"
        guardian_phone = f"{random.randint(6, 9)}{random.randint(100000000, 999999999)}"
        if is_dirty and random.random() < 0.3:
            personal_phone = "12345"  # invalid
        if is_dirty and random.random() < 0.2:
            guardian_phone = "999"  # invalid

        # Course
        course = random.choice(courses)

        # Scores - mix of percentages and CGPA
        if random.random() < 0.3:
            # CGPA style (<=10)
            tenth = round(random.uniform(5.0, 10.0), 1)
            twelfth = round(random.uniform(5.0, 10.0), 1)
            ug_cgpa = round(random.uniform(5.0, 10.0), 1) if random.random() > 0.3 else None
            current_cgpa = round(random.uniform(5.0, 10.0), 1)
        else:
            # Percentage style
            tenth = round(random.uniform(50.0, 99.0), 1)
            twelfth = round(random.uniform(50.0, 99.0), 1)
            ug_cgpa = round(random.uniform(50.0, 99.0), 1) if random.random() > 0.3 else None
            current_cgpa = round(random.uniform(50.0, 99.0), 1)

        if is_dirty and random.random() < 0.2:
            tenth = 105.0  # out of range

        # Backlogs
        backlogs = random.randint(0, 3)
        if is_dirty and random.random() < 0.2:
            backlogs = -1  # invalid

        # Fake credentials (should never be imported)
        username = fake.user_name()
        password = fake.password(length=12)

        # Flags
        is_placed = random.random() < 0.1
        is_debarred = random.random() < 0.05

        # Address and other fields (will be dropped)
        father = fake.name_male()
        mother = fake.name_female()
        caste = random.choice(["General", "OBC", "SC", "ST"])
        home_address = fake.address()

        data.append(
            {
                "email": email,
                "fullname": name,
                "enrollment_no": enrollment,
                "father": father,
                "mother": mother,
                "gender": gender,
                "caste": caste,
                "dob": dob,
                "personal_no": personal_phone,
                "guardian_no": guardian_phone,
                "home_address": home_address,
                "course": course,
                "10th_percent": tenth,
                "12th_percent": twelfth,
                "ug_cgpa": ug_cgpa,
                "current_cgpa": current_cgpa,
                "backlogs": backlogs,
                "roll_no": roll_no,
                "username": username,
                "password": password,
                "is_placed": is_placed,
                "is_debarred": is_debarred,
            }
        )

    return data


def write_excel(data: list, output_path: Path):
    """Write data to Excel file."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Complete Data"

    headers = [
        "email",
        "fullname",
        "enrollment_no",
        "father",
        "mother",
        "gender",
        "caste",
        "dob",
        "personal_no",
        "guardian_no",
        "home_address",
        "course",
        "10th_percent",
        "12th_percent",
        "ug_cgpa",
        "current_cgpa",
        "backlogs",
        "roll_no",
        "username",
        "password",
        "is_placed",
        "is_debarred",
    ]
    ws.append(headers)

    for row in data:
        ws.append([row[h] for h in headers])

    wb.save(output_path)
    print(f"Generated {len(data)} rows to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate fake student data for testing")
    parser.add_argument("--count", type=int, default=150, help="Number of rows to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--out", default="data/fake_students.xlsx", help="Output file path")
    args = parser.parse_args()

    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    data = generate_fake_data(args.count, args.seed)
    write_excel(data, output_path)


if __name__ == "__main__":
    main()
