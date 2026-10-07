// frontend/src/features/student/StudentDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { studentApi } from "./studentApi";
import { cn } from "../../lib/utils";
import { ROUTES } from "../../lib/constants";
import { VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from "../../lib/constants";
import type { VerificationStatus } from "../../lib/constants";

// ============================================================================
// Student Dashboard Component
// ============================================================================

export function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch profile data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: studentApi.getMyProfile,
    enabled: !!user && user.role === "student",
    staleTime: 5 * 60 * 1000,
  });

  // Fetch academics data
  const { data: academics, isLoading: academicsLoading } = useQuery({
    queryKey: ["student", "academics"],
    queryFn: studentApi.getMyAcademics,
    enabled: !!user && user.role === "student",
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || profileLoading || academicsLoading;

  // Calculate academic level counts
  const academicCounts =
    academics?.reduce(
      (acc, a) => {
        acc[a.level] = (acc[a.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  // Get verification status display
  const verificationStatus = profile?.verification_status as VerificationStatus | undefined;
  const statusLabel = verificationStatus
    ? VERIFICATION_STATUS_LABELS[verificationStatus]
    : "Unknown";
  const statusColor = getStatusColor(verificationStatus);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (profileError) {
    return <DashboardError />;
  }

  if (!profile) {
    return <DashboardError message="Unable to load profile data" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile.user.full_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {profile.course.code} • {profile.batch.label} • {profile.enrollment_no}
          </p>
        </div>
        <ProfileCompletenessBadge completeness={profile.profile_completeness} />
      </div>

      {/* Verification Status Banner */}
      <VerificationStatusBanner
        status={verificationStatus}
        label={statusLabel}
        color={statusColor}
        remarks={profile.verification_remarks}
        verifiedAt={profile.verified_at}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Academic Records"
          value={academics?.length ?? 0}
          icon={<GraduationCapIcon className="h-6 w-6" />}
          description={getAcademicBreakdown(academicCounts)}
          action={
            academics && academics.length > 0 ? (
              <a
                href={ROUTES.STUDENT_ACADEMICS}
                className="text-primary hover:underline text-sm font-medium"
              >
                View all
              </a>
            ) : (
              <a
                href={ROUTES.STUDENT_ACADEMICS}
                className="text-primary hover:underline text-sm font-medium"
              >
                Add first record
              </a>
            )
          }
        />

        <StatCard
          title="Placement Opt-in"
          value={profile.placement_opt_in ? "Yes" : "No"}
          icon={<BriefcaseIcon className="h-6 w-6" />}
          description={profile.placement_opt_in ? "Eligible for drives" : "Not participating"}
          variant={profile.placement_opt_in ? "success" : "warning"}
        />

        <StatCard
          title="Verification"
          value={statusLabel}
          icon={<ShieldCheckIcon className="h-6 w-6" />}
          description={
            verificationStatus === VERIFICATION_STATUS.VERIFIED
              ? profile.verified_at
                ? `Verified on ${formatDate(profile.verified_at)}`
                : "Verified"
              : verificationStatus === VERIFICATION_STATUS.PENDING
                ? "Awaiting admin review"
                : "Contact placement cell"
          }
          variant={getStatusVariant(verificationStatus)}
        />

        <StatCard
          title="Current Semester"
          value={profile.current_semester ? `Sem ${profile.current_semester}` : "Not set"}
          icon={<BookOpenIcon className="h-6 w-6" />}
          description="Update in profile if incorrect"
          variant={profile.current_semester ? "default" : "muted"}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Edit Profile"
            description="Update personal info, contact details, social links, and placement preferences"
            icon={<UserIcon className="h-6 w-6" />}
            href={ROUTES.STUDENT_PROFILE}
            primary
          />
          <ActionCard
            title="Manage Academics"
            description={
              academics && academics.length > 0
                ? `View and edit your ${academics.length} academic record${academics.length > 1 ? "s" : ""}`
                : "Add your 10th, 12th, graduation, and post-graduation details"
            }
            icon={<GraduationCapIcon className="h-6 w-6" />}
            href={ROUTES.STUDENT_ACADEMICS}
            primary={!academics || academics.length === 0}
          />
        </div>
      </div>

      {/* Academic Records Summary */}
      {academics && academics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Academic Records
            </h2>
            <a
              href={ROUTES.STUDENT_ACADEMICS}
              className="text-primary hover:underline text-sm font-medium"
            >
              View all
            </a>
          </div>
          <AcademicSummaryTable academics={academics} />
        </div>
      )}

      {/* Empty State for Academics */}
      {!academicsLoading && (!academics || academics.length === 0) && <EmptyAcademicsState />}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ProfileCompletenessBadge({ completeness }: { completeness: number }) {
  const color =
    completeness >= 80 ? "bg-green-500" : completeness >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3 sm:flex-row flex-col sm:items-end">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Profile Complete</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{completeness}%</p>
      </div>
      <div className="w-24 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${completeness}%` }}
        />
      </div>
    </div>
  );
}

function VerificationStatusBanner({
  status,
  label,
  color,
  remarks,
  verifiedAt,
}: {
  status: VerificationStatus | undefined;
  label: string;
  color: string;
  remarks: string | null;
  verifiedAt: string | null;
}) {
  if (!status) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border",
        getStatusBgColor(status),
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusDotColor(status))} />
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Verification Status</p>
          <p className={cn("text-sm font-semibold", color)}>{label}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
        {verifiedAt && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Verified on {formatDate(verifiedAt)}
          </span>
        )}
        {remarks && <span className="text-sm text-gray-500 dark:text-gray-400">{remarks}</span>}
        {status === VERIFICATION_STATUS.REJECTED && (
          <a
            href={ROUTES.STUDENT_PROFILE}
            className="text-primary hover:underline text-sm font-medium self-start"
          >
            Update profile to re-submit
          </a>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  variant = "default",
  action,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  variant?: "default" | "success" | "warning" | "muted";
  action?: React.ReactNode;
}) {
  const variantStyles = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    muted: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
  };

  const valueStyles = {
    default: "text-gray-900 dark:text-white",
    success: "text-green-700 dark:text-green-300",
    warning: "text-yellow-700 dark:text-yellow-300",
    muted: "text-gray-500 dark:text-gray-400",
  };

  return (
    <div className={cn("p-5 rounded-xl border", variantStyles[variant])}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={cn("text-2xl font-bold mt-1", valueStyles[variant])}>{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">{icon}</div>
      </div>
      {action && <div className="mt-3 pt-3 border-t border-current/20">{action}</div>}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  href,
  primary = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-start gap-4 p-5 rounded-xl border transition-colors",
        primary
          ? "bg-primary/5 dark:bg-primary/10 border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20"
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50",
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 p-2 rounded-lg",
          primary
            ? "bg-primary/10 dark:bg-primary/20 text-primary"
            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <svg
        className="flex-shrink-0 text-gray-400 dark:text-gray-500"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
}

function AcademicSummaryTable({
  academics,
}: {
  academics: Array<{
    level: string;
    institution: string | null;
    year_of_passing: number | null;
    percentage: number | null;
    cgpa: number | null;
  }>;
}) {
  const levelOrder = ["10th", "12th", "diploma", "graduation", "post_graduation"];
  const sortedAcademics = [...academics].sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
              Level
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
              Institution
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
              Year
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
              Percentage
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
              CGPA
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {sortedAcademics.map((a) => (
            <tr key={a.level} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-white capitalize">
                {a.level.replace("_", " ")}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{a.institution || "—"}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                {a.year_of_passing || "—"}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                {a.percentage !== null ? `${a.percentage}%` : "—"}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                {a.cgpa !== null ? a.cgpa.toFixed(2) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyAcademicsState() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <GraduationCapIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No Academic Records Yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Add your 10th, 12th, graduation, and post-graduation details to complete your profile and
        enable placement eligibility checks.
      </p>
      <a
        href={ROUTES.STUDENT_ACADEMICS}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        <PlusIcon className="h-5 w-5" />
        Add First Record
      </a>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}

function DashboardError({ message = "Failed to load dashboard" }: { message?: string }) {
  const { logout } = useAuth();
  return (
    <div className="text-center py-12">
      <AlertCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{message}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Please try again or contact support.</p>
      <button
        onClick={logout}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusColor(status: VerificationStatus | undefined): string {
  switch (status) {
    case VERIFICATION_STATUS.VERIFIED:
      return "text-green-700 dark:text-green-300";
    case VERIFICATION_STATUS.PENDING:
      return "text-yellow-700 dark:text-yellow-300";
    case VERIFICATION_STATUS.REJECTED:
      return "text-red-700 dark:text-red-300";
    default:
      return "text-gray-700 dark:text-gray-300";
  }
}

function getStatusBgColor(status: VerificationStatus): string {
  switch (status) {
    case VERIFICATION_STATUS.VERIFIED:
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    case VERIFICATION_STATUS.PENDING:
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    case VERIFICATION_STATUS.REJECTED:
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
  }
}

function getStatusDotColor(status: VerificationStatus): string {
  switch (status) {
    case VERIFICATION_STATUS.VERIFIED:
      return "bg-green-500";
    case VERIFICATION_STATUS.PENDING:
      return "bg-yellow-500";
    case VERIFICATION_STATUS.REJECTED:
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function getStatusVariant(
  status: VerificationStatus | undefined,
): "default" | "success" | "warning" | "muted" {
  switch (status) {
    case VERIFICATION_STATUS.VERIFIED:
      return "success";
    case VERIFICATION_STATUS.PENDING:
      return "warning";
    case VERIFICATION_STATUS.REJECTED:
      return "default"; // Uses red via variantStyles
    default:
      return "muted";
  }
}

function getAcademicBreakdown(counts: Record<string, number>): string {
  const levels = ["10th", "12th", "diploma", "graduation", "post_graduation"];
  const parts = levels.filter((l) => counts[l]).map((l) => `${counts[l]} ${l.replace("_", " ")}`);
  return parts.length > 0 ? parts.join(", ") : "No records yet";
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

// ============================================================================
// Icons (inline to avoid extra imports)
// ============================================================================

function GraduationCapIcon({ className }: { className?: string }) {
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
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z"
      />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
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
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h4a2 2 0 002-2v-2m-4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
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
        d="M4 19.5A2.5 2.5 0 016.5 17H20"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

export default StudentDashboard;
