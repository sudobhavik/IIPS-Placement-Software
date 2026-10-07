// frontend/src/features/imports/ImportPage.tsx
import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { importApi } from "./importApi";
import { ImportFileDropzone } from "../../components/forms/ImportFileDropzone";
import { ImportProgress } from "./ImportProgress";
import { ImportErrorsTable } from "./ImportErrorsTable";
import { toast } from "../../components/ui/Toast";
import { cn } from "../../lib/utils";
import { IMPORT_STATUS } from "../../lib/constants";
import type { ImportJobRead, StudentImportReport, ImportJobErrorRead } from "../../api/types";

// ============================================================================
// Import Page Component
// ============================================================================

export function ImportPage() {
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [importJobId, setImportJobId] = useState<number | null>(null);
  const [importReport, setImportReport] = useState<StudentImportReport | null>(null);
  const [showErrorsModal, setShowErrorsModal] = useState(false);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      importApi.importStudents(file, onProgress),
    onSuccess: (report) => {
      setImportReport(report);
      if (report.errors && report.errors.length > 0) {
        setImportJobId(report.errors[0]?.job_id ?? null);
      }
      setUploadProgress(null);
      setSelectedFile(null);

      if (report.failed_rows > 0) {
        toast.warning(
          `${report.failed_rows} row${report.failed_rows !== 1 ? "s" : ""} failed. Click "View Errors" for details.`,
        );
      } else {
        toast.success(
          `Successfully imported ${report.imported_rows} student${report.imported_rows !== 1 ? "s" : ""}!`,
        );
      }
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };
      const detail = axiosError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Import failed";
      toast.error(message);
      setUploadProgress(null);
    },
  });

  // Poll job status
  useQuery<ImportJobRead>({
    queryKey: ["import", "job", importJobId],
    queryFn: () => importApi.getImportJob(importJobId!),
    enabled: !!importJobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      return [IMPORT_STATUS.PENDING, IMPORT_STATUS.RUNNING].includes(data.status) ? 2000 : false;
    },
    staleTime: 0,
  });

  // Sync importJobId whenever report updates with errors
  useEffect(() => {
    if (importReport?.errors && importReport.errors.length > 0) {
      setImportJobId(importReport.errors[0].job_id);
    }
  }, [importReport]);

  // Fetch errors when modal opens
  const { data: jobErrors = [], isLoading: errorsLoading } = useQuery<ImportJobErrorRead[]>({
    queryKey: ["import", "errors", importJobId],
    queryFn: () => importApi.getImportErrors(importJobId!),
    enabled: !!importJobId && showErrorsModal,
    staleTime: 0,
  });

  // File selection handler
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setImportReport(null);
    setImportJobId(null);
    setShowErrorsModal(false);
  }, []);

  // Upload handler
  const handleUpload = useCallback(() => {
    if (selectedFile) {
      setUploadProgress(0);
      uploadMutation.mutate({ file: selectedFile, onProgress: setUploadProgress });
    }
  }, [selectedFile, uploadMutation]);

  // Clear current import
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(null);
    setImportReport(null);
    setImportJobId(null);
    setShowErrorsModal(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Import</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload Excel file (.xlsx/.xls) to bulk import student data
          </p>
        </div>
      </div>

      {/* Upload Section */}
      {!importReport && (
        <>
          <ImportFileDropzone
            onFileSelect={handleFileSelect}
            onProgress={setUploadProgress}
            disabled={uploadMutation.isPending}
          />

          {/* Upload Button */}
          {selectedFile && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium text-white transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                  "disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90",
                )}
              >
                {uploadMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Importing...
                  </span>
                ) : (
                  "Import Students"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Progress */}
      {uploadProgress !== null && !importReport && <UploadProgressBar progress={uploadProgress} />}

      {/* Import Results */}
      {importReport && (
        <ImportProgress
          status={
            importReport.failed_rows === importReport.total_rows
              ? IMPORT_STATUS.FAILED
              : IMPORT_STATUS.COMPLETED
          }
          totalRows={importReport.total_rows}
          successRows={importReport.imported_rows}
          failedRows={importReport.failed_rows}
          warnings={importReport.warnings}
          placedFlagIgnored={importReport.placed_flag_ignored}
          startedAt={importReport.errors[0]?.created_at || new Date().toISOString()}
          finishedAt={new Date().toISOString()}
          onRetry={handleClear}
          onViewErrors={importReport.failed_rows > 0 ? () => setShowErrorsModal(true) : undefined}
        />
      )}

      {/* Errors Modal */}
      {showErrorsModal && importJobId && (
        <ImportErrorsModal
          jobId={importJobId}
          errors={jobErrors}
          isLoading={errorsLoading}
          onClose={() => setShowErrorsModal(false)}
        />
      )}

      {/* Info Section */}
      <ImportInfoSection />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function UploadProgressBar({ progress }: { progress: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Uploading...</h3>
        <span className="text-sm font-medium text-primary">{progress}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
        Please wait while the file is uploaded...
      </p>
    </div>
  );
}

function ImportErrorsModal({
  jobId,
  errors,
  isLoading,
  onClose,
}: {
  jobId: number;
  errors: ImportJobErrorRead[];
  isLoading: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="errors-modal-title"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative min-h-full p-4 flex items-center justify-center">
        <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-xl z-10">
            <h2
              id="errors-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Import Errors - Job #{jobId}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
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
          <div className="p-6 max-h-[70vh] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
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
              </div>
            ) : (
              <ImportErrorsTable jobId={jobId} errors={errors} onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportInfoSection() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Import Guidelines
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">File Requirements</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>Format: .xlsx or .xls (Excel)</li>
            <li>Maximum size: 10MB</li>
            <li>Sheet name must be "Complete Data"</li>
            <li>First row must contain headers</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Required Columns</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>email</li>
            <li>full_name</li>
            <li>enrollment_no (format: D[A-Z]XXXXXXX)</li>
            <li>course (MCA, MTECH_IT, etc.)</li>
            <li>tenth_percent, twelfth_percent</li>
            <li>ug_cgpa, current_cgpa</li>
            <li>backlogs</li>
            <li>roll_no (format: BR-2KYY-NN)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Optional Columns</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>gender (male/female/other/prefer_not_to_say)</li>
            <li>dob (YYYY-MM-DD)</li>
            <li>personal_no, guardian_no</li>
            <li>is_debarred (true/false)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Validation Rules</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>Enrollment numbers must be unique</li>
            <li>Roll numbers must be unique</li>
            <li>Emails must be valid and unique</li>
            <li>Percentages: 0-100, CGPA: 0-10</li>
            <li>Course must exist in master data</li>
            <li>Duplicate rows are skipped</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/api/v1/import/template/students"
          download="student_import_template.xlsx"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Sample Template
        </a>
      </div>
    </div>
  );
}

export default ImportPage;
