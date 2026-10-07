// frontend/src/lib/validations.ts
import { z } from "zod";
import {
  USER_ROLES,
  VERIFICATION_STATUS,
  ACADEMIC_LEVELS,
  GENDER_OPTIONS,
  ENROLLMENT_PATTERN,
  ROLL_NO_PATTERN,
  PASSWORD_POLICY,
} from "./constants";

/**
 * Common reusable schemas
 */
const emailSchema = z.string().email("Invalid email address");
const enrollmentSchema = z
  .string()
  .min(1, "Enrollment number is required")
  .regex(ENROLLMENT_PATTERN, "Invalid enrollment format (e.g., DCS23MCA001)");
const rollNoSchema = z
  .string()
  .regex(ROLL_NO_PATTERN, "Invalid roll number format (e.g., CS-2K23-01)")
  .optional()
  .or(z.literal(""));

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

const urlSchema = z.string().url("Invalid URL").optional().or(z.literal(""));

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/**
 * Password validation matching backend policy
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_POLICY.MIN_LENGTH,
    `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`,
  )
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .refine(
    (val) => !/(password|123456|qwerty|admin|welcome|letmein)/i.test(val),
    "Password is too common",
  );

/**
 * Auth schemas
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or enrollment number is required"),
  password: z.string().min(1, "Password is required"),
});

export const activateSchema = z
  .object({
    token: z.string().min(1, "Activation token is required"),
    enrollment_no: enrollmentSchema,
    dob: dateStringSchema,
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
    accepted_terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const checkActivationTokenSchema = z.object({
  token: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

/**
 * User schemas
 */
export const userRoleSchema = z.enum([
  USER_ROLES.STUDENT,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: emailSchema,
  full_name: z.string().min(1, "Full name is required").max(150),
  phone: phoneSchema,
  role: userRoleSchema,
  is_active: z.boolean(),
  must_change_password: z.boolean(),
  last_login_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const userBriefSchema = z.object({
  id: z.number().int().positive(),
  email: emailSchema,
  full_name: z.string(),
  phone: z.string().nullable(),
});

/**
 * Course & Batch schemas
 */
export const courseLevelSchema = z.enum(["UG", "PG", "DIPLOMA"]);

export const courseSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().max(20),
  name: z.string().max(150),
  level: courseLevelSchema,
  duration_years: z.number().int().positive().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const courseBriefSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  level: courseLevelSchema,
});

