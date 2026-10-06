// frontend/src/components/tables/DataTable.tsx
import { useState, useMemo, ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { TableColumn } from "../../api/types";

// ============================================================================
// DataTable Component
// ============================================================================

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSortChange: (column: string) => void;
  };
  selection?: {
    selectedIds: Set<string | number>;
    onSelectionChange: (ids: Set<string | number>) => void;
    getRowId: (row: T) => string | number;
  };
  className?: string;
  renderToolbar?: () => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
  rowKey,
  onRowClick,
  pagination,
  sorting,
  selection,
  className,
  renderToolbar,
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const sortedData = useMemo(() => {
    if (!sorting) return data;
    return [...data].sort((a, b) => {
      const aVal = columns.find((c) => c.key === sorting.sortBy)?.accessor?.(a);
      const bVal = columns.find((c) => c.key === sorting.sortBy)?.accessor?.(b);
      if (aVal === bVal) return 0;
      const direction = sorting.sortOrder === "asc" ? 1 : -1;
      return aVal > bVal ? direction : -direction;
    });
  }, [data, columns, sorting]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
          className,
        )}
      >
        <TableSkeleton columns={columns.length} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        className,
      )}
    >
      {renderToolbar && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">{renderToolbar()}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {selection && (
                <th className="w-12 py-3 px-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={
                      data.length > 0 &&
                      data.every((row) => selection.selectedIds.has(selection.getRowId(row)))
                    }
                    indeterminate={
                      data.length > 0 &&
                      data.some((row) => selection.selectedIds.has(selection.getRowId(row))) &&
                      !data.every((row) => selection.selectedIds.has(selection.getRowId(row)))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        selection.onSelectionChange(new Set(data.map(selection.getRowId)));
                      } else {
                        selection.onSelectionChange(new Set());
                      }
                    }}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400",
                    column.sortable &&
                      "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 select-none",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.width && `w-${column.width}`,
                  )}
                  onClick={
                    column.sortable && sorting ? () => sorting.onSortChange(column.key) : undefined
                  }
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={
                    sorting?.sortBy === column.key
                      ? sorting.sortOrder === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sorting?.sortBy === column.key && (
                      <span aria-hidden="true">{sorting.sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
              {!selection && onRowClick && (
                <th className="w-12 py-3 px-4 text-center text-gray-500 dark:text-gray-400" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selection ? 1 : 0) + (onRowClick ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                const rowId = rowKey(row);
                const isSelected = selection?.selectedIds.has(rowId);
                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      isSelected && "bg-primary/5 dark:bg-primary/10",
                      hoveredRow === rowId && "bg-gray-50 dark:bg-gray-700/50",
                    )}
                    onMouseEnter={() => setHoveredRow(rowId)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {selection && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelection = new Set(selection.selectedIds);
                            if (e.target.checked) newSelection.add(rowId);
                            else newSelection.delete(rowId);
                            selection.onSelectionChange(newSelection);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "py-3 px-4 text-sm text-gray-600 dark:text-gray-300",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                        )}
                      >
                        {column.cell
                          ? column.cell(row)
                          : column.accessor
                            ? String(column.accessor(row) ?? "")
                            : ""}
                      </td>
                    ))}
                    {!selection && onRowClick && (
                      <td className="py-3 px-4 text-center text-gray-400">
                        <svg
                          className="mx-auto h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-4">
      <table className="w-full">
        <thead>
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, row) => (
            <tr key={row}>
              {[...Array(columns)].map((_, col) => (
                <td key={col} className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
      <svg
        className="h-12 w-12 mb-3 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1 && total <= pageSize) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {start} to {end} of {total.toLocaleString()} results
      </div>
      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Results per page"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="First page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="px-3 text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Last page"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7m-8-14l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
