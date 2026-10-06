// frontend/src/api/mocks/handlers.ts
import { http, HttpResponse, delay } from "msw";
import {
  getStudentById,
  getStudentByUserId,
  getStudentAcademics,
  getAllStudents,
  updateStudent,
  deleteStudent,
  addStudent,
  addAcademic,
  updateAcademic,
  deleteAcademic,
  getImportJob,
  getImportErrors,
  createImportJob,
  updateImportJob,
  addImportError,
  mockCourses,
  mockBatches,
  mockUsers,
} from "./data";
import { API_ENDPOINTS } from "../../lib/constants";

// ============================================================================
// Helper: Simulate network delay
// ============================================================================

const SIMULATE_DELAY = 300;

// ============================================================================
// Student Endpoints (Mock)
// ============================================================================

export const studentHandlers = [
  // GET /students/me
  http.get(`${API_ENDPOINTS.STUDENTS_ME}`, async () => {
    await delay(SIMULATE_DELAY);
    // In real app, this would use the authenticated user's ID
    // For mock, return first student
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    return HttpResponse.json(student);
  }),

  // PATCH /students/me
  http.patch(`${API_ENDPOINTS.STUDENTS_ME}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const data = await request.json();
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    if (student.verification_status === "verified") {
      return HttpResponse.json(
        { detail: "Profile is verified and locked for editing" },
        { status: 409 },
      );
    }
    const updated = updateStudent(student.id, data);
    return HttpResponse.json(updated);
  }),

  // GET /students/me/academics
  http.get(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    const academics = getStudentAcademics(student.id);
    return HttpResponse.json(academics);
  }),

  // POST /students/me/academics
  http.post(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const data = await request.json();
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    if (student.verification_status === "verified") {
      return HttpResponse.json(
        { detail: "Profile is verified and locked for editing" },
        { status: 409 },
      );
    }
    const academic = addAcademic(student.id, data);
    return HttpResponse.json(academic, { status: 201 });
  }),

  // PUT /students/me/academics/:academic_id
  http.put(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}/:academic_id`, async ({ params, request }) => {
    await delay(SIMULATE_DELAY);
    const data = await request.json();
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    if (student.verification_status === "verified") {
      return HttpResponse.json(
        { detail: "Profile is verified and locked for editing" },
        { status: 409 },
      );
    }
    const academicId = parseInt(params.academic_id as string);
    const academic = updateAcademic(academicId, student.id, data);
    if (!academic) {
      return HttpResponse.json({ detail: "Academic record not found" }, { status: 404 });
    }
    return HttpResponse.json(academic);
  }),

  // DELETE /students/me/academics/:academic_id
  http.delete(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}/:academic_id`, async ({ params }) => {
    await delay(SIMULATE_DELAY);
    const student = getStudentByUserId(2);
    if (!student) {
      return HttpResponse.json({ detail: "Student profile not found" }, { status: 404 });
    }
    if (student.verification_status === "verified") {
      return HttpResponse.json(
        { detail: "Profile is verified and locked for editing" },
        { status: 409 },
      );
    }
    const academicId = parseInt(params.academic_id as string);
    const deleted = deleteAcademic(academicId, student.id);
    if (!deleted) {
      return HttpResponse.json({ detail: "Academic record not found" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

// ============================================================================
// Admin Student Endpoints (Mock)
// ============================================================================

export const adminStudentHandlers = [
  // GET /students (list with filters, pagination)
  http.get(`${API_ENDPOINTS.STUDENTS_LIST}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("page_size") || "20");
    const batch_id = url.searchParams.get("batch_id")
      ? parseInt(url.searchParams.get("batch_id")!)
      : undefined;
    const course_id = url.searchParams.get("course_id")
      ? parseInt(url.searchParams.get("course_id")!)
      : undefined;
    const verification_status = url.searchParams.get("verification_status") as any;
    const min_current_percentage = url.searchParams.get("min_current_percentage")
      ? parseFloat(url.searchParams.get("min_current_percentage")!)
      : undefined;
    const placement_opt_in = url.searchParams.get("placement_opt_in")
      ? url.searchParams.get("placement_opt_in") === "true"
      : undefined;
    const search = url.searchParams.get("search") || undefined;
    const is_debarred = url.searchParams.get("is_debarred")
      ? url.searchParams.get("is_debarred") === "true"
      : undefined;

    let students = getAllStudents();

    // Apply filters
    if (batch_id) students = students.filter((s) => s.batch_id === batch_id);
    if (course_id) students = students.filter((s) => s.course_id === course_id);
    if (verification_status)
      students = students.filter((s) => s.verification_status === verification_status);
    if (min_current_percentage !== undefined)
      students = students.filter((s) => (s.current_percentage || 0) >= min_current_percentage);
    if (placement_opt_in !== undefined)
      students = students.filter((s) => s.placement_opt_in === placement_opt_in);
    if (is_debarred !== undefined) students = students.filter((s) => s.is_debarred === is_debarred);
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.user.full_name.toLowerCase().includes(searchLower) ||
          s.enrollment_no.toLowerCase().includes(searchLower),
      );
    }

    const total = students.length;
    const start = (page - 1) * page_size;
    const items = students.slice(start, start + page_size);

    return HttpResponse.json({
      items,
      total,
      page,
      page_size,
    });
  }),

  // GET /students/:id
  http.get(`${API_ENDPOINTS.STUDENTS_DETAIL(":id")}`, async ({ params }) => {
    await delay(SIMULATE_DELAY);
    const id = parseInt(params.id as string);
    const student = getStudentById(id);
    if (!student) {
      return HttpResponse.json({ detail: "Student not found" }, { status: 404 });
    }
    return HttpResponse.json(student);
  }),

  // GET /students/:id/academics
  http.get(`${API_ENDPOINTS.STUDENTS_ACADEMICS(":id")}`, async ({ params }) => {
    await delay(SIMULATE_DELAY);
    const id = parseInt(params.id as string);
    const student = getStudentById(id);
    if (!student) {
      return HttpResponse.json({ detail: "Student not found" }, { status: 404 });
    }
    const academics = getStudentAcademics(id);
    return HttpResponse.json(academics);
  }),

  // PATCH /students/:id/verify
  http.patch(`${API_ENDPOINTS.STUDENTS_VERIFY(":id")}`, async ({ params, request }) => {
    await delay(SIMULATE_DELAY);
    const id = parseInt(params.id as string);
    const data = await request.json();
    const student = getStudentById(id);
    if (!student) {
      return HttpResponse.json({ detail: "Student not found" }, { status: 404 });
    }
    const updated = updateStudent(id, {
      verification_status: data.verification_status,
      verification_remarks: data.remarks,
      verified_by_id: 1, // mock admin
      verified_at: new Date().toISOString(),
    });
    return HttpResponse.json(updated);
  }),
];

