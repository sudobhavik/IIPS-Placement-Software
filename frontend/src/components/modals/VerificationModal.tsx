// frontend/src/components/modals/VerificationModal.tsx
import { useForm, Controller } from "react-hook-form";
import { cn } from "../../lib/utils";
import { VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from "../../lib/constants";
import type { VerificationStatus } from "../../lib/constants";
import { Input, Textarea, Select } from "../forms/FormField";

// ============================================================================
// Verification Modal Component
// ============================================================================

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { id: number; enrollment_no: string; user: { full_name: string } } | null;
  currentStatus: VerificationStatus | null;
  onSubmit: (data: { verification_status: VerificationStatus; remarks: string | null }) => void;
  isSubmitting: boolean;
}

export function VerificationModal({
  isOpen,
  onClose,
  student,
  currentStatus,
  onSubmit,
  isSubmitting,
}: VerificationModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<{ verification_status: VerificationStatus; remarks: string }>({
    defaultValues: {
      verification_status: currentStatus || VERIFICATION_STATUS.PENDING,
      remarks: "",
    },
    mode: "onChange",
  });

  const selectedStatus = watch("verification_status");
  const showRemarks = selectedStatus === VERIFICATION_STATUS.REJECTED;

  const handleFormSubmit = (data: { verification_status: VerificationStatus; remarks: string }) => {
    onSubmit({
      verification_status: data.verification_status,
      remarks: data.remarks || null,
    });
  };

  if (!isOpen || !student) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative min-h-full p-4 flex items-center justify-center">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-xl">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Verify Student
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
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

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
            {/* Student Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {student.user.full_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {student.enrollment_no}
              </p>
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Current Status:</span>
              <CurrentStatusBadge status={currentStatus} />
            </div>

            {/* New Status */}
            <Controller
              name="verification_status"
              control={control}
              render={({ field }) => (
                <Select
                  label="New Verification Status"
                  options={[
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
                  placeholder="Select status"
                  disabled={isSubmitting}
                  {...field}
                  error={errors.verification_status?.message}
                />
              )}
            />

            {/* Remarks (conditional) */}
            {showRemarks && (
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Remarks (Required for Rejection)"
                    placeholder="Explain why this profile is being rejected..."
                    rows={3}
                    disabled={isSubmitting}
                    {...field}
                    error={errors.remarks?.message}
                  />
                )}
              />
            )}

            {!showRemarks && (
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <Textarea
                    label="Remarks (Optional)"
                    placeholder="Add any notes about this verification..."
                    rows={3}
                    disabled={isSubmitting}
                    {...field}
                    error={errors.remarks?.message}
                  />
                )}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                  selectedStatus === VERIFICATION_STATUS.VERIFIED
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : selectedStatus === VERIFICATION_STATUS.REJECTED
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  `Mark as ${VERIFICATION_STATUS_LABELS[selectedStatus] || selectedStatus}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Current Status Badge
// ============================================================================

function CurrentStatusBadge({ status }: { status: VerificationStatus | null }) {
  if (!status) return <span className="text-sm text-gray-500 dark:text-gray-400">Unknown</span>;

  const styles = {
    [VERIFICATION_STATUS.PENDING]:
      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    [VERIFICATION_STATUS.VERIFIED]:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
    [VERIFICATION_STATUS.REJECTED]: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium",
        styles[status] || styles[VERIFICATION_STATUS.PENDING],
      )}
    >
      {VERIFICATION_STATUS_LABELS[status] || status}
    </span>
  );
}

export default VerificationModal;
