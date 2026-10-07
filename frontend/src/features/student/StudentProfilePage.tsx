// frontend/src/features/student/StudentProfilePage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { studentApi } from "./studentApi";
import { ProfileForm } from "../../components/forms/ProfileForm";
import { toast } from "../../components/ui/Toast";
import { ROUTES } from "../../lib/constants";
import { VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from "../../lib/constants";
import { cn } from "../../lib/utils";
import type { StudentProfileFormData } from "../../api/types";
import { useNavigate } from "react-router-dom";

// ============================================================================
// Student Profile Page Component
// ============================================================================

export function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: studentApi.getMyProfile,
    enabled: !!user && user.role === "student",
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: StudentProfileFormData) => studentApi.updateMyProfile(data),
    onSuccess: async (updatedProfile) => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
      await refreshUser();
      toast.success("Profile updated successfully");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || "Failed to update profile";
      toast.error(message);
    },
  });

  // Check if profile is verified (editing disabled)
  const isVerified = profile?.verification_status === VERIFICATION_STATUS.VERIFIED;
  const isRejected = profile?.verification_status === VERIFICATION_STATUS.REJECTED;

  // Map backend profile to form data
  const formDefaultValues = profile ? mapProfileToFormData(profile) : undefined;

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (error) {
    return <ProfilePageError onRetry={() => navigate(ROUTES.STUDENT_PROFILE, { replace: true })} />;
  }

  if (!profile) {
    return <ProfilePageError message="Profile not found" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal information and placement preferences
          </p>
        </div>
        <VerificationStatusBadge
          status={profile.verification_status}
          label={
            VERIFICATION_STATUS_LABELS[
              profile.verification_status as keyof typeof VERIFICATION_STATUS_LABELS
            ]
          }
          verifiedAt={profile.verified_at}
          remarks={profile.verification_remarks}
        />
      </div>

      {/* Verification Status Alert */}
      {isVerified && (
        <VerifiedAlert verifiedAt={profile.verified_at} remarks={profile.verification_remarks} />
      )}

      {isRejected && <RejectedAlert remarks={profile.verification_remarks} />}

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ProfileForm
          defaultValues={formDefaultValues}
          disabled={isVerified}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit(updateMutation.mutate)}
          submitLabel={isVerified ? "Profile Verified (Read Only)" : "Save Changes"}
        />
      </div>

      {/* Read-only Info Section */}
      <ReadOnlyInfoSection profile={profile} />
    </div>
  );
}

// ============================================================================
// Helper: Map backend profile to form data
// ============================================================================

function mapProfileToFormData(profile: {
  gender: string | null;
  date_of_birth: string | null;
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  placement_opt_in: boolean;
  guardian_phone: string | null;
}): StudentProfileFormData {
  return {
    gender: profile.gender || null,
    date_of_birth: profile.date_of_birth || null,
    city: profile.city || "",
    state: profile.state || "",
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    portfolio_url: profile.portfolio_url || "",
    placement_opt_in: profile.placement_opt_in,
    guardian_phone: profile.guardian_phone || "",
  };
}

// ============================================================================
// Form Submit Handler
// ============================================================================

function handleSubmit(mutate: (data: StudentProfileFormData) => void) {
  return async (data: StudentProfileFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData: StudentProfileFormData = {
      ...data,
      gender: data.gender || null,
      date_of_birth: data.date_of_birth || null,
      city: data.city || null,
      state: data.state || null,
      linkedin_url: data.linkedin_url || null,
      github_url: data.github_url || null,
      portfolio_url: data.portfolio_url || null,
      guardian_phone: data.guardian_phone || null,
    };
    mutate(cleanedData);
  };
}

// ============================================================================
// Sub-components
// ============================================================================

function VerificationStatusBadge({
  status,
  label,
  verifiedAt,
  remarks,
}: {
  status: string;
  label: string;
  verifiedAt: string | null;
  remarks: string | null;
}) {
  const isVerified = status === VERIFICATION_STATUS.VERIFIED;
  const isPending = status === VERIFICATION_STATUS.PENDING;
  const isRejected = status === VERIFICATION_STATUS.REJECTED;

  const styles = {
    [VERIFICATION_STATUS.VERIFIED]:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    [VERIFICATION_STATUS.PENDING]:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    [VERIFICATION_STATUS.REJECTED]:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  };

  const dotStyles = {
    [VERIFICATION_STATUS.VERIFIED]: "bg-green-500",
    [VERIFICATION_STATUS.PENDING]: "bg-yellow-500",
    [VERIFICATION_STATUS.REJECTED]: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium",
        styles[status as keyof typeof styles] || styles[VERIFICATION_STATUS.PENDING],
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          dotStyles[status as keyof typeof dotStyles] || dotStyles[VERIFICATION_STATUS.PENDING],
        )}
      />
      <span>Verification: {label}</span>
      {verifiedAt && <span className="opacity-75">• Verified {formatDate(verifiedAt)}</span>}
    </div>
  );
}

function VerifiedAlert({
  verifiedAt,
  remarks,
}: {
  verifiedAt: string | null;
  remarks: string | null;
}) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">Profile Verified</p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Your profile has been verified by the placement cell on{" "}
            {verifiedAt ? formatDate(verifiedAt) : "an unknown date"}. Editing is disabled. Contact
            the placement cell if you need to make changes.
          </p>
          {remarks && (
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              <strong>Remarks:</strong> {remarks}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectedAlert({ remarks }: { remarks: string | null }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800 dark:text-red-200">Profile Rejected</p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Your profile was rejected by the placement cell. Please update your information below
            and it will be re-submitted for verification.
          </p>
          {remarks && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              <strong>Remarks:</strong> {remarks}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyInfoSection({
  profile,
}: {
  profile: {
    id: number;
    enrollment_no: string;
    roll_no: string;
    course: { code: string; name: string; level: string };
    batch: { label: string; passing_year: number };
    specialization: { name: string } | null;
    current_semester: number | null;
    current_percentage: number | null;
    active_backlogs: number;
    gap_years: number;
    user: { email: string; full_name: string; phone: string | null };
  };
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Read-Only Information
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        These fields are managed by the placement cell and cannot be edited here.
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Enrollment No.</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{profile.enrollment_no}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Roll No.</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{profile.roll_no}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Course</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {profile.course.code} - {profile.course.name}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Batch</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {profile.batch.label} (Passing: {profile.batch.passing_year})
          </dd>
        </div>
        {profile.specialization && (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Specialization</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {profile.specialization.name}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Current Semester</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {profile.current_semester ?? "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Current Percentage</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {profile.current_percentage !== null ? `${profile.current_percentage}%` : "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Active Backlogs</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{profile.active_backlogs}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Gap Years</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{profile.gap_years}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-gray-500 dark:text-gray-400">Email</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{profile.user.email}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {profile.user.phone || "Not provided"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-8 space-y-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-gray-300 dark:bg-gray-600 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function ProfilePageError({
  message = "Failed to load profile",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <AlertCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{message}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Please try again or contact support.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default StudentProfilePage;
