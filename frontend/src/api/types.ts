// frontend/src/api/types.ts
import type {
  UserRole,
  VerificationStatus,
  AcademicLevel,
  Gender,
  ImportStatus,
  CourseLevel,
} from "../lib/constants";

// ============================================================================
// Base Types
// ============================================================================

export interface Timestamped {
  created_at: string;
  updated_at: string;
}

export interface CreatedAtOnly {
  created_at: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserBrief {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
}

export interface User extends UserBrief, Timestamped {
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  password_hash?: never; // Never exposed
}

export interface MeResponse {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  must_change_password: boolean;
  student_id: number | null;
}

// ============================================================================
// Course & Batch Types
// ============================================================================

export interface CourseBrief {
  id: number;
  code: string;
  name: string;
  level: CourseLevel;
}

export interface Course extends CourseBrief, Timestamped {
  duration_years: number | null;
  is_active: boolean;
}

export interface Specialization extends Timestamped {
  id: number;
  course_id: number;
  name: string;
  is_active: boolean;
}

export interface BatchBrief {
  id: number;
  label: string;
  passing_year: number;
}

export interface Batch extends BatchBrief, Timestamped {
  is_active: boolean;
}

// ============================================================================
// Student Academic Types
// ============================================================================

export interface StudentAcademicBase {
  level: AcademicLevel;
  institution: string | null;
  stream: string | null;
  year_of_passing: number | null;
  percentage: number | null;
  cgpa: number | null;
}

// Create: all fields optional except level (required)
export interface StudentAcademicCreate {
  level: AcademicLevel;
  institution?: string | null;
  stream?: string | null;
  year_of_passing?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
}

// Update: partial of create, level required to identify record
export interface StudentAcademicUpdate {
  level: AcademicLevel;
  institution?: string | null;
  stream?: string | null;
  year_of_passing?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
}

// Read: backend returns string for level, not enum
export interface StudentAcademicRead extends Timestamped {
  id: number;
  student_id: number;
  level: string; // Backend returns string
  institution: string | null;
  stream: string | null;
  year_of_passing: number | null;
  percentage: number | null;
  cgpa: number | null;
}

// ============================================================================
// Student Types
// ============================================================================

export interface StudentBase {
  user_id: number;
  enrollment_no: string;
  roll_no: string;
  course_id: number;
  specialization_id: number | null;
  batch_id: number;
  current_semester: number | null;
  current_percentage: number | null;
  active_backlogs: number;
  gap_years: number;
  gender: Gender | null;
  date_of_birth: string | null; // YYYY-MM-DD
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  placement_opt_in: boolean;
  verification_status: VerificationStatus;
  verified_by_id: number | null;
  verified_at: string | null;
  verification_remarks: string | null;
  profile_completeness: number;
  is_debarred: boolean;
  debarred_reason: string | null;
  guardian_phone: string | null;
}

export interface StudentCreate extends StudentBase {
  enrollment_no: string; // Required
  roll_no: string; // Required
  course_id: number; // Required
  batch_id: number; // Required
}

export interface StudentUpdate {
  gender?: Gender | null;
  date_of_birth?: string | null;
  city?: string | null;
  state?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  placement_opt_in?: boolean;
  current_semester?: number | null;
  active_backlogs?: number;
  gap_years?: number;
  guardian_phone?: string | null;
}

export interface StudentVerify {
  verification_status: VerificationStatus;
  remarks?: string | null;
}

export interface StudentRead extends StudentBase, Timestamped {
  id: number;
  user: UserBrief;
  course: CourseBrief;
  batch: BatchBrief;
  specialization: Specialization | null;
  academics?: StudentAcademicRead[];
}

export interface StudentListParams {
  page?: number;
  page_size?: number;
  batch_id?: number;
  course_id?: number;
  verification_status?: VerificationStatus;
  min_current_percentage?: number;
  placement_opt_in?: boolean;
  search?: string;
  is_debarred?: boolean;
}

export interface StudentListResponse {
  items: StudentRead[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================================
// Import Types
// ============================================================================

export interface ImportJobErrorRead extends CreatedAtOnly {
  id: number;
  job_id: number;
  row_number: number;
  column_name: string | null;
  message: string;
  raw_row: Record<string, unknown> | null;
}

export interface ImportJobRead extends CreatedAtOnly {
  id: number;
  kind: string;
  file_id: number;
  status: ImportStatus;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  started_by_id: number;
  finished_at: string | null;
}

export interface StudentImportRow {
  email: string;
  full_name: string;
  enrollment_no: string;
  gender?: Gender | null;
  dob?: string | null; // YYYY-MM-DD
  personal_no?: string | null;
  guardian_no?: string | null;
  course: string;
  tenth_percent?: number | null;
  twelfth_percent?: number | null;
  ug_cgpa?: number | null;
  current_cgpa?: number | null;
  backlogs?: number | null;
  roll_no?: string | null;
  is_debarred?: boolean;
}

export interface StudentImportReport {
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  warnings: number;
  placed_flag_ignored: number;
  errors: ImportJobErrorRead[];
}

// ============================================================================
// Auth Types
// ============================================================================

export interface Token {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string;
}

export interface LoginRequest {
  identifier: string; // email or enrollment_no
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string; // Empty string - actual token in HttpOnly cookie
  must_change_password: boolean;
  role: UserRole;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface ActivateRequest {
  token: string;
  enrollment_no: string;
  dob: string; // YYYY-MM-DD
  new_password: string;
  accepted_terms: boolean;
}

export interface ActivateResponse {
  status: "activated";
}

export interface ActivateCheckResponse {
  valid: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ============================================================================
// File Types
// ============================================================================

export interface FileRead extends CreatedAtOnly {
  id: number;
  storage_key: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_by_id: number;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLogRead extends CreatedAtOnly {
  id: number;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  request_id: string | null;
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthResponse {
  status: "ok";
  database: "connected";
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  detail: string | ApiErrorDetail[];
}

export interface ValidationErrorResponse {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Form Types (for React Hook Form)
// ============================================================================

export interface LoginFormData {
  identifier: string;
  password: string;
}

export interface ActivateFormData {
  token: string;
  enrollment_no: string;
  dob: string;
  new_password: string;
  confirm_password: string;
  accepted_terms: boolean;
}

export interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface StudentProfileFormData {
  gender?: Gender | null;
  date_of_birth?: string | null;
  city?: string | null;
  state?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  placement_opt_in?: boolean;
  guardian_phone?: string | null;
}

export interface StudentAcademicFormData {
  level: AcademicLevel;
  institution?: string | null;
  stream?: string | null;
  year_of_passing?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
}

export interface ImportFileFormData {
  file: File;
}

// ============================================================================
// Filter Types (for DataTable)
// ============================================================================

export interface StudentFilters {
  batch_id?: number;
  course_id?: number;
  verification_status?: VerificationStatus;
  min_current_percentage?: number;
  placement_opt_in?: boolean;
  search?: string;
  is_debarred?: boolean;
}

export interface ImportErrorFilters {
  column_name?: string;
  search?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  accessor?: (row: T) => unknown;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface ConfirmDialogState extends ModalState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

// ============================================================================
// Auth Response Types (matching backend exactly)
// ============================================================================

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string; // Empty string - actual token in HttpOnly cookie
  must_change_password: boolean;
  role: UserRole;
}

export interface MeResponse {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  must_change_password: boolean;
  student_id: number | null;
}

export interface ActivateCheckResponse {
  valid: boolean;
}

export interface ActivateResponse {
  status: "activated";
}

export interface ChangePasswordResponse {
  message: string;
}

// ============================================================================
// Student API Types
// ============================================================================

export interface StudentListParams {
  page?: number;
  page_size?: number;
  batch_id?: number;
  course_id?: number;
  verification_status?: VerificationStatus;
  min_cgpa?: number; // backend uses min_cgpa
  placement_opt_in?: boolean;
  search?: string;
  is_debarred?: boolean;
}

export interface StudentVerify {
  verification_status: VerificationStatus;
  remarks?: string | null;
}

// Update existing StudentUpdate to match backend field names
export interface StudentUpdate {
  gender?: Gender | null;
  date_of_birth?: string | null;
  city?: string | null;
  state?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  placement_opt_in?: boolean;
  // Backend doesn't have these in update:
  // current_semester, active_backlogs, gap_years, guardian_phone
}

// StudentAcademic types - match backend field names
export interface StudentAcademicCreate {
  level: AcademicLevel;
  institution?: string | null;
  stream?: string | null;
  year_of_passing?: number | null;
  percentage?: number | null;
  cgpa?: number | null;
}

export interface StudentAcademicUpdate extends StudentAcademicCreate {}

export interface StudentAcademicRead {
  id: number;
  student_id: number;
  level: string;
  institution: string | null;
  stream: string | null;
  year_of_passing: number | null;
  percentage: number | null;
  cgpa: number | null;
  created_at: string;
  updated_at: string;
}
