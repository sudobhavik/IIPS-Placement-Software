// frontend/src/components/forms/FormField.tsx
import { forwardRef, ReactNode } from "react";
import { cn } from "../../lib/utils";

// ============================================================================
// FormField - Wrapper for consistent form field styling
// ============================================================================

export interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  htmlFor?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, hint, error, children, className, required, htmlFor, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
        {label && (
          <label
            htmlFor={htmlFor}
            className={cn(
              "block text-sm font-medium text-gray-700 dark:text-gray-200",
              required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">{children}</div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  },
);

FormField.displayName = "FormField";

// ============================================================================
// Input Component
// ============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, iconPosition = "left", className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <FormField label={label} hint={hint} error={error} htmlFor={inputId}>
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              "border-gray-300 dark:border-gray-600",
              error && "border-red-500 focus:ring-red-500",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className,
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </FormField>
    );
  },
);

Input.displayName = "Input";

// ============================================================================
// Textarea Component
// ============================================================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <FormField label={label} hint={hint} error={error} htmlFor={textareaId}>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
            "text-gray-900 dark:text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-y",
            "border-gray-300 dark:border-gray-600",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
      </FormField>
    );
  },
);

Textarea.displayName = "Textarea";

// ============================================================================
// Select Component
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <FormField label={label} hint={hint} error={error} htmlFor={selectId}>
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800",
            "text-gray-900 dark:text-white",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            "border-gray-300 dark:border-gray-600",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  },
);

Select.displayName = "Select";

// ============================================================================
// Checkbox Component
// ============================================================================

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <FormField error={error} htmlFor={checkboxId}>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "mt-1 h-4 w-4 rounded border-gray-300 text-primary",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
              "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500",
              className,
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${checkboxId}-error` : hint ? `${checkboxId}-hint` : undefined
            }
            {...props}
          />
          <div className="flex flex-col">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              {label}
            </label>
            {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </FormField>
    );
  },
);

Checkbox.displayName = "Checkbox";
