// frontend/src/features/student/studentApi.ts
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../lib/constants";
import type {
  StudentRead,
  StudentUpdate,
  StudentListParams,
  StudentListResponse,
  StudentAcademicRead,
  StudentAcademicCreate,
  StudentAcademicUpdate,
  StudentVerify,
} from "../../api/types";

export const studentApi = {
  // Student self-service
  getMyProfile: () => apiRequest.get<StudentRead>(API_ENDPOINTS.STUDENTS_ME),

  updateMyProfile: (data: StudentUpdate) =>
    apiRequest.patch<StudentRead>(API_ENDPOINTS.STUDENTS_ME, data),

  getMyAcademics: () => apiRequest.get<StudentAcademicRead[]>(API_ENDPOINTS.STUDENTS_ME_ACADEMICS),

  createAcademic: (data: StudentAcademicCreate) =>
    apiRequest.post<StudentAcademicRead>(API_ENDPOINTS.STUDENTS_ME_ACADEMICS, data),

  updateAcademic: (id: number, data: StudentAcademicUpdate) =>
    apiRequest.put<StudentAcademicRead>(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}/${id}`, data),

  deleteAcademic: (id: number) => apiRequest.delete(`${API_ENDPOINTS.STUDENTS_ME_ACADEMICS}/${id}`),

  // Admin endpoints
  listStudents: (params: StudentListParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) searchParams.append(key, String(value));
    });
    return apiRequest.get<StudentListResponse>(
      `${API_ENDPOINTS.STUDENTS_LIST}?${searchParams.toString()}`,
    );
  },

  getStudent: (id: number) => apiRequest.get<StudentRead>(API_ENDPOINTS.STUDENTS_DETAIL(id)),

  getStudentAcademics: (id: number) =>
    apiRequest.get<StudentAcademicRead[]>(API_ENDPOINTS.STUDENTS_ACADEMICS(id)),

  verifyStudent: (id: number, data: StudentVerify) =>
    apiRequest.patch<StudentRead>(API_ENDPOINTS.STUDENTS_VERIFY(id), data),
};
