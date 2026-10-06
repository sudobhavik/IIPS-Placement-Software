// frontend/src/features/student/StudentAcademicsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { studentApi } from "./studentApi";
import { AcademicForm } from "../../components/forms/AcademicForm";
import { toast } from "../../components/ui/Toast";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { cn } from "../../lib/utils";
import { ACADEMIC_LEVELS, ACADEMIC_LEVEL_LABELS, ACADEMIC_LEVEL_ORDER } from "../../lib/constants";
import type {
  StudentAcademicRead,
  StudentAcademicCreate,
  StudentAcademicUpdate,
} from "../../api/types";

// ============================================================================
// Student Academics Page Component
// ============================================================================

export function StudentAcademicsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAcademic, setEditingAcademic] = useState<StudentAcademicRead | null>(null);
  const [deletingAcademic, setDeletingAcademic] = useState<StudentAcademicRead | null>(null);

  // Fetch academics
  const {
    data: academics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student", "academics"],
    queryFn: studentApi.getMyAcademics,
    enabled: !!user && user.role === "student",
    staleTime: 5 * 60 * 1000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StudentAcademicCreate) => studentApi.createAcademic(data),
    onSuccess: () => {
      toast.success("Academic record added");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["student", "academics"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };
      const detail = axiosError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Failed to add record";
      toast.error(message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StudentAcademicUpdate }) =>
      studentApi.updateAcademic(id, data),
    onSuccess: () => {
      toast.success("Academic record updated");
      setEditingAcademic(null);
      queryClient.invalidateQueries({ queryKey: ["student", "academics"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };
      const detail = axiosError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Failed to update record";
      toast.error(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentApi.deleteAcademic(id),
    onSuccess: () => {
      toast.success("Academic record deleted");
      setDeletingAcademic(null);
      queryClient.invalidateQueries({ queryKey: ["student", "academics"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || "Failed to delete record";
      toast.error(message);
    },
  });

  // Check which levels already have records
  const existingLevels = new Set(academics?.map((a) => a.level) || []);
  const availableLevels = ACADEMIC_LEVEL_ORDER.filter((level) => !existingLevels.has(level));

  if (isLoading) {
    return <AcademicsPageSkeleton />;
  }

  if (error) {
    return <AcademicsPageError onRetry={refetch} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Records</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your 10th, 12th, graduation, and post-graduation details
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={availableLevels.length === 0 || createMutation.isPending}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            availableLevels.length === 0
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90",
          )}
        >
          <PlusIcon className="h-5 w-5" />
          Add Record
        </button>
      </div>

      {/* Validation Rules Info */}
      <ValidationRulesInfo />

      {/* Records List */}
      {academics && academics.length > 0 ? (
        <AcademicsList
          academics={academics}
          onEdit={setEditingAcademic}
          onDelete={setDeletingAcademic}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      ) : (
        <EmptyAcademicsState
          onAddClick={() => setIsCreateOpen(true)}
          disabled={availableLevels.length === 0}
        />
      )}

      {/* Create Modal */}
      <AcademicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        isSubmitting={createMutation.isPending}
        onSubmit={createMutation.mutate}
        availableLevels={availableLevels}
        title="Add Academic Record"
        submitLabel="Add Record"
      />

      {/* Edit Modal */}
      {editingAcademic && (
        <AcademicFormModal
          isOpen={true}
          onClose={() => setEditingAcademic(null)}
          isSubmitting={updateMutation.isPending}
          onSubmit={(data) => updateMutation.mutate({ id: editingAcademic.id, data })}
          defaultValues={editingAcademic}
          isEditing={true}
          availableLevels={[editingAcademic.level]}
          title="Edit Academic Record"
          submitLabel="Save Changes"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAcademic && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingAcademic(null)}
          title="Delete Academic Record"
          message={`Are you sure you want to delete your ${ACADEMIC_LEVEL_LABELS[deletingAcademic.level as keyof typeof ACADEMIC_LEVEL_LABELS] || deletingAcademic.level} record? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deletingAcademic.id)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function AcademicsList({
  academics,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  academics: StudentAcademicRead[];
  onEdit: (academic: StudentAcademicRead) => void;
  onDelete: (academic: StudentAcademicRead) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  // Sort by academic level order
  const sortedAcademics = [...academics].sort(
    (a, b) =>
      ACADEMIC_LEVEL_ORDER.indexOf(a.level as any) - ACADEMIC_LEVEL_ORDER.indexOf(b.level as any),
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                Level
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                Institution
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                Stream
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
              <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedAcademics.map((academic) => (
              <tr key={academic.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                    {ACADEMIC_LEVEL_LABELS[academic.level as keyof typeof ACADEMIC_LEVEL_LABELS] ||
                      academic.level}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  {academic.institution || "—"}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  {academic.stream || "—"}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  {academic.year_of_passing || "—"}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  {academic.percentage !== null ? `${academic.percentage}%` : "—"}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                  {academic.cgpa !== null ? academic.cgpa.toFixed(2) : "—"}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(academic)}
                      disabled={isUpdating}
                      className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Edit"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(academic)}
                      disabled={isDeleting}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyAcademicsState({
  onAddClick,
  disabled,
}: {
  onAddClick: () => void;
  disabled: boolean;
}) {
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
      <button
        onClick={onAddClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          disabled
            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            : "bg-primary text-white hover:bg-primary/90",
        )}
      >
        <PlusIcon className="h-5 w-5" />
        Add First Record
      </button>
    </div>
  );
}

function ValidationRulesInfo() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-2">Validation Rules:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Percentage must be between 0 and 100</li>
            <li>CGPA must be between 0 and 10</li>
            <li>Year of passing must be a valid year</li>
            <li>Percentage is not required for Post Graduation level</li>
            <li>Only one record per academic level allowed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AcademicFormModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
  defaultValues,
  isEditing = false,
  availableLevels,
  title,
  submitLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: StudentAcademicCreate | StudentAcademicUpdate) => void;
  defaultValues?: StudentAcademicRead;
  isEditing?: boolean;
  availableLevels: string[];
  title: string;
  submitLabel: string;
}) {
  if (!isOpen) return null;

  const handleSubmit = (data: StudentAcademicCreate | StudentAcademicUpdate) => {
    // Clean empty strings to null
    const cleanedData = {
      ...data,
      institution: data.institution || null,
      stream: data.stream || null,
      year_of_passing: data.year_of_passing || null,
      percentage: data.percentage || null,
      cgpa: data.cgpa || null,
    };
    onSubmit(cleanedData as StudentAcademicCreate);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative min-h-full p-4 flex items-center justify-center">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <AcademicForm
              defaultValues={defaultValues}
              disabled={isSubmitting}
              isSubmitting={isSubmitting}
              isEditing={isEditing}
              onSubmit={handleSubmit}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AcademicsPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i} className="h-12 bg-gray-300 dark:bg-gray-600" />
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
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

function AcademicsPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <AlertCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Failed to load academic records
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

// ============================================================================
// Icons
// ============================================================================

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

function EditIcon({ className }: { className?: string }) {
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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

function InfoIcon({ className }: { className?: string }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
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

export default StudentAcademicsPage;
