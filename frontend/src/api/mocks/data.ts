// frontend/src/api/mocks/data.ts
import type {
  StudentRead,
  StudentAcademicRead,
  CourseBrief,
  BatchBrief,
  UserBrief,
  ImportJobRead,
  ImportJobErrorRead,
  VerificationStatus,
  AcademicLevel,
  UserRole,
} from "../types";

// ============================================================================
// Mock Master Data
// ============================================================================

export const mockCourses: CourseBrief[] = [
  { id: 1, code: "MCA", name: "Master of Computer Applications", level: "PG" },
  { id: 2, code: "MTECH_IT", name: "M.Tech Information Technology", level: "PG" },
  { id: 3, code: "BTECH_CSE", name: "B.Tech Computer Science", level: "UG" },
  { id: 4, code: "BTECH_IT", name: "B.Tech Information Technology", level: "UG" },
  { id: 5, code: "MBA", name: "Master of Business Administration", level: "PG" },
];

export const mockBatches: BatchBrief[] = [
  { id: 1, label: "2022-24", passing_year: 2024 },
  { id: 2, label: "2023-25", passing_year: 2025 },
  { id: 3, label: "2024-26", passing_year: 2026 },
];

export const mockSpecializations = [
  { id: 1, course_id: 1, name: "Artificial Intelligence", is_active: true },
  { id: 2, course_id: 1, name: "Data Science", is_active: true },
  { id: 3, course_id: 2, name: "Cyber Security", is_active: true },
  { id: 4, course_id: 3, name: "Software Engineering", is_active: true },
];

// ============================================================================
// Mock Users
// ============================================================================

export const mockUsers: UserBrief[] = [
  { id: 1, email: "admin@iips.edu.in", full_name: "Admin User", phone: "9876543210" },
  { id: 2, email: "student1@iips.edu.in", full_name: "Rahul Sharma", phone: "9876543211" },
  { id: 3, email: "student2@iips.edu.in", full_name: "Priya Patel", phone: "9876543212" },
  { id: 4, email: "student3@iips.edu.in", full_name: "Amit Kumar", phone: "9876543213" },
  { id: 5, email: "student4@iips.edu.in", full_name: "Sneha Reddy", phone: "9876543214" },
  { id: 6, email: "student5@iips.edu.in", full_name: "Vikram Singh", phone: "9876543215" },
];

// ============================================================================
// Mock Students
// ============================================================================

