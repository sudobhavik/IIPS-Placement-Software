// frontend/src/features/admin/AdminDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/useAuth";
import { studentApi } from "../../features/student/studentApi";
import { healthApi } from "../../api/client";
import { toast } from "../../components/ui/Toast";
import { cn } from "../../lib/utils";
import { ROUTES } from "../../lib/constants";
import { VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from "../../lib/constants";
import type { VerificationStatus } from "../../lib/constants";
import { useNavigate } from "react-router-dom";

// ============================================================================
// Admin Dashboard Component
// ============================================================================

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch student stats by verification status
  const { data: pendingCount, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "students", "count", "pending"],
    queryFn: () =>
      studentApi.listStudents({ verification_status: VERIFICATION_STATUS.PENDING, page_size: 1 }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.total,
  });

  const { data: verifiedCount, isLoading: verifiedLoading } = useQuery({
    queryKey: ["admin", "students", "count", "verified"],
    queryFn: () =>
      studentApi.listStudents({ verification_status: VERIFICATION_STATUS.VERIFIED, page_size: 1 }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.total,
  });

  const { data: rejectedCount, isLoading: rejectedLoading } = useQuery({
    queryKey: ["admin", "students", "count", "rejected"],
    queryFn: () =>
      studentApi.listStudents({ verification_status: VERIFICATION_STATUS.REJECTED, page_size: 1 }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.total,
  });

  const { data: allStudents, isLoading: allLoading } = useQuery({
    queryKey: ["admin", "students", "count", "all"],
    queryFn: () => studentApi.listStudents({ page_size: 1 }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.total,
  });

  const { data: optInCount, isLoading: optInLoading } = useQuery({
    queryKey: ["admin", "students", "count", "optin"],
    queryFn: () => studentApi.listStudents({ placement_opt_in: true, page_size: 1 }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
    select: (data) => data.total,
  });

  // Fetch recent students (pending verification) for quick review
  const { data: pendingStudents, isLoading: pendingStudentsLoading } = useQuery({
    queryKey: ["admin", "students", "pending", "recent"],
    queryFn: () =>
      studentApi.listStudents({
        verification_status: VERIFICATION_STATUS.PENDING,
        page: 1,
        page_size: 5,
      }),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 2 * 60 * 1000,
  });

  // Health check
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: healthApi.check,
    refetchInterval: 30 * 1000,
    retry: 3,
  });

  const isLoading =
    pendingLoading || verifiedLoading || rejectedLoading || allLoading || healthLoading;

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of student placements and system status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SystemStatusBadge status={health?.status} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={allStudents ?? 0}
          icon={<UsersIcon className="h-6 w-6" />}
          description="All registered students"
          href={ROUTES.ADMIN_STUDENTS}
        />
        <StatCard
          title="Pending Verification"
          value={pendingCount ?? 0}
          icon={<ClockIcon className="h-6 w-6" />}
          description="Awaiting admin review"
          variant="warning"
          href={ROUTES.ADMIN_STUDENTS + "?verification_status=pending"}
        />
        <StatCard
          title="Verified"
          value={verifiedCount ?? 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          description="Approved profiles"
          variant="success"
          href={ROUTES.ADMIN_STUDENTS + "?verification_status=verified"}
        />
        <StatCard
          title="Rejected"
          value={rejectedCount ?? 0}
          icon={<XCircleIcon className="h-6 w-6" />}
          description="Needs attention"
          variant="danger"
          href={ROUTES.ADMIN_STUDENTS + "?verification_status=rejected"}
        />
        <StatCard
          title="Placement Opt-in"
          value={optInCount ?? 0}
          icon={<BriefcaseIcon className="h-6 w-6" />}
          description="Eligible for drives"
          variant="info"
          href={ROUTES.ADMIN_STUDENTS + "?placement_opt_in=true"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          title="Import Students"
          description="Upload Excel file to bulk import student data"
          icon={<UploadIcon className="h-6 w-6" />}
          href={ROUTES.ADMIN_IMPORTS}
          primary
        />
        <ActionCard
          title="Manage Students"
          description="View, filter, and verify student profiles"
          icon={<UsersIcon className="h-6 w-6" />}
          href={ROUTES.ADMIN_STUDENTS}
        />
        <ActionCard
          title="Import History"
          description="View past import jobs and error reports"
          icon={<HistoryIcon className="h-6 w-6" />}
          href={ROUTES.ADMIN_IMPORTS}
        />
        <ActionCard
          title="System Health"
          description="Monitor API and database status"
          icon={<DatabaseIcon className="h-6 w-6" />}
          onClick={() => toast.info(`Database: ${health?.database || "unknown"}`)}
        />
      </div>

      {/* Pending Verification Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Verification
          </h2>
          <a
            href={ROUTES.ADMIN_STUDENTS + "?verification_status=pending"}
            className="text-primary hover:underline text-sm font-medium"
          >
            View all
          </a>
        </div>
        <div className="p-4">
          {pendingStudents && pendingStudents.items.length > 0 ? (
            <PendingStudentsTable students={pendingStudents.items} />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-green-400 mb-3" />
              <p className="font-medium">No pending verifications</p>
              <p className="text-sm mt-1">All caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          title="System Status"
          items={[
            {
              label: "API Status",
              value: health?.status === "ok" ? "Healthy" : "Degraded",
              color:
                health?.status === "ok"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
            },
            {
              label: "Database",
              value: health?.database === "connected" ? "Connected" : "Disconnected",
              color:
                health?.database === "connected"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
            },
            {
              label: "Last Check",
              value: health ? "Just now" : "Unknown",
              color: "text-gray-600 dark:text-gray-400",
            },
          ]}
        />
        <InfoCard
          title="Quick Stats"
          items={[
            {
              label: "Verification Rate",
              value:
                allStudents && allStudents > 0
                  ? `${Math.round(((verifiedCount || 0) / allStudents) * 100)}%`
                  : "N/A",
              color: "text-gray-900 dark:text-white",
            },
            {
              label: "Opt-in Rate",
              value:
                allStudents && allStudents > 0
                  ? `${Math.round(((optInCount || 0) / allStudents) * 100)}%`
                  : "N/A",
              color: "text-gray-900 dark:text-white",
            },
            {
              label: "Rejection Rate",
              value:
                allStudents && allStudents > 0
                  ? `${Math.round(((rejectedCount || 0) / allStudents) * 100)}%`
                  : "N/A",
              color: "text-gray-900 dark:text-white",
            },
          ]}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SystemStatusBadge({ status }: { status: string | undefined }) {
  const isHealthy = status === "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        isHealthy
          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", isHealthy ? "bg-green-500" : "bg-red-500")} />
      {isHealthy ? "System Healthy" : "System Degraded"}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  variant = "default",
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  href?: string;
}) {
  const variantStyles = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  const valueStyles = {
    default: "text-gray-900 dark:text-white",
    success: "text-green-700 dark:text-green-300",
    warning: "text-yellow-700 dark:text-yellow-300",
    danger: "text-red-700 dark:text-red-300",
    info: "text-blue-700 dark:text-blue-300",
  };

  const iconStyles = {
    default: "text-gray-500 dark:text-gray-400",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
    info: "text-blue-500",
  };

  const Content = href ? "a" : "div";

  return (
    <Content
      href={href}
      className={cn(
        "p-5 rounded-xl border transition-colors",
        variantStyles[variant],
        href && "hover:shadow-md hover:border-primary/50 cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", valueStyles[variant])}>
            {value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className={cn("flex-shrink-0 p-2 rounded-lg", iconStyles[variant])}>{icon}</div>
      </div>
    </Content>
  );
}

function ActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  primary = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const Content = href || onClick ? "button" : "div";

  return (
    <Content
      onClick={handleClick}
      href={href}
      className={cn(
        "flex flex-col items-start gap-3 p-5 rounded-xl border transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
        primary
          ? "bg-primary/5 dark:bg-primary/10 border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white cursor-pointer",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          primary ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-100 dark:bg-gray-700",
        )}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-75 mt-1">{description}</p>
      </div>
      {href && (
        <svg
          className="text-current opacity-50"
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
      )}
    </Content>
  );
}

function PendingStudentsTable({
  students,
}: {
  students: Array<{
    id: number;
    enrollment_no: string;
    user: { full_name: string; email: string };
    course: { code: string };
    batch: { label: string };
    created_at: string;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Student
            </th>
            <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Enrollment
            </th>
            <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Course
            </th>
            <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Batch
            </th>
            <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Registered
            </th>
            <th className="text-right py-2 px-4 font-medium text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {student.user.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{student.user.email}</p>
                </div>
              </td>
              <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                {student.enrollment_no}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{student.course.code}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{student.batch.label}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                {formatDate(student.created_at)}
              </td>
              <td className="py-3 px-4 text-right">
                <a
                  href={`${ROUTES.ADMIN_STUDENTS}/${student.id}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Review
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string; color: string }>;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <dl className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <dt className="text-sm text-gray-500 dark:text-gray-400">{item.label}</dt>
            <dd className={cn("text-sm font-medium", item.color)}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
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

// ============================================================================
// Icons
// ============================================================================

function UsersIcon({ className }: { className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

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

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

function UploadIcon({ className }: { className?: string }) {
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
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
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
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}

export default AdminDashboard;
