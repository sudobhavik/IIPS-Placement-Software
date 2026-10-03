import openpyxl

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

# Valid student 1
ws.append(
    [
        "student1@gmail.com",
        "John Doe",
        "DA1234567",
        "Father1",
        "Mother1",
        "Male",
        "General",
        "15/08/2000",
        "9876543210",
        "9876543211",
        "Address 1",
        "MCA",
        85.5,
        88.0,
        7.5,
        8.2,
        0,
        "IC-2K22-01",
        "user1",
        "pass1",
        False,
        False,
    ]
)

# Valid student 2 - MTECH_IT with blank UG CGPA
ws.append(
    [
        "student2@gmail.com",
        "Jane Smith",
        "DB2345678",
        "Father2",
        "Mother2",
        "Female",
        "OBC",
        "20/01/2001",
        "8765432109",
        "8765432108",
        "Address 2",
        "MTECH IT",
        90.0,
        92.5,
        None,
        8.5,
        0,
        "IT-2K22-02",
        "user2",
        "pass2",
        True,
        False,
    ]
)

# Valid student 3 - with backlogs
ws.append(
    [
        "student3@gmail.com",
        "Bob Wilson",
        "DC3456789",
        "Father3",
        "Mother3",
        "Male",
        "SC",
        "10/05/2002",
        "7654321098",
        "7654321097",
        "Address 3",
        "MCA",
        75.0,
        78.0,
        6.8,
        7.0,
        2,
        "CS-2K22-03",
        "user3",
        "pass3",
        False,
        True,
    ]
)

# Invalid enrollment number
ws.append(
    [
        "student4@gmail.com",
        "Alice Brown",
        "INVALID123",
        "Father4",
        "Mother4",
        "Female",
        "General",
        "12/12/2000",
        "6543210987",
        "6543210986",
        "Address 4",
        "MCA",
        80.0,
        82.0,
        7.0,
        7.5,
        0,
        "EC-2K22-04",
        "user4",
        "pass4",
        False,
        False,
    ]
)

# Invalid email
ws.append(
    [
        "invalid-email",
        "Charlie Davis",
        "DD4567890",
        "Father5",
        "Mother5",
        "Male",
        "ST",
        "01/01/2001",
        "5432109876",
        "5432109875",
        "Address 5",
        "MCA",
        88.0,
        90.0,
        8.0,
        8.5,
        1,
        "EE-2K22-05",
        "user5",
        "pass5",
        False,
        False,
    ]
)

# Invalid phone
ws.append(
    [
        "student6@gmail.com",
        "Eve Miller",
        "DE5678901",
        "Father6",
        "Mother6",
        "Female",
        "General",
        "15/03/2002",
        "12345",
        "5432109874",
        "Address 6",
        "MTECH IT",
        92.0,
        94.0,
        None,
        9.0,
        0,
        "ME-2K22-06",
        "user6",
        "pass6",
        False,
        False,
    ]
)

# Invalid DOB format
ws.append(
    [
        "student7@gmail.com",
        "Frank Garcia",
        "DF6789012",
        "Father7",
        "Mother7",
        "Male",
        "OBC",
        "2003-04-10",
        "4321098765",
        "4321098764",
        "Address 7",
        "MCA",
        70.0,
        72.0,
        6.5,
        6.8,
        0,
        "CE-2K22-07",
        "user7",
        "pass7",
        False,
        False,
    ]
)

# Age out of range (too young)
ws.append(
    [
        "student8@gmail.com",
        "Grace Lee",
        "DG7890123",
        "Father8",
        "Mother8",
        "Female",
        "SC",
        "01/01/2015",
        "3210987654",
        "3210987653",
        "Address 8",
        "MCA",
        85.0,
        87.0,
        7.8,
        8.0,
        0,
        "IC-2K22-08",
        "user8",
        "pass8",
        False,
        False,
    ]
)

# Score <= 10 (CGPA that should be multiplied)
ws.append(
    [
        "student9@gmail.com",
        "Henry Clark",
        "DH8901234",
        "Father9",
        "Mother9",
        "Male",
        "General",
        "10/10/2000",
        "2109876543",
        "2109876542",
        "Address 9",
        "MCA",
        9.5,
        9.0,
        8.0,
        8.5,
        0,
        "IT-2K22-09",
        "user9",
        "pass9",
        False,
        False,
    ]
)

# Duplicate enrollment (same as student1)
ws.append(
    [
        "student10@gmail.com",
        "Iris Lewis",
        "DA1234567",
        "Father10",
        "Mother10",
        "Female",
        "OBC",
        "20/08/2001",
        "1098765432",
        "1098765431",
        "Address 10",
        "MCA",
        88.0,
        90.0,
        7.5,
        8.0,
        0,
        "CS-2K22-10",
        "user10",
        "pass10",
        False,
        False,
    ]
)

wb.save("tests/fixtures/test_import.xlsx")
print("Test fixture created")
