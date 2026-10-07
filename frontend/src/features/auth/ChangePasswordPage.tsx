// frontend/src/features/auth/ChangePasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./useAuth";
import { changePasswordSchema, type ChangePasswordInput } from "../../lib/validations";
import { cn } from "../../lib/utils";
import { ROUTES } from "../../lib/constants";

// ============================================================================
// Change Password Page Component
// ============================================================================

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, changePassword, logout, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Password strength indicator
  const password = watch("new_password");
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: ChangePasswordInput) => {
    setError(null);
    setSuccess(null);

    try {
      await changePassword(data.current_password, data.new_password);
      setSuccess("Password changed successfully!");

      // Clear form
      // Note: reset() would clear current_password too, which we might want to keep for UX
      // But for security, let's redirect
      setTimeout(() => {
        // Redirect based on role
        if (user?.role === "student") {
          navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
        } else {
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        }
      }, 1500);
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
      } else if (axiosError.response?.status === 400) {
        setError("Current password is incorrect");
      } else if (axiosError.response?.status === 401) {
        setError("Session expired. Please login again.");
        logout();
      } else if (axiosError.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to change password. Please try again.");
      }
    }
  };

  // If user must change password, show warning banner
  const mustChange = user?.must_change_password;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mustChange ? "Password Change Required" : "Change Password"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {mustChange
            ? "Your administrator requires you to set a new password before continuing."
            : "Update your password to keep your account secure"}
        </p>
      </div>

      {/* Must Change Password Banner */}
      {mustChange && (
        <div
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Action Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                You must change your password before accessing other pages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300"
          role="alert"
        >
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
        {/* Current Password */}
        <div>
          <label
            htmlFor="current_password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            Current Password
          </label>
          <input
            {...register("current_password")}
            id="current_password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your current password"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors",
              errors.current_password && "border-red-500 focus:ring-red-500",
              "border-gray-300 dark:border-gray-600",
            )}
            aria-invalid={errors.current_password ? "true" : "false"}
            aria-describedby={errors.current_password ? "current-error" : undefined}
            disabled={isSubmitting || authLoading}
          />
          {errors.current_password && (
            <p
              id="current-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.current_password.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="new_password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <input
              {...register("new_password")}
              id="new_password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 10 characters"
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 pr-12",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-colors",
                errors.new_password && "border-red-500 focus:ring-red-500",
                "border-gray-300 dark:border-gray-600",
              )}
              aria-invalid={errors.new_password ? "true" : "false"}
              aria-describedby={errors.new_password ? "new-password-error" : "password-hint"}
              disabled={isSubmitting || authLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Toggle password visibility"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1.5 flex-1 rounded transition-colors",
                      level <= passwordStrength.level
                        ? passwordStrength.color
                        : "bg-gray-200 dark:bg-gray-700",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Password strength: {passwordStrength.label}
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div
            id="password-hint"
            className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <p
              className={cn(
                "flex items-center gap-1.5",
                password.length >= 10 ? "text-green-600 dark:text-green-400" : "",
              )}
            >
              <svg
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  password.length >= 10 ? "text-green-500" : "text-gray-300 dark:text-gray-600",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              At least 10 characters
            </p>
            <p
              className={cn(
                "flex items-center gap-1.5",
                /[a-zA-Z]/.test(password) ? "text-green-600 dark:text-green-400" : "",
              )}
            >
              <svg
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  /[a-zA-Z]/.test(password) ? "text-green-500" : "text-gray-300 dark:text-gray-600",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Contains a letter
            </p>
            <p
              className={cn(
                "flex items-center gap-1.5",
                /[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : "",
              )}
            >
              <svg
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  /[0-9]/.test(password) ? "text-green-500" : "text-gray-300 dark:text-gray-600",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Contains a number
            </p>
            <p
              className={cn(
                "flex items-center gap-1.5",
                /[^a-zA-Z0-9]/.test(password) ? "text-green-600 dark:text-green-400" : "",
              )}
            >
              <svg
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  /[^a-zA-Z0-9]/.test(password)
                    ? "text-green-500"
                    : "text-gray-300 dark:text-gray-600",
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Contains a special character (optional)
            </p>
          </div>

          {errors.new_password && (
            <p
              id="new-password-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.new_password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            Confirm New Password
          </label>
          <input
            {...register("confirm_password")}
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your new password"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors",
              errors.confirm_password && "border-red-500 focus:ring-red-500",
              "border-gray-300 dark:border-gray-600",
            )}
            aria-invalid={errors.confirm_password ? "true" : "false"}
            aria-describedby={errors.confirm_password ? "confirm-error" : undefined}
            disabled={isSubmitting || authLoading}
          />
          {errors.confirm_password && (
            <p
              id="confirm-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.confirm_password.message}
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
              Updating...
            </span>
          ) : (
            "Change Password"
          )}
        </button>
      </form>

      {/* Back Link (only if not forced) */}
      {!mustChange && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => navigate(-1)} className="text-primary hover:underline">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Password Strength Helper
// ============================================================================

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "Very Weak", color: "bg-gray-200 dark:bg-gray-700" };

  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { level: 2, label: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { level: 3, label: "Good", color: "bg-blue-500" };
  return { level: 4, label: "Strong", color: "bg-green-500" };
}

export default ChangePasswordPage;
