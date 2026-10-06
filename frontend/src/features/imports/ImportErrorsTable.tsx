// frontend/src/features/imports/ImportErrorsTable.tsx
import { useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { DataTable } from "../../components/tables/DataTable";
import type { ImportJobErrorRead } from "../../api/types";

// ============================================================================
// Import Errors Table Component
// ============================================================================

interface ImportErrorsTableProps {
  errors: ImportJobErrorRead[];
  jobId: number;
  onClose: () => void;
}

export function ImportErrorsTable({ errors, jobId, onClose }: ImportErrorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilter, setColumnFilter] = useState<string>("");
  const [rawDataModal, setRawDataModal] = useState<Record<string, unknown> | null>(null);

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      const matchesSearch =
        !searchTerm ||
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.column_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(error.raw_row).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesColumn = !columnFilter || error.column_name === columnFilter;

      return matchesSearch && matchesColumn;
    });
  }, [errors, searchTerm, columnFilter]);

  const columns = useMemo(
    () => [
      {
        key: "row_number",
        header: "Row",
        accessor: (row: ImportJobErrorRead) => row.row_number,
        align: "center" as const,
        width: "80px",
      },
      {
        key: "column_name",
        header: "Column",
        accessor: (row: ImportJobErrorRead) => row.column_name || "—",
        cell: (row: ImportJobErrorRead) => (
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-mono",
              row.column_name
                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                : "text-gray-400",
            )}
          >
            {row.column_name || "—"}
          </span>
        ),
        width: "140px",
      },
      {
        key: "message",
        header: "Error",
        accessor: (row: ImportJobErrorRead) => row.message,
        cell: (row: ImportJobErrorRead) => (
          <div className="max-w-md">
            <p className="text-red-700 dark:text-red-300 text-sm">{row.message}</p>
          </div>
        ),
      },
      {
        key: "raw_row",
        header: "Raw Data",
        accessor: (row: ImportJobErrorRead) => JSON.stringify(row.raw_row || {}),
        cell: (row: ImportJobErrorRead) => (
          <button
            onClick={() => setRawDataModal(row.raw_row || {})}
            className="text-primary hover:underline text-sm font-medium"
            disabled={!row.raw_row || Object.keys(row.raw_row).length === 0}
          >
            View
          </button>
        ),
        align: "center" as const,
        width: "80px",
      },
      {
        key: "created_at",
        header: "Time",
        accessor: (row: ImportJobErrorRead) => row.created_at,
        cell: (row: ImportJobErrorRead) => (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {formatTime(row.created_at)}
          </span>
        ),
        align: "center" as const,
        width: "100px",
      },
    ],
    [],
  );

  const uniqueColumns = useMemo(() => {
    const cols = new Set(errors.map((e) => e.column_name).filter(Boolean));
    return Array.from(cols).sort();
  }, [errors]);

  const showRawData = (data: Record<string, unknown> | null) => {
    if (data && Object.keys(data).length > 0) {
      setRawDataModal(data);
    }
  };

  if (errors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg
          className="h-16 w-16 mx-auto text-green-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Errors Found</h3>
        <p className="text-gray-500 dark:text-gray-400">All rows were processed successfully.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Errors</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {errors.length} error{errors.length !== 1 ? "s" : ""} in job #{jobId}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full sm:w-64 px-4 py-2 rounded-lg border bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-white placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors border-gray-300 dark:border-gray-600",
                  "pl-10",
                )}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {uniqueColumns.length > 0 && (
              <select
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
                className={cn(
                  "px-4 py-2 rounded-lg border bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors border-gray-300 dark:border-gray-600",
                )}
              >
                <option value="">All Columns</option>
                {uniqueColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredErrors}
          rowKey={(row) => row.id}
          emptyMessage="No errors match your filters"
          className="rounded-none border-0"
        />

        {/* Summary Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredErrors.length} of {errors.length} error{errors.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Raw Data Modal */}
      {rawDataModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="raw-data-title"
        >
          <div className="fixed inset-0 bg-black/50" onClick={() => setRawDataModal(null)} />
          <div className="relative min-h-full p-4 flex items-center justify-center">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-xl z-10">
                <h2
                  id="raw-data-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Raw Row Data
                </h2>
                <button
                  onClick={() => setRawDataModal(null)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-auto">
                <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <code>{JSON.stringify(rawDataModal, null, 2)}</code>
                </pre>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setRawDataModal(null)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(dateString: string): string {
  try {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default ImportErrorsTable;
