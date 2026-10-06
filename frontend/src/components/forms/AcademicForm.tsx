// frontend/src/components/forms/AcademicForm.tsx
import { useForm, Controller } from "react-hook-form";
import { cn } from "../../lib/utils";
import { Input, Select, Textarea } from "./FormField";
import { ACADEMIC_LEVELS, ACADEMIC_LEVEL_LABELS, ACADEMIC_LEVEL_ORDER } from "../../lib/constants";
import type { StudentAcademicFormData } from "../../api/types";

// ============================================================================
// Academic Level Options
// ============================================================================

const academicLevelOptions = ACADEMIC_LEVEL_ORDER.map((level) => ({
  value: level,
  label: ACADEMIC_LEVEL_LABELS[level],
}));

// ============================================================================
// AcademicForm Component
// ============================================================================

interface AcademicFormProps {
  defaultValues?: Partial<StudentAcademicFormData>;
  disabled?: boolean;
  onSubmit: (data: StudentAcademicFormData) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  isEditing?: boolean;
  className?: string;
}

export function AcademicForm({
  defaultValues,
  disabled = false,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
  isEditing = false,
  className,
}: AcademicFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
  } = useForm<StudentAcademicFormData>({
    defaultValues: {
      level: ACADEMIC_LEVELS.GRADUATION,
      institution: "",
      stream: "",
      year_of_passing: null,
      percentage: null,
      cgpa: null,
      ...defaultValues,
    },
    mode: "onChange",
  });

  const level = watch("level");
  const showPercentage = level !== ACADEMIC_LEVELS.POST_GRADUATION;
  const showCGPA =
    level === ACADEMIC_LEVELS.GRADUATION || level === ACADEMIC_LEVELS.POST_GRADUATION;

  const onFormSubmit = async (data: StudentAcademicFormData) => {
    const cleanedData: StudentAcademicFormData = {
      ...data,
      institution: data.institution || null,
      stream: data.stream || null,
      year_of_passing: data.year_of_passing || null,
      percentage: data.percentage || null,
      cgpa: data.cgpa || null,
    };
    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={cn("space-y-6", className)} noValidate>
      {/* Academic Level (read-only if editing) */}
      <Controller
        name="level"
        control={control}
        render={({ field }) => (
          <Select
            label="Academic Level"
            options={academicLevelOptions}
            placeholder="Select level"
            disabled={disabled || isEditing}
            {...field}
            error={errors.level?.message}
          />
        )}
      />

      {/* Institution & Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="institution"
          control={control}
          render={({ field }) => (
            <Input
              label="Institution / Board / University"
              placeholder="e.g., Mumbai University, CBSE, IIT Delhi"
              disabled={disabled}
              {...field}
              error={errors.institution?.message}
            />
          )}
        />

        <Controller
          name="stream"
          control={control}
          render={({ field }) => (
            <Input
              label="Stream / Specialization"
              placeholder="e.g., Computer Science, PCM, Commerce"
              disabled={disabled}
              {...field}
              error={errors.stream?.message}
            />
          )}
        />
      </div>

      {/* Year & Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Controller
          name="year_of_passing"
          control={control}
          render={({ field }) => (
            <Input
              label="Year of Passing"
              type="number"
              min={1990}
              max={new Date().getFullYear() + 2}
              placeholder="2023"
              disabled={disabled}
              {...field}
              error={errors.year_of_passing?.message}
            />
          )}
        />

        {showPercentage && (
          <Controller
            name="percentage"
            control={control}
            render={({ field }) => (
              <Input
                label="Percentage (%)"
                type="number"
                step="0.01"
                min={0}
                max={100}
                placeholder="85.50"
                disabled={disabled}
                {...field}
                error={errors.percentage?.message}
              />
            )}
          />
        )}

        {showCGPA && (
          <Controller
            name="cgpa"
            control={control}
            render={({ field }) => (
              <Input
                label="CGPA"
                type="number"
                step="0.01"
                min={0}
                max={10}
                placeholder="8.50"
                disabled={disabled}
                {...field}
                error={errors.cgpa?.message}
              />
            )}
          />
        )}
      </div>

      {/* Validation Hints */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-2">Validation Rules:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Percentage must be between 0 and 100</li>
          <li>CGPA must be between 0 and 10</li>
          <li>Year of passing must be a valid year</li>
          {!showPercentage && (
            <li className="text-primary">Percentage is not required for Post Graduation level</li>
          )}
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={disabled || isSubmitting || !isValid}
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium text-white",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-primary hover:bg-primary/90",
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
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
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

export default AcademicForm;