// ============================================================================
// Import Endpoints (Mock)
// ============================================================================

export const importHandlers = [
  // POST /import/students
  http.post(`${API_ENDPOINTS.IMPORTS_STUDENTS}`, async ({ request }) => {
    await delay(500); // Longer delay for file upload simulation
    const formData = await request.formData();
    const file = formData.get("upload_file") as File;

    if (!file) {
      return HttpResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    // Simulate import processing
    const job = createImportJob();

    // Simulate async processing - in real app this would be background
    // For mock, we'll just return a completed job with some results
    setTimeout(() => {
      updateImportJob(job.id, {
        status: "completed",
        total_rows: 25,
        success_rows: 23,
        failed_rows: 2,
        finished_at: new Date().toISOString(),
      });

      // Add some mock errors
      addImportError(job.id, {
        row_number: 5,
        column_name: "enrollment_no",
        message: "[DUPLICATE_ENROLLMENT] Enrollment already exists",
        raw_row: { enrollment_no: "DCS23MCA005", course: "MCA" },
      });
      addImportError(job.id, {
        row_number: 12,
        column_name: "email",
        message: "[INVALID_EMAIL] Invalid email format",
        raw_row: { enrollment_no: "DCS23MCA012", email: "invalid-email", course: "MCA" },
      });
    }, 1000);

    return HttpResponse.json(
      {
        total_rows: 25,
        imported_rows: 23,
        failed_rows: 2,
        warnings: 1,
        placed_flag_ignored: 0,
        errors: [
          {
            id: 1,
            job_id: job.id,
            row_number: 5,
            column_name: "enrollment_no",
            message: "[DUPLICATE_ENROLLMENT] Enrollment already exists",
            raw_row: { enrollment_no: "DCS23MCA005", course: "MCA" },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            job_id: job.id,
            row_number: 12,
            column_name: "email",
            message: "[INVALID_EMAIL] Invalid email format",
            raw_row: { enrollment_no: "DCS23MCA012", email: "invalid-email", course: "MCA" },
            created_at: new Date().toISOString(),
          },
        ],
      },
      { status: 201 },
    );
  }),

  // GET /import/jobs/:job_id
  http.get(`${API_ENDPOINTS.IMPORTS_JOB(":job_id")}`, async ({ params }) => {
    await delay(SIMULATE_DELAY);
    const id = parseInt(params.job_id as string);
    const job = getImportJob(id);
    if (!job) {
      return HttpResponse.json({ detail: "Import job not found" }, { status: 404 });
    }
    return HttpResponse.json(job);
  }),

  // GET /import/jobs/:job_id/errors
  http.get(`${API_ENDPOINTS.IMPORTS_JOB_ERRORS(":job_id")}`, async ({ params }) => {
    await delay(SIMULATE_DELAY);
    const id = parseInt(params.job_id as string);
    const errors = getImportErrors(id);
    return HttpResponse.json(errors);
  }),
];

// ============================================================================
// Master Data Endpoints (Mock)
// ============================================================================

export const masterDataHandlers = [
  // GET /courses
  http.get("/courses", async () => {
    await delay(SIMULATE_DELAY);
    return HttpResponse.json(mockCourses);
  }),

  // GET /batches
  http.get("/batches", async () => {
    await delay(SIMULATE_DELAY);
    return HttpResponse.json(mockBatches);
  }),

  // GET /specializations
  http.get("/specializations", async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const url = new URL(request.url);
    const course_id = url.searchParams.get("course_id");
    let specializations = [
      { id: 1, course_id: 1, name: "Artificial Intelligence", is_active: true },
      { id: 2, course_id: 1, name: "Data Science", is_active: true },
      { id: 3, course_id: 2, name: "Cyber Security", is_active: true },
      { id: 4, course_id: 3, name: "Software Engineering", is_active: true },
    ];
    if (course_id) {
      specializations = specializations.filter((s) => s.course_id === parseInt(course_id));
    }
    return HttpResponse.json(specializations);
  }),
];

