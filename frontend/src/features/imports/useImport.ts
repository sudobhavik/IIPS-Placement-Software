// frontend/src/features/imports/useImport.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { importApi } from "./importApi";
import { toast } from "../../components/ui/Toast";
import { IMPORT_STATUS } from "../../lib/constants";
import type { StudentImportReport, ImportJobRead, ImportJobErrorRead } from "../../api/types";
import { useState, useEffect } from "react";

export function useImport() {
  const queryClient = useQueryClient();
  const [importJobId, setImportJobId] = useState<number | null>(null);
  const [importReport, setImportReport] = useState<StudentImportReport | null>(null);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [jobErrors, setJobErrors] = useState<ImportJobErrorRead[]>([]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      importApi.importStudents(file, onProgress),
    onSuccess: (report) => {
      setImportReport(report);
      setImportJobId(report.errors.length > 0 ? report.errors[0]?.job_id || null : null);
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
    },
  });

  // Poll job status
  const { data: jobStatus } = useQuery<ImportJobRead>({
    queryKey: ["import", "job", importJobId],
    queryFn: () => importApi.getImportJob(importJobId!),
    enabled:
      !!importJobId &&
      [IMPORT_STATUS.PENDING, IMPORT_STATUS.RUNNING].includes(
        jobStatus?.status || IMPORT_STATUS.PENDING,
      ),
    refetchInterval: (query) => {
      if (!query.state.data) return 2000;
      return [IMPORT_STATUS.PENDING, IMPORT_STATUS.RUNNING].includes(query.state.data.status)
        ? 2000
        : false;
    },
    staleTime: 0,
  });

  // Fetch errors when modal opens
  const { data: errorsData, isLoading: errorsLoading } = useQuery<ImportJobErrorRead[]>({
    queryKey: ["import", "errors", importJobId],
    queryFn: () => importApi.getImportErrors(importJobId!),
    enabled: !!importJobId && true,
    staleTime: 0,
  });

  const handleUpload = (file: File, onProgress?: (p: number) => void) => {
    uploadMutation.mutate({ file, onProgress });
  };

  const handleViewErrors = () => setShowErrorsModal(true);
  const handleCloseErrors = () => setShowErrorsModal(false);
  const handleRetry = () => {
    setImportReport(null);
    setImportJobId(null);
  };

  // Sync errors data
  useEffect(() => {
    if (errorsData) setJobErrors(errorsData);
  }, [errorsData]);

  // Sync jobId from report
  useEffect(() => {
    if (importReport && importReport.errors.length > 0) {
      setImportJobId(importReport.errors[0].job_id);
    }
  }, [importReport]);

  return {
    uploadMutation,
    importReport,
    importJobId,
    jobStatus,
    jobErrors,
    errorsLoading,
    showErrorsModal,
    setShowErrorsModal,
    handleUpload,
    handleViewErrors: () => setShowErrorsModal(true),
    handleCloseErrors: () => setShowErrorsModal(false),
    handleRetry,
    isUploading: uploadMutation.isPending,
    isPolling: [IMPORT_STATUS.PENDING, IMPORT_STATUS.RUNNING].includes(jobStatus?.status || ""),
  };
}

export { useImport };
