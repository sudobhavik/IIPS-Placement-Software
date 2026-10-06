// frontend/src/lib/constants.ts

/**
 * User roles matching backend UserRole enum
 */
export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.STUDENT]: "Student",
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.SUPER_ADMIN]: "Super Admin",
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STUDENT]: 1,
  [USER_ROLES.ADMIN]: 2,
  [USER_ROLES.SUPER_ADMIN]: 3,
};

/**
 * Verification statuses matching backend VerificationStatus enum
 */
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VERIFICATION_STATUS.PENDING]: "Pending",
  [VERIFICATION_STATUS.VERIFIED]: "Verified",
  [VERIFICATION_STATUS.REJECTED]: "Rejected",
};

/**
 * Academic levels matching backend AcademicLevel enum
 */
export const ACADEMIC_LEVELS = {
  TENTH: "10th",
  TWELFTH: "12th",
  DIPLOMA: "diploma",
  GRADUATION: "graduation",
  POST_GRADUATION: "post_graduation",
} as const;

export type AcademicLevel = (typeof ACADEMIC_LEVELS)[keyof typeof ACADEMIC_LEVELS];

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  [ACADEMIC_LEVELS.TENTH]: "10th",
  [ACADEMIC_LEVELS.TWELFTH]: "12th",
  [ACADEMIC_LEVELS.DIPLOMA]: "Diploma",
  [ACADEMIC_LEVELS.GRADUATION]: "Graduation",
  [ACADEMIC_LEVELS.POST_GRADUATION]: "Post Graduation",
};

export const ACADEMIC_LEVEL_ORDER: AcademicLevel[] = [
  ACADEMIC_LEVELS.TENTH,
  ACADEMIC_LEVELS.TWELFTH,
  ACADEMIC_LEVELS.DIPLOMA,
  ACADEMIC_LEVELS.GRADUATION,
  ACADEMIC_LEVELS.POST_GRADUATION,
];

/**
 * Gender options matching backend Gender enum
 */
export const GENDER_OPTIONS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

export type Gender = (typeof GENDER_OPTIONS)[keyof typeof GENDER_OPTIONS];

export const GENDER_LABELS: Record<Gender, string> = {
  [GENDER_OPTIONS.MALE]: "Male",
  [GENDER_OPTIONS.FEMALE]: "Female",
  [GENDER_OPTIONS.OTHER]: "Other",
  [GENDER_OPTIONS.PREFER_NOT_TO_SAY]: "Prefer not to say",
};

/**
 * Course levels matching backend CourseLevel enum
 */
export const COURSE_LEVELS = {
  UG: "UG",
  PG: "PG",
  DIPLOMA: "DIPLOMA",
} as const;

export type CourseLevel = (typeof COURSE_LEVELS)[keyof typeof COURSE_LEVELS];

/**
 * Import kinds matching backend ImportKind enum
 */
export const IMPORT_KINDS = {
  STUDENTS: "students",
  RESULTS: "results",
  COMPANIES: "companies",
} as const;

export type ImportKind = (typeof IMPORT_KINDS)[keyof typeof IMPORT_KINDS];

/**
 * Import statuses matching backend ImportStatus enum
 */
export const IMPORT_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ImportStatus = (typeof IMPORT_STATUS)[keyof typeof IMPORT_STATUS];

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  [IMPORT_STATUS.PENDING]: "Pending",
  [IMPORT_STATUS.RUNNING]: "Running",
  [IMPORT_STATUS.COMPLETED]: "Completed",
  [IMPORT_STATUS.FAILED]: "Failed",
};

/**
 * Application routes
 */
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  ACTIVATION: "/activate",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  CHANGE_PASSWORD: "/change-password", // ADD THIS
  UNAUTHORIZED: "/unauthorized",
  NOT_FOUND: "*",

  // Student (authenticated)
  STUDENT_DASHBOARD: "/dashboard",
  STUDENT_PROFILE: "/profile",
  STUDENT_ACADEMICS: "/academics",

  // Admin (authenticated, admin+)
  ADMIN_DASHBOARD: "/admin",
  ADMIN_STUDENTS: "/admin/students",
  ADMIN_IMPORTS: "/admin/imports",

  // API
  API_BASE: "/api/v1",
} as const;

/**
 * Route metadata for navigation and guards
 */