export const specializationSchema = z.object({
  id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  name: z.string().max(150),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const batchSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().max(20),
  passing_year: z.number().int().min(2000).max(2100),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const batchBriefSchema = z.object({
  id: z.number().int().positive(),
  label: z.string(),
  passing_year: z.number().int(),
});

/**
 * Student Academic schemas
 */
export const academicLevelSchema = z.enum([
  ACADEMIC_LEVELS.TENTH,
  ACADEMIC_LEVELS.TWELFTH,
  ACADEMIC_LEVELS.DIPLOMA,
  ACADEMIC_LEVELS.GRADUATION,
  ACADEMIC_LEVELS.POST_GRADUATION,
]);

export const studentAcademicCreateSchema = z.object({
  level: academicLevelSchema,
  institution: z.string().max(200).optional(),
  stream: z.string().max(100).optional(),
  year_of_passing: z.number().int().min(1990).max(2030).optional(),
  percentage: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

export const studentAcademicUpdateSchema = studentAcademicCreateSchema.partial().extend({
  level: academicLevelSchema,
});

export const studentAcademicReadSchema = z.object({
  id: z.number().int().positive(),
  student_id: z.number().int().positive(),
  level: z.string(),
  institution: z.string().nullable(),
  stream: z.string().nullable(),
  year_of_passing: z.number().int().nullable(),
  percentage: z.number().nullable(),
  cgpa: z.number().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Student schemas
 */
export const genderSchema = z.enum([
  GENDER_OPTIONS.MALE,
  GENDER_OPTIONS.FEMALE,
  GENDER_OPTIONS.OTHER,
  GENDER_OPTIONS.PREFER_NOT_TO_SAY,
]);

export const verificationStatusSchema = z.enum([
  VERIFICATION_STATUS.PENDING,
  VERIFICATION_STATUS.VERIFIED,
  VERIFICATION_STATUS.REJECTED,
]);

export const studentCreateSchema = z.object({
  user_id: z.number().int().positive(),
  enrollment_no: enrollmentSchema,
  roll_no: rollNoSchema,
  course_id: z.number().int().positive(),
  specialization_id: z.number().int().positive().nullable(),
  batch_id: z.number().int().positive(),
  current_semester: z.number().int().positive().nullable(),
  cgpa: z.number().min(0).max(10).nullable(),
  active_backlogs: z.number().int().min(0).default(0),
  gap_years: z.number().int().min(0).default(0),
  gender: genderSchema.nullable(),
  date_of_birth: dateStringSchema.nullable(),
  city: z.string().max(100).nullable(),
  state: z.string().max(100).nullable(),
  linkedin_url: urlSchema,
  github_url: urlSchema,
  portfolio_url: urlSchema,
  placement_opt_in: z.boolean().default(true),
});

export const studentUpdateSchema = z.object({
  gender: genderSchema.nullable().optional(),
  date_of_birth: dateStringSchema.nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  linkedin_url: urlSchema,
  github_url: urlSchema,
  portfolio_url: urlSchema,
  placement_opt_in: z.boolean().optional(),
});

export const studentVerifySchema = z.object({
  verification_status: verificationStatusSchema,
  remarks: z.string().max(1000).nullable().optional(),
});

export const studentReadSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  enrollment_no: z.string(),
  roll_no: z.string(),
  course_id: z.number().int().positive(),
  specialization_id: z.number().int().positive().nullable(),
  batch_id: z.number().int().positive(),
  current_semester: z.number().int().positive().nullable(),
  current_percentage: z.number().nullable(),
  active_backlogs: z.number().int(),
  gap_years: z.number().int(),
  gender: z.string().nullable(),
  date_of_birth: z.string().date().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  github_url: z.string().nullable(),
  portfolio_url: z.string().nullable(),
  placement_opt_in: z.boolean(),
  verification_status: z.string(),
  verified_by_id: z.number().int().positive().nullable(),
  verified_at: z.string().datetime().nullable(),
  verification_remarks: z.string().nullable(),
  profile_completeness: z.number().int(),
  is_debarred: z.boolean(),
  debarred_reason: z.string().nullable(),
  guardian_phone: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user: userBriefSchema,
  course: courseBriefSchema,
  batch: batchBriefSchema,
});

export const studentListResponseSchema = z.object({
  items: z.array(studentReadSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const studentListParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
  batch_id: z.number().int().positive().optional(),
  course_id: z.number().int().positive().optional(),
  verification_status: verificationStatusSchema.optional(),
  min_current_percentage: z.number().min(0).max(100).optional(),
  placement_opt_in: z.boolean().optional(),
  search: z.string().optional(),
  is_debarred: z.boolean().optional(),
});

/**
 * Import schemas
 */
export const importStatusSchema = z.enum(["pending", "running", "completed", "failed"]);

export const importJobErrorSchema = z.object({
  id: z.number().int().positive(),
  job_id: z.number().int().positive(),
  row_number: z.number().int().positive(),
  column_name: z.string().nullable(),
  message: z.string(),
  raw_row: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

export const importJobReadSchema = z.object({
  id: z.number().int().positive(),
  kind: z.string(),
  file_id: z.number().int().positive(),
  status: z.string(),
  total_rows: z.number().int().nonnegative(),
  success_rows: z.number().int().nonnegative(),
  failed_rows: z.number().int().nonnegative(),
  started_by_id: z.number().int().positive(),
  finished_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export const studentImportRowSchema = z.object({
  email: emailSchema,
  full_name: z.string().min(1).max(150),
  enrollment_no: enrollmentSchema,
  gender: genderSchema.nullable().optional(),
  dob: dateStringSchema.nullable().optional(),
  personal_no: phoneSchema,
  guardian_no: phoneSchema,
  course: z.string().min(1),
  tenth_percent: z.number().min(0).max(100).nullable().optional(),
  twelfth_percent: z.number().min(0).max(100).nullable().optional(),
  ug_cgpa: z.number().min(0).max(10).nullable().optional(),
  current_cgpa: z.number().min(0).max(10).nullable().optional(),
  backlogs: z.number().int().min(0).nullable().optional(),
  roll_no: rollNoSchema,
  is_debarred: z.boolean().default(false),
});

export const studentImportReportSchema = z.object({
  total_rows: z.number().int().nonnegative(),
  imported_rows: z.number().int().nonnegative(),
  failed_rows: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  placed_flag_ignored: z.number().int().nonnegative(),
  errors: z.array(importJobErrorSchema),
});

/**
 * Auth response schemas
 */
export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
  refresh_token: z.string(),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  expires_in: z.number().int().positive(),
  refresh_token: z.string(),
  must_change_password: z.boolean(),
  role: userRoleSchema,
});

export const meResponseSchema = z.object({
  id: z.number().int().positive(),
  email: emailSchema,
  full_name: z.string(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  must_change_password: z.boolean(),
  student_id: z.number().int().positive().nullable(),
});

export const activateResponseSchema = z.object({
  status: z.literal("activated"),
});

export const activateCheckResponseSchema = z.object({
  valid: z.boolean(),
});

export const changePasswordResponseSchema = z.object({
  message: z.string(),
});

/**
 * Health check
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  database: z.literal("connected"),
});

/**
 * Type exports for inference
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateInput = z.infer<typeof activateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type StudentVerifyInput = z.infer<typeof studentVerifySchema>;
export type StudentAcademicCreateInput = z.infer<typeof studentAcademicCreateSchema>;
export type StudentAcademicUpdateInput = z.infer<typeof studentAcademicUpdateSchema>;
export type StudentListParams = z.infer<typeof studentListParamsSchema>;
export type StudentImportRow = z.infer<typeof studentImportRowSchema>;
