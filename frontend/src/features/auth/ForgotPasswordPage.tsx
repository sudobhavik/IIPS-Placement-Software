// frontend/src/features/auth/ForgotPasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "./authApi";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../../lib/validations";
import { cn } from "../../lib/utils";
import { ROUTES } from "../../lib/constants";

// ============================================================================
// Forgot Password Page Component
// ============================================================================

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);

    try {
      await authApi.forgotPassword(data);
      setSubmitted(true);
      setSuccess("If the email exists, a password reset link has been sent.");
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { detail?: string | Array<{ msg: string }> } };
      };

      // Don't reveal if email exists (security)
      // Always show success message but log error
      console.error("Forgot password error:", err);
      setSubmitted(true);
      setSuccess("If the email exists, a password reset link has been sent.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Success State */}
      {submitted && (
        <div
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
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
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !submitted && (
        <div
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
            >
              Email Address
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="student@iips.edu.in"
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-colors",
                errors.email && "border-red-500 focus:ring-red-500",
                "border-gray-300 dark:border-gray-600",
              )}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-medium text-white",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-primary hover:bg-primary/90",
            )}
          >
            {isSubmitting ? (
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
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      )}

      {/* Back to Login */}
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <button onClick={() => navigate(ROUTES.LOGIN)} className="text-primary hover:underline">
          ← Back to Login
        </button>
      </div>

      {/* Note about backend */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
        <p className="font-medium">Note:</p>
        <p className="mt-1">
          Password reset functionality is not yet implemented in the backend. This page is a
          placeholder for future implementation.
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