export const ROUTE_META = {
  [ROUTES.LOGIN]: { public: true, title: "Login" },
  [ROUTES.ACTIVATION]: { public: true, title: "Activate Account" },
  [ROUTES.FORGOT_PASSWORD]: { public: true, title: "Forgot Password" },
  [ROUTES.RESET_PASSWORD]: { public: true, title: "Reset Password" },
  [ROUTES.CHANGE_PASSWORD]: {
    roles: [USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    title: "Change Password",
    hidden: true,
  },
  [ROUTES.UNAUTHORIZED]: { public: true, title: "Unauthorized" },
  [ROUTES.STUDENT_DASHBOARD]: { roles: [USER_ROLES.STUDENT], title: "Dashboard" },
  [ROUTES.STUDENT_PROFILE]: { roles: [USER_ROLES.STUDENT], title: "Profile" },
  [ROUTES.STUDENT_ACADEMICS]: { roles: [USER_ROLES.STUDENT], title: "Academics" },
  [ROUTES.ADMIN_DASHBOARD]: {
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    title: "Admin Dashboard",
  },
  [ROUTES.ADMIN_STUDENTS]: { roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN], title: "Students" },
  [ROUTES.ADMIN_IMPORTS]: { roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN], title: "Imports" },
} as const;

/**
 * Sidebar navigation items by role
 */
export const SIDEBAR_ITEMS = {
  [USER_ROLES.STUDENT]: [
    { path: ROUTES.STUDENT_DASHBOARD, label: "Dashboard", icon: "layout-dashboard" },
    { path: ROUTES.STUDENT_PROFILE, label: "Profile", icon: "user" },
    { path: ROUTES.STUDENT_ACADEMICS, label: "Academics", icon: "graduation-cap" },
  ],
  [USER_ROLES.ADMIN]: [
    { path: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: "layout-dashboard" },
    { path: ROUTES.ADMIN_STUDENTS, label: "Students", icon: "users" },
    { path: ROUTES.ADMIN_IMPORTS, label: "Imports", icon: "upload" },
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    { path: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: "layout-dashboard" },
    { path: ROUTES.ADMIN_STUDENTS, label: "Students", icon: "users" },
    { path: ROUTES.ADMIN_IMPORTS, label: "Imports", icon: "upload" },
  ],
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/auth/login",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  AUTH_ACTIVATE: "/auth/activate",
  AUTH_ACTIVATE_CHECK: "/auth/activate/check", // FIXED: was '/auth/check-activation-token'
  AUTH_CHANGE_PASSWORD: "/auth/change-password",

  // Students
  STUDENTS_ME: "/students/me",
  STUDENTS_ME_ACADEMICS: "/students/me/academics",
  STUDENTS_LIST: "/students",
  STUDENTS_DETAIL: (id: number) => `/students/${id}`,
  STUDENTS_VERIFY: (id: number) => `/students/${id}/verify`,
  STUDENTS_ACADEMICS: (id: number) => `/students/${id}/academics`,

  // Imports
  IMPORTS_STUDENTS: "/import/students",
  IMPORTS_JOB: (id: number) => `/import/jobs/${id}`,
  IMPORTS_JOB_ERRORS: (id: number) => `/import/jobs/${id}/errors`,

  // Health
  HEALTH: "/health",
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "placeiq_access_token",
  USER: "placeiq_user",
  THEME: "placeiq_theme",
  SIDEBAR_COLLAPSED: "placeiq_sidebar_collapsed",
} as const;

/**
 * Cookie names (for reference - backend manages these)
 */
export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refresh_token",
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
  ],
  ALLOWED_EXTENSIONS: [".xlsx", ".xls"],
} as const;

/**
 * Password policy (must match backend)
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 10,
  REQUIRE_LETTER: true,
  REQUIRE_DIGIT: true,
  FORBID_COMMON: true,
} as const;

/**
 * Enrollment number pattern (IIPS format: D[A-Z]\d{7})
 */
export const ENROLLMENT_PATTERN = /^D[A-Z]\d{7}$/;

/**
 * Roll number pattern (IIPS format: (IC|IT|CS|EC|EE|ME|CE)-2K\d{2}-\d{2})
 */
export const ROLL_NO_PATTERN = /^(IC|IT|CS|EC|EE|ME|CE)-2K\d{2}-\d{2}$/i;

/**
 * Date format for API (YYYY-MM-DD)
 */
export const API_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Date display format
 */
export const DISPLAY_DATE_FORMAT = "MMM d, yyyy";

/**
 * Date time display format
 */
export const DISPLAY_DATETIME_FORMAT = "MMM d, yyyy h:mm a";

/**
 * Debounce delays (ms)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 150,
  RESIZE: 100,
} as const;

/**
 * Polling intervals (ms)
 */
export const POLLING_INTERVALS = {
  IMPORT_PROGRESS: 2000,
  JOB_STATUS: 3000,
} as const;

/**
 * Toast durations (ms)
 */
export const TOAST_DURATIONS = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

/**
 * Breakpoints (matching Tailwind)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;

/**
 * Default empty state messages
 */
export const EMPTY_MESSAGES = {
  STUDENTS: "No students found. Try adjusting your filters.",
  ACADEMICS: "No academic records added yet.",
  IMPORTS: "No import jobs yet. Upload a file to get started.",
  ERRORS: "No errors in this import job.",
  SEARCH: "No results found for your search.",
} as const;
