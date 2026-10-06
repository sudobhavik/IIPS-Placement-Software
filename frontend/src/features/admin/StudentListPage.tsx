// frontend/src/features/admin/StudentListPage.tsx
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/useAuth";
import { studentApi } from "../../features/student/studentApi";
import { DataTable } from "../../components/tables/DataTable";
import { createStudentColumns } from "../../components/tables/StudentColumns";
import { VerificationModal } from "../../components/modals/VerificationModal";
import { toast } from "../../components/ui/Toast";
import { cn } from "../../lib/utils";
import { VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from "../../lib/constants";
import type { VerificationStatus, StudentListParams } from "../../lib/constants";
import type { StudentListResponse } from "../../api/types";

// ============================================================================
// Student List Page Component
// ============================================================================

export function StudentListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<Omit<StudentListParams, "page" | "page_size">>({});
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [verifyingStudent, setVerifyingStudent] = useState<{
    id: number;
    enrollment_no: string;
    user: { full_name: string };
  } | null>(null);

  // Combine query parameters into a single payload
  const queryParams: StudentListParams = useMemo(
    () => ({
      ...filters,
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [filters, page, pageSize, sortBy, sortOrder],
  );

  // Fetch students with filters, pagination, sorting
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<StudentListResponse>({
    queryKey: ["admin", "students", "list", queryParams],
    queryFn: () => studentApi.listStudents(queryParams),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 30 * 1000,
    placeholderData: (previous) => previous,
  });

  // Verify student mutation
  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { verification_status: VerificationStatus; remarks: string | null };
    }) => studentApi.verifyStudent(id, data),
    onSuccess: (updatedStudent) => {
      toast.success(
        `Student ${updatedStudent.enrollment_no} marked as ${
          VERIFICATION_STATUS_LABELS[updatedStudent.verification_status as VerificationStatus]
        }`,
      );
      setVerifyingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "students", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "students", "count"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };
      const detail = axiosError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Failed to update verification";
      toast.error(message);
    },
  });

  const handleVerifyClick = useCallback(
    (student: { id: number; enrollment_no: string; user: { full_name: string } }) => {
      setVerifyingStudent(student);
    },
    [],
  );

  const handleVerifySubmit = useCallback(
    (data: { verification_status: VerificationStatus; remarks: string | null }) => {
      if (verifyingStudent) {
        verifyMutation.mutate({ id: verifyingStudent.id, data });
      }
    },
    [verifyingStudent, verifyMutation],
  );

  const handleFilterChange = useCallback((newFilters: Partial<StudentListParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleSortChange = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("asc");
      return column;
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some((value) => value !== undefined && value !== null && value !== ""),
    [filters],
  );

  const columns = useMemo(() => createStudentColumns(handleVerifyClick), [handleVerifyClick]);

  if (isLoading && !response) {
    return <StudentListSkeleton />;
  }

  if (error) {
    return <StudentListError onRetry={refetch} />;
  }

  const students = response?.items || [];
  const total = response?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and verify student profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading && !response}
        emptyMessage="No students found matching your criteria"
        rowKey={(row) => row.id}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSortChange: handleSortChange,
        }}
        renderToolbar={() => (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {total.toLocaleString()} student{total !== 1 ? "s" : ""} found
            </span>
          </div>
        )}
      />

      {/* Verification Modal */}
      <VerificationModal
        isOpen={!!verifyingStudent}
        onClose={() => setVerifyingStudent(null)}
        student={verifyingStudent}
        currentStatus={
          (students.find((s) => s.id === verifyingStudent?.id)
            ?.verification_status as VerificationStatus) || null
        }
        onSubmit={handleVerifySubmit}
        isSubmitting={verifyMutation.isPending}
      />
    </div>
  );
}

// ============================================================================
// Filter Bar
// ============================================================================

function FilterBar({
  filters,
  onFilterChange,
}: {
  filters: Omit<StudentListParams, "page" | "page_size">;
  onFilterChange: (filters: Partial<StudentListParams>) => void;
}) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Keep search input state synchronized if parent clears filters
  const currentSearch = filters.search || "";
  if (searchValue !== currentSearch && !searchValue) {
    setSearchValue(currentSearch);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchValue || undefined });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[250px]">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
            >
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Name or enrollment number..."
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-white placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                  "transition-colors border-gray-300 dark:border-gray-600",
                )}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filters Selects */}
          <div className="flex flex-wrap gap-4">
            <FilterSelect
              label="Batch"
              value={filters.batch_id?.toString() || ""}
              onChange={(v) => onFilterChange({ batch_id: v ? Number(v) : undefined })}
              options={[]}
              placeholder="All batches"
            />
            <FilterSelect
              label="Course"
              value={filters.course_id?.toString() || ""}
              onChange={(v) => onFilterChange({ course_id: v ? Number(v) : undefined })}
              options={[]}
              placeholder="All courses"
            />
            <FilterSelect
              label="Verification"
              value={filters.verification_status || ""}
              onChange={(v) =>
                onFilterChange({ verification_status: (v as VerificationStatus) || undefined })
              }
              options={[
                { value: "", label: "All statuses" },
                {
                  value: VERIFICATION_STATUS.PENDING,
                  label: VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.PENDING],
                },
                {
                  value: VERIFICATION_STATUS.VERIFIED,
                  label: VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.VERIFIED],
                },
                {
                  value: VERIFICATION_STATUS.REJECTED,
                  label: VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.REJECTED],
                },
              ]}
              placeholder="All statuses"
            />
            <FilterSelect
              label="Placement Opt-in"
              value={filters.placement_opt_in === undefined ? "" : String(filters.placement_opt_in)}
              onChange={(v) =>
                onFilterChange({ placement_opt_in: v === "" ? undefined : v === "true" })
              }
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
              placeholder="All"
            />
            <FilterSelect
              label="Debarred"
              value={filters.is_debarred === undefined ? "" : String(filters.is_debarred)}
              onChange={(v) => onFilterChange({ is_debarred: v === "" ? undefined : v === "true" })}
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
              placeholder="All"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Filter Select
// ============================================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <div className="flex-1 min-w-[160px]">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-colors border-gray-300 dark:border-gray-600",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Skeleton & Error
// ============================================================================

function StudentListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <th key={i} className="h-12 bg-gray-300 dark:bg-gray-600" />
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
                  <td key={col} className="h-14 bg-gray-200 dark:bg-gray-700" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <svg
        className="h-12 w-12 mx-auto text-red-500 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Failed to load students
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Please try again or contact support.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export default StudentListPage;