export const mockStudents: StudentRead[] = [
  {
    id: 1,
    user_id: 2,
    enrollment_no: "DCS23MCA001",
    roll_no: "CS-2K23-01",
    course_id: 1,
    specialization_id: 1,
    batch_id: 2,
    current_semester: 3,
    current_percentage: 85.5,
    active_backlogs: 0,
    gap_years: 0,
    gender: "male",
    date_of_birth: "2001-05-15",
    city: "Mumbai",
    state: "Maharashtra",
    linkedin_url: "https://linkedin.com/in/rahulsharma",
    github_url: "https://github.com/rahulsharma",
    portfolio_url: "https://rahulsharma.dev",
    placement_opt_in: true,
    verification_status: "verified",
    verified_by_id: 1,
    verified_at: "2024-01-15T10:00:00Z",
    verification_remarks: "All documents verified successfully",
    profile_completeness: 95,
    is_debarred: false,
    debarred_reason: null,
    guardian_phone: "9876543210",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    user: mockUsers[1],
    course: mockCourses[0],
    batch: mockBatches[1],
    specialization: mockSpecializations[0],
    academics: [],
  },
  {
    id: 2,
    user_id: 3,
    enrollment_no: "DCS23MCA002",
    roll_no: "CS-2K23-02",
    course_id: 1,
    specialization_id: 2,
    batch_id: 2,
    current_semester: 3,
    current_percentage: 92.0,
    active_backlogs: 0,
    gap_years: 0,
    gender: "female",
    date_of_birth: "2002-08-22",
    city: "Delhi",
    state: "Delhi",
    linkedin_url: "https://linkedin.com/in/priyapatel",
    github_url: "https://github.com/priyapatel",
    portfolio_url: null,
    placement_opt_in: true,
    verification_status: "verified",
    verified_by_id: 1,
    verified_at: "2024-01-16T10:00:00Z",
    verification_remarks: "Documents verified",
    profile_completeness: 90,
    is_debarred: false,
    debarred_reason: null,
    guardian_phone: "9876543211",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
    user: mockUsers[2],
    course: mockCourses[0],
    batch: mockBatches[1],
    specialization: mockSpecializations[1],
    academics: [],
  },
  {
    id: 3,
    user_id: 4,
    enrollment_no: "DCS24MCA001",
    roll_no: "CS-2K24-01",
    course_id: 1,
    specialization_id: null,
    batch_id: 3,
    current_semester: 1,
    current_percentage: null,
    active_backlogs: 0,
    gap_years: 0,
    gender: "male",
    date_of_birth: "2003-01-10",
    city: "Bangalore",
    state: "Karnataka",
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    placement_opt_in: true,
    verification_status: "pending",
    verified_by_id: null,
    verified_at: null,
    verification_remarks: null,
    profile_completeness: 40,
    is_debarred: false,
    debarred_reason: null,
    guardian_phone: "9876543212",
    created_at: "2024-07-01T10:00:00Z",
    updated_at: "2024-07-01T10:00:00Z",
    user: mockUsers[3],
    course: mockCourses[0],
    batch: mockBatches[2],
    specialization: null,
    academics: [],
  },
  {
    id: 4,
    user_id: 5,
    enrollment_no: "DIT23MTECH001",
    roll_no: "IT-2K23-01",
    course_id: 2,
    specialization_id: 3,
    batch_id: 2,
    current_semester: 3,
    current_percentage: 78.5,
    active_backlogs: 1,
    gap_years: 0,
    gender: "female",
    date_of_birth: "2000-11-30",
    city: "Hyderabad",
    state: "Telangana",
    linkedin_url: "https://linkedin.com/in/snehareddy",
    github_url: "https://github.com/snehareddy",
    portfolio_url: "https://snehareddy.tech",
    placement_opt_in: true,
    verification_status: "rejected",
    verified_by_id: 1,
    verified_at: "2024-01-20T10:00:00Z",
    verification_remarks: "10th marksheet not matching",
    profile_completeness: 85,
    is_debarred: false,
    debarred_reason: null,
    guardian_phone: "9876543213",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
    user: mockUsers[4],
    course: mockCourses[1],
    batch: mockBatches[1],
    specialization: mockSpecializations[2],
    academics: [],
  },
  {
    id: 5,
    user_id: 6,
    enrollment_no: "DCS23BTECH001",
    roll_no: "CS-2K23-10",
    course_id: 3,
    specialization_id: 4,
    batch_id: 2,
    current_semester: 5,
    current_percentage: 88.0,
    active_backlogs: 0,
    gap_years: 1,
    gender: "male",
    date_of_birth: "2000-03-18",
    city: "Pune",
    state: "Maharashtra",
    linkedin_url: "https://linkedin.com/in/vikramsingh",
    github_url: "https://github.com/vikramsingh",
    portfolio_url: null,
    placement_opt_in: false,
    verification_status: "verified",
    verified_by_id: 1,
    verified_at: "2024-01-10T10:00:00Z",
    verification_remarks: "Verified",
    profile_completeness: 100,
    is_debarred: false,
    debarred_reason: null,
    guardian_phone: "9876543214",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-10T10:00:00Z",
    user: mockUsers[5],
    course: mockCourses[2],
    batch: mockBatches[1],
    specialization: mockSpecializations[3],
    academics: [],
  },
];

// ============================================================================
// Mock Academics
// ============================================================================

