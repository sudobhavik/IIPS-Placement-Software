// frontend/src/api/mocks/index.ts
import { setupWorker } from "msw/browser";
import { allHandlers } from "./handlers";

// Create the worker
export const worker = setupWorker(...allHandlers);

// Export handlers for testing
export { allHandlers } from "./handlers";
export {
  studentHandlers,
  adminStudentHandlers,
  importHandlers,
  masterDataHandlers,
  authMockHandlers,
} from "./handlers";
