// frontend/src/components/tables/StudentColumns.tsx
// StudentColumns.tsx line 2:
import { type TableColumn } from "../../api/types";

import { VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS } from "../../lib/constants";
import type { VerificationStatus } from "../../lib/constants";

// ============================================================================
// Student Table Columns
// ============================================================================

export function createStudentColumns(
  onVerifyClick: (student: {
    id: number;
    enrollment_no: string;
    user: { full_name: string };
  }) => void,
): TableColumn<any>[] {
  return [
    {
      key: "student",
      header: "Student",
      accessor: (row) => row.user?.full_name,
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.user?.full_name || "—"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.user?.email || "—"}</p>
        </div>
      ),
      width: "280px",
    },
    {
      key: "enrollment_no",
      header: "Enrollment No.",
      accessor: (row) => row.enrollment_no,
      cell: (row) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
          {row.enrollment_no}
        </span>
      ),
      width: "160px",
    },
    {
      key: "roll_no",
      header: "Roll No.",
      accessor: (row) => row.roll_no,
      cell: (row) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{row.roll_no}</span>
      ),
      width: "140px",
    },
    {
      key: "course",
      header: "Course",
      accessor: (row) => row.course?.code,
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.course?.code || "—"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.course?.name || ""}</p>
        </div>
      ),
      width: "160px",
    },
    {
      key: "batch",
      header: "Batch",
      accessor: (row) => row.batch?.label,
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-300">{row.batch?.label || "—"}</span>
      ),
      width: "100px",
    },
    {
      key: "verification_status",
      header: "Verification",
      accessor: (row) => row.verification_status,
      cell: (row) => <VerificationBadge status={row.verification_status as VerificationStatus} />,
      width: "140px",
      sortable: true,
    },
    {
      key: "placement_opt_in",
      header: "Placement Opt-in",
      accessor: (row) => row.placement_opt_in,
      cell: (row) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            row.placement_opt_in
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400",
          )}
        >
          {row.placement_opt_in ? "Yes" : "No"}
        </span>
      ),
      width: "140px",
      sortable: true,
    },
    {
      key: "is_debarred",
      header: "Debarred",
      accessor: (row) => row.is_debarred,
      cell: (row) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            row.is_debarred
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400",
          )}
        >
          {row.is_debarred ? "Yes" : "No"}
        </span>
      ),
      width: "100px",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerifyClick({
                id: row.id,
                enrollment_no: row.enrollment_no,
                user: { full_name: row.user?.full_name || "" },
              });
            }}
            className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
          >
            Verify
          </button>
        </div>
      ),
      align: "right",
      width: "100px",
    },
  ];
}

// ============================================================================
// Verification Badge
// ============================================================================

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const label = VERIFICATION_STATUS_LABELS[status] || status;

  const styles = {
    [VERIFICATION_STATUS.PENDING]:
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    [VERIFICATION_STATUS.VERIFIED]:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    [VERIFICATION_STATUS.REJECTED]:
      "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  };

  const dotStyles = {
    [VERIFICATION_STATUS.PENDING]: "bg-yellow-500",
    [VERIFICATION_STATUS.VERIFIED]: "bg-green-500",
    [VERIFICATION_STATUS.REJECTED]: "bg-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        styles[status] || styles[VERIFICATION_STATUS.PENDING],
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          dotStyles[status] || dotStyles[VERIFICATION_STATUS.PENDING],
        )}
      />
      {label}
    </span>
  );
}

// ============================================================================
// Utility
// ============================================================================

import { cn } from "../../lib/utils";

export default createStudentColumns;