export const mockAcademics: Record<number, StudentAcademicRead[]> = {
  1: [
    {
      id: 1,
      student_id: 1,
      level: "10th",
      institution: "St. Xavier High School",
      stream: "Science",
      year_of_passing: 2017,
      percentage: 94.5,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 2,
      student_id: 1,
      level: "12th",
      institution: "St. Xavier Junior College",
      stream: "PCM",
      year_of_passing: 2019,
      percentage: 91.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 3,
      student_id: 1,
      level: "graduation",
      institution: "Mumbai University",
      stream: "BCA",
      year_of_passing: 2022,
      percentage: 82.5,
      cgpa: 8.5,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
  ],
  2: [
    {
      id: 4,
      student_id: 2,
      level: "10th",
      institution: "Delhi Public School",
      stream: "Science",
      year_of_passing: 2018,
      percentage: 96.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 5,
      student_id: 2,
      level: "12th",
      institution: "Delhi Public School",
      stream: "PCM",
      year_of_passing: 2020,
      percentage: 94.5,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 6,
      student_id: 2,
      level: "graduation",
      institution: "IIT Delhi",
      stream: "B.Tech CSE",
      year_of_passing: 2023,
      percentage: 89.0,
      cgpa: 9.2,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
  ],
  3: [
    {
      id: 7,
      student_id: 3,
      level: "10th",
      institution: "Bangalore High School",
      stream: "Science",
      year_of_passing: 2019,
      percentage: 88.0,
      cgpa: null,
      created_at: "2024-07-01T10:00:00Z",
      updated_at: "2024-07-01T10:00:00Z",
    },
    {
      id: 8,
      student_id: 3,
      level: "12th",
      institution: "Bangalore Junior College",
      stream: "PCM",
      year_of_passing: 2021,
      percentage: 85.5,
      cgpa: null,
      created_at: "2024-07-01T10:00:00Z",
      updated_at: "2024-07-01T10:00:00Z",
    },
    {
      id: 9,
      student_id: 3,
      level: "graduation",
      institution: "Bangalore University",
      stream: "B.Sc CS",
      year_of_passing: 2024,
      percentage: 80.0,
      cgpa: 8.0,
      created_at: "2024-07-01T10:00:00Z",
      updated_at: "2024-07-01T10:00:00Z",
    },
  ],
  4: [
    {
      id: 10,
      student_id: 4,
      level: "10th",
      institution: "Hyderabad Public School",
      stream: "Science",
      year_of_passing: 2016,
      percentage: 92.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 11,
      student_id: 4,
      level: "12th",
      institution: "Hyderabad Junior College",
      stream: "PCM",
      year_of_passing: 2018,
      percentage: 89.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 12,
      student_id: 4,
      level: "graduation",
      institution: "JNTU Hyderabad",
      stream: "B.Tech IT",
      year_of_passing: 2022,
      percentage: 75.0,
      cgpa: 7.8,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
  ],
  5: [
    {
      id: 13,
      student_id: 5,
      level: "10th",
      institution: "Pune High School",
      stream: "Science",
      year_of_passing: 2017,
      percentage: 90.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 14,
      student_id: 5,
      level: "12th",
      institution: "Pune Junior College",
      stream: "PCM",
      year_of_passing: 2019,
      percentage: 87.0,
      cgpa: null,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
    {
      id: 15,
      student_id: 5,
      level: "graduation",
      institution: "COEP Pune",
      stream: "B.Tech CSE",
      year_of_passing: 2023,
      percentage: 88.0,
      cgpa: 8.8,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
    },
  ],
};

// ============================================================================
// Mock Import Jobs
// ============================================================================

export const mockImportJobs: ImportJobRead[] = [
  {
    id: 1,
    kind: "students",
    file_id: 1,
    status: "completed",
    total_rows: 50,
    success_rows: 48,
    failed_rows: 2,
    started_by_id: 1,
    finished_at: "2024-01-15T10:05:00Z",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    kind: "students",
    file_id: 2,
    status: "completed",
    total_rows: 100,
    success_rows: 95,
    failed_rows: 5,
    started_by_id: 1,
    finished_at: "2024-01-20T14:30:00Z",
    created_at: "2024-01-20T14:25:00Z",
  },
  {
    id: 3,
    kind: "students",
    file_id: 3,
    status: "running",
    total_rows: 75,
    success_rows: 30,
    failed_rows: 0,
    started_by_id: 1,
    finished_at: null,
    created_at: new Date(Date.now() - 30000).toISOString(),
  },
];

export const mockImportErrors: Record<number, ImportJobErrorRead[]> = {
  1: [
    {
      id: 1,
      job_id: 1,
      row_number: 5,
      column_name: "enrollment_no",
      message: "[DUPLICATE_ENROLLMENT] Enrollment DCS23MCA005 already exists",
      raw_row: { enrollment_no: "DCS23MCA005", course: "MCA" },
      created_at: "2024-01-15T10:02:00Z",
    },
    {
      id: 2,
      job_id: 1,
      row_number: 12,
      column_name: "email",
      message: "[INVALID_EMAIL] Invalid email format",
      raw_row: { enrollment_no: "DCS23MCA012", email: "invalid-email", course: "MCA" },
      created_at: "2024-01-15T10:02:00Z",
    },
  ],
  2: [
    {
      id: 3,
      job_id: 2,
      row_number: 3,
      column_name: "roll_no",
      message: "[INVALID_ROLL_NO] Roll number format invalid",
      raw_row: { enrollment_no: "DCS23MCA003", roll_no: "INVALID", course: "MCA" },
      created_at: "2024-01-20T14:26:00Z",
    },
    {
      id: 4,
      job_id: 2,
      row_number: 7,
      column_name: "tenth_percent",
      message: "[INVALID_SCORE] Percentage out of range 0-100",
      raw_row: { enrollment_no: "DCS23MCA007", tenth_percent: 105, course: "MCA" },
      created_at: "2024-01-20T14:26:00Z",
    },
    {
      id: 5,
      job_id: 2,
      row_number: 15,
      column_name: "dob",
      message: "[INVALID_DOB] Date of birth in future",
      raw_row: { enrollment_no: "DCS23MCA015", dob: "2030-01-01", course: "MCA" },
      created_at: "2024-01-20T14:26:00Z",
    },
    {
      id: 6,
      job_id: 2,
      row_number: 22,
      column_name: "backlogs",
      message: "[INVALID_BACKLOGS] Backlogs cannot be negative",
      raw_row: { enrollment_no: "DCS23MCA022", backlogs: -1, course: "MCA" },
      created_at: "2024-01-20T14:26:00Z",
    },
    {
      id: 7,
      job_id: 2,
      row_number: 45,
      column_name: "email",
      message: "[DUPLICATE_EMAIL] Email already registered",
      raw_row: { enrollment_no: "DCS23MCA045", email: "student1@iips.edu.in", course: "MCA" },
      created_at: "2024-01-20T14:26:00Z",
    },
  ],
  3: [],
};

// ============================================================================
// Helper Functions
// ============================================================================

let nextStudentId = 6;
let nextAcademicId = 16;
let nextImportJobId = 4;
let nextImportErrorId = 8;

export function getStudentById(id: number): StudentRead | undefined {
  return mockStudents.find((s) => s.id === id);
}

export function getStudentByUserId(userId: number): StudentRead | undefined {
  return mockStudents.find((s) => s.user_id === userId);
}

export function getStudentAcademics(studentId: number): StudentAcademicRead[] {
  return mockAcademics[studentId] || [];
}

export function getAllStudents(): StudentRead[] {
  return mockStudents;
}

export function getImportJob(id: number): ImportJobRead | undefined {
  return mockImportJobs.find((j) => j.id === id);
}

export function getImportErrors(jobId: number): ImportJobErrorRead[] {
  return mockImportErrors[jobId] || [];
}

// For MSW handlers to simulate mutations
export function addStudent(
  student: Omit<StudentRead, "id" | "created_at" | "updated_at">,
): StudentRead {
  const newStudent: StudentRead = {
    ...student,
    id: nextStudentId++,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockStudents.push(newStudent);
  return newStudent;
}

export function updateStudent(id: number, data: Partial<StudentRead>): StudentRead | null {
  const index = mockStudents.findIndex((s) => s.id === id);
  if (index === -1) return null;
  mockStudents[index] = { ...mockStudents[index], ...data, updated_at: new Date().toISOString() };
  return mockStudents[index];
}

export function deleteStudent(id: number): boolean {
  const index = mockStudents.findIndex((s) => s.id === id);
  if (index === -1) return false;
  mockStudents.splice(index, 1);
  return true;
}

export function addAcademic(
  studentId: number,
  academic: Omit<StudentAcademicRead, "id" | "student_id" | "created_at" | "updated_at">,
): StudentAcademicRead {
  const newAcademic: StudentAcademicRead = {
    ...academic,
    id: nextAcademicId++,
    student_id: studentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!mockAcademics[studentId]) mockAcademics[studentId] = [];
  mockAcademics[studentId].push(newAcademic);
  return newAcademic;
}

export function updateAcademic(
  academicId: number,
  studentId: number,
  data: Partial<StudentAcademicRead>,
): StudentAcademicRead | null {
  const academics = mockAcademics[studentId];
  if (!academics) return null;
  const index = academics.findIndex((a) => a.id === academicId);
  if (index === -1) return null;
  academics[index] = { ...academics[index], ...data, updated_at: new Date().toISOString() };
  return academics[index];
}

export function deleteAcademic(academicId: number, studentId: number): boolean {
  const academics = mockAcademics[studentId];
  if (!academics) return false;
  const index = academics.findIndex((a) => a.id === academicId);
  if (index === -1) return false;
  academics.splice(index, 1);
  return true;
}

export function createImportJob(): ImportJobRead {
  const newJob: ImportJobRead = {
    id: nextImportJobId++,
    kind: "students",
    file_id: 999,
    status: "running",
    total_rows: 0,
    success_rows: 0,
    failed_rows: 0,
    started_by_id: 1,
    finished_at: null,
    created_at: new Date().toISOString(),
  };
  mockImportJobs.push(newJob);
  return newJob;
}

export function updateImportJob(id: number, data: Partial<ImportJobRead>): ImportJobRead | null {
  const index = mockImportJobs.findIndex((j) => j.id === id);
  if (index === -1) return null;
  mockImportJobs[index] = { ...mockImportJobs[index], ...data };
  return mockImportJobs[index];
}

export function addImportError(
  jobId: number,
  error: Omit<ImportJobErrorRead, "id" | "job_id" | "created_at">,
): ImportJobErrorRead {
  const newError: ImportJobErrorRead = {
    ...error,
    id: nextImportErrorId++,
    job_id: jobId,
    created_at: new Date().toISOString(),
  };
  if (!mockImportErrors[jobId]) mockImportErrors[jobId] = [];
  mockImportErrors[jobId].push(newError);
  return newError;
}
