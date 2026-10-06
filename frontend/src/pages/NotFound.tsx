// frontend/src/pages/NotFound.tsx
import { Link } from "react-router-dom";
import { ROUTES, useAuth } from "../features/auth/useAuth";

// ============================================================================
// Not Found Page Component
// ============================================================================

export function NotFound() {
  const { isAuthenticated, role } = useAuth();

  const getDashboardPath = () => {
    switch (role) {
      case "student":
        return ROUTES.STUDENT_DASHBOARD;
      case "admin":
      case "super_admin":
        return ROUTES.ADMIN_DASHBOARD;
      default:
        return ROUTES.LOGIN;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-2">
          Page Not Found
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't
          exist.
        </p>

        <div className="mt-6 space-y-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </Link>
          )}

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            If you think this is a mistake, please contact the placement cell.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