// ============================================================================
// Auth Endpoints (Mock - for when backend not available)
// ============================================================================

export const authMockHandlers = [
  // POST /auth/login - only if backend not reachable
  http.post(`${API_ENDPOINTS.AUTH_LOGIN}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const data = await request.json();
    const { identifier, password } = data;

    // Mock authentication - check against mock users
    const user = mockUsers.find(
      (u) => u.email === identifier || u.full_name.toLowerCase() === identifier.toLowerCase(),
    );

    if (!user || password !== "student123456") {
      return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const role = user.id === 1 ? "super_admin" : "student";
    const student = role === "student" ? getStudentByUserId(user.id) : null;

    return HttpResponse.json(
      {
        access_token: "mock-access-token-" + Date.now(),
        token_type: "bearer",
        expires_in: 1800,
        refresh_token: "", // In cookie
        must_change_password: false,
        role,
      },
      {
        headers: {
          "Set-Cookie": `refresh_token=mock-refresh-token; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=604800`,
        },
      },
    );
  }),

  // POST /auth/refresh
  http.post(`${API_ENDPOINTS.AUTH_REFRESH}`, async () => {
    await delay(SIMULATE_DELAY);
    return HttpResponse.json(
      {
        access_token: "mock-access-token-" + Date.now(),
        token_type: "bearer",
        expires_in: 1800,
        refresh_token: "",
        must_change_password: false,
        role: "student",
      },
      {
        headers: {
          "Set-Cookie": `refresh_token=mock-refresh-token; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=604800`,
        },
      },
    );
  }),

  // POST /auth/logout
  http.post(`${API_ENDPOINTS.AUTH_LOGOUT}`, async () => {
    await delay(SIMULATE_DELAY);
    return new HttpResponse(null, {
      status: 204,
      headers: {
        "Set-Cookie": "refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=0",
      },
    });
  }),

  // GET /auth/me
  http.get(`${API_ENDPOINTS.AUTH_ME}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // Mock: return first student user
    const user = mockUsers[1];
    const student = getStudentByUserId(user.id);

    return HttpResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: "student",
      must_change_password: false,
      student_id: student?.id || null,
    });
  }),

  // POST /auth/activate
  http.post(`${API_ENDPOINTS.AUTH_ACTIVATE}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const data = await request.json();
    // Mock: always succeed if token provided
    if (data.token && data.enrollment_no && data.dob && data.new_password) {
      return HttpResponse.json({ status: "activated" });
    }
    return HttpResponse.json({ detail: "Invalid activation data" }, { status: 400 });
  }),

  // GET /auth/activate/check
  http.get(`${API_ENDPOINTS.AUTH_ACTIVATE_CHECK}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    return HttpResponse.json({ valid: !!token });
  }),

  // POST /auth/change-password
  http.post(`${API_ENDPOINTS.AUTH_CHANGE_PASSWORD}`, async ({ request }) => {
    await delay(SIMULATE_DELAY);
    return HttpResponse.json({ message: "Password changed successfully" });
  }),
];

// ============================================================================
// All Handlers Combined
// ============================================================================

export const allHandlers = [
  ...authMockHandlers,
  ...studentHandlers,
  ...adminStudentHandlers,
  ...importHandlers,
  ...masterDataHandlers,
];

// Export for conditional use
export {
  studentHandlers,
  adminStudentHandlers,
  importHandlers,
  masterDataHandlers,
  authMockHandlers,
};
