// frontend/src/features/imports/importApi.ts - Keep using proxy
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../lib/constants";
import type { StudentImportReport, ImportJobRead, ImportJobErrorRead } from "../../api/types";

export const importApi = {
  importStudents: (file: File, onProgress?: (p: number) => void) =>
    apiRequest.upload<StudentImportReport>(API_ENDPOINTS.IMPORTS_STUDENTS, file, onProgress),

  getImportJob: (id: number) => apiRequest.get<ImportJobRead>(API_ENDPOINTS.IMPORTS_JOB(id)),

  getImportErrors: (id: number) =>
    apiRequest.get<ImportJobErrorRead[]>(API_ENDPOINTS.IMPORTS_JOB_ERRORS(id)),
};
