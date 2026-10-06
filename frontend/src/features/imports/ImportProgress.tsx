// frontend/src/features/imports/ImportProgress.tsx
import { cn } from "../../lib/utils";
import { IMPORT_STATUS } from "../../lib/constants";
import type { ImportStatus } from "../../lib/constants";

// ============================================================================
// Import Progress Component
// ============================================================================

interface ImportProgressProps {
  status: ImportStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  warnings: number;
  placedFlagIgnored: number;
  startedAt: string;
  finishedAt: string | null;
  onRetry?: () => void;
  onViewErrors?: () => void;
}

export function ImportProgress({
  status,
  totalRows,
  successRows,
  failedRows,
  warnings,
  placedFlagIgnored,
  startedAt,
  finishedAt,
  onRetry,
  onViewErrors,
}: ImportProgressProps) {
  const isRunning = status === IMPORT_STATUS.RUNNING;
  const isPending = status === IMPORT_STATUS.PENDING;
  const isCompleted = status === IMPORT_STATUS.COMPLETED;
  const isFailed = status === IMPORT_STATUS.FAILED;

  const progress = totalRows > 0 ? Math.round((successRows / totalRows) * 100) : 0;

  // frontend/src/features/imports/ImportProgress.tsx - Fix getStatusConfig
  const getStatusConfig = () => {
    const baseConfig = {
      COMPLETED: {
        label: "Completed",
        color: "bg-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
      },
      FAILED: {
        label: "Failed",
        color: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
      },
      RUNNING: {
        label: "Processing...",
        color: "bg-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
      },
      PENDING: {
        label: "Queued",
        color: "bg-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-800",
      },
    };

    return (
      baseConfig[status] || {
        label: status,
        color: "bg-gray-500",
        bg: "bg-gray-50 dark:bg-gray-800/50",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
      }
    );
  };

  const config = getStatusConfig();

  return (
    <div className={cn("rounded-xl border p-5", config.bg, config.border)}>
      {/* Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", config.color, isRunning && "animate-pulse")} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Import Status</h3>
            <p className={cn("text-sm font-medium", config.text)}>{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (isFailed || isCompleted) && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              New Import
            </button>
          )}
          {onViewErrors && failedRows > 0 && (
            <button
              onClick={onViewErrors}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              View Errors ({failedRows})
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-5">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Overall Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Processed {successRows.toLocaleString()} of {totalRows.toLocaleString()} rows
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatItem
          label="Total Rows"
          value={totalRows.toLocaleString()}
          icon={<FileIcon className="h-5 w-5" />}
        />
        <StatItem
          label="Imported"
          value={successRows.toLocaleString()}
          icon={<CheckIcon className="h-5 w-5" />}
          color="text-green-600 dark:text-green-400"
        />
        <StatItem
          label="Failed"
          value={failedRows.toLocaleString()}
          icon={<XIcon className="h-5 w-5" />}
          color={
            failedRows > 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
          }
        />
        <StatItem
          label="Warnings"
          value={warnings.toLocaleString()}
          icon={<AlertIcon className="h-5 w-5" />}
          color={
            warnings > 0
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-600 dark:text-gray-400"
          }
        />
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Placed Flag Ignored</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {placedFlagIgnored.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Started</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(startedAt)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Finished</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {finishedAt ? formatDateTime(finishedAt) : isRunning ? "In progress..." : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Duration</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {finishedAt ? getDuration(startedAt, finishedAt) : isRunning ? "Running..." : "—"}
          </p>
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && !isRunning && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-green-800 dark:text-green-200 text-sm">
              <p className="font-medium">Import completed successfully!</p>
              <p>
                {successRows.toLocaleString()} student{successRows !== 1 ? "s" : ""} imported.
              </p>
              {warnings > 0 && (
                <p className="mt-1">
                  {warnings} warning{warnings !== 1 ? "s" : ""} - review if needed.
                </p>
              )}
              {failedRows > 0 && (
                <p className="mt-1 text-red-700 dark:text-red-300">
                  {failedRows} row{failedRows !== 1 ? "s" : ""} failed - click "View Errors" for
                  details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isFailed && !isRunning && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-red-800 dark:text-red-200 text-sm">
              <p className="font-medium">Import failed</p>
              <p>Please check the error details and try again with a corrected file.</p>
              {onRetry && (
                <button onClick={onRetry} className="mt-2 text-sm underline hover:no-underline">
                  Try another import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stat Item
// ============================================================================

function StatItem({
  label,
  value,
  icon,
  color = "text-gray-900 dark:text-white",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn("font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDateTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function getDuration(start: string, end: string): string {
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  } catch {
    return "—";
  }
}

export default ImportProgress;
