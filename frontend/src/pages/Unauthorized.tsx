// frontend/src/pages/Unauthorized.tsx
import { Link } from "react-router-dom";
import { ROUTES, USER_ROLES } from "../lib/constants";
import { useAuth } from "../features/auth/useAuth";

// ============================================================================
// Unauthorized Page Component
// ============================================================================

export function Unauthorized() {
  const { role, logout } = useAuth();

  const getRedirectPath = () => {
    switch (role) {
      case USER_ROLES.STUDENT:
        return ROUTES.STUDENT_DASHBOARD;
      case USER_ROLES.ADMIN:
      case USER_ROLES.SUPER_ADMIN:
        return ROUTES.ADMIN_DASHBOARD;
      default:
        return ROUTES.LOGIN;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <svg
          className="mx-auto h-16 w-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h1>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          You don't have permission to access this page.{" "}
          {role
            ? `Your role: <strong className="capitalize">{role.replace('_', ' ')}</strong>`
            : "Please log in."}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to={getRedirectPath()}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>

          {role && (
            <button
              onClick={logout}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Switch Account
            </button>
          )}

          {!role && (
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
