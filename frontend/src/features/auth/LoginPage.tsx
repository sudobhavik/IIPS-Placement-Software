// frontend/src/features/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./useAuth";
import { loginSchema, type LoginInput } from "../../lib/validations";
import { cn } from "../../lib/utils";
import { ROUTES } from "../../lib/constants";

// ============================================================================
// Login Page Component
// ============================================================================

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get redirect from query params
  const redirect = searchParams.get("redirect") || ROUTES.STUDENT_DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setSuccess(null);

    try {
      await login(data.identifier, data.password);
      // Redirect based on role (handled by AuthProvider/app routes)
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };

      if (axiosError.response?.data?.detail) {
        const detail = axiosError.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg).join(", "));
        } else {
          setError(detail);
        }
      } else if (axiosError.response?.status === 401) {
        setError("Invalid email/enrollment or password");
      } else if (axiosError.response?.status === 429) {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your PlaceIQ account</p>
      </div>

      {/* Success Message (e.g., after activation) */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Identifier Field */}
        <div>
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            Email or Enrollment Number
          </label>
          <input
            {...register("identifier")}
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="student@iips.edu.in or DCS23MCA001"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors",
              errors.identifier && "border-red-500 focus:ring-red-500",
              "border-gray-300 dark:border-gray-600",
            )}
            aria-invalid={errors.identifier ? "true" : "false"}
            aria-describedby={errors.identifier ? "identifier-error" : undefined}
            disabled={isSubmitting || authLoading}
          />
          {errors.identifier && (
            <p
              id="identifier-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Password
            </label>
            <a href={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary hover:text-primary/80">
              Forgot password?
            </a>
          </div>
          <input
            {...register("password")}
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors",
              errors.password && "border-red-500 focus:ring-red-500",
              "border-gray-300 dark:border-gray-600",
            )}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={isSubmitting || authLoading}
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg font-medium text-white",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-primary hover:bg-primary/90",
          )}
        >
          {isSubmitting || authLoading ? (
            <span className="flex items-center justify-center gap-2">
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
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>New to PlaceIQ? Contact your placement cell for account activation.</p>
      </div>

      {/* Demo Credentials (Dev only) */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Demo Credentials (Development)
          </p>
          <div className="space-y-1 text-sm font-mono text-gray-600 dark:text-gray-400">
            <p>
              <strong>Admin:</strong> admin@iips.edu.in / SecurePass123
            </p>
            <p>
              <strong>Student:</strong> student@iips.edu.in / student123456
            </p>
            <p>
              <strong>Enrollment:</strong> DCS23MCA001 / student123456
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
