// frontend/src/features/admin/adminApi.ts
import { studentApi } from "../student/studentApi";

// Re-export student admin functions
export const adminApi = {
  listStudents: studentApi.listStudents,
  getStudent: studentApi.getStudent,
  getStudentAcademics: studentApi.getStudentAcademics,
  verifyStudent: studentApi.verifyStudent,
};
